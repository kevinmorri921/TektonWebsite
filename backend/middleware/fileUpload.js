// middleware/fileUpload.js - Secure file upload handling

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import logger from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const UPLOAD_DIR = path.join(__dirname, "../uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/csv",
  "application/json",
];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".csv", ".json"];

/**
 * Ensure upload directory exists
 */
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    logger.info("📁 Created upload directory: %s", UPLOAD_DIR);
  }
  return UPLOAD_DIR;
}

/**
 * Validate file extension
 * @param {string} filename - Original filename
 * @returns {boolean} - True if extension is allowed
 */
export function isAllowedExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Validate MIME type
 * @param {string} mimeType - MIME type to validate
 * @returns {boolean} - True if MIME type is allowed
 */
export function isAllowedMimeType(mimeType) {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @returns {boolean} - True if size is within limit
 */
export function isAllowedFileSize(size) {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 * @param {string} originalFilename - Original filename from upload
 * @returns {string} - Safe filename
 */
export function sanitizeFilename(originalFilename) {
  // Remove path traversal attempts
  let safe = path.basename(originalFilename);

  // Remove potentially dangerous characters
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Prevent double extensions (e.g., .php.jpg)
  const parts = safe.split(".");
  if (parts.length > 2) {
    const ext = parts.pop();
    const name = parts.join("_");
    safe = `${name}.${ext}`;
  }

  // Limit filename length
  if (safe.length > 255) {
    const ext = path.extname(safe);
    const name = safe.substring(0, 240 - ext.length);
    safe = `${name}${ext}`;
  }

  // Add timestamp to ensure uniqueness
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  const ext = path.extname(safe);
  const name = path.basename(safe, ext);

  return `${name}_${timestamp}_${random}${ext}`;
}

/**
 * Calculate file hash (SHA-256) for integrity verification
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - Hex-encoded SHA-256 hash
 */
export function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

/**
 * Verify file hash integrity
 * @param {string} filePath - Path to file
 * @param {string} expectedHash - Expected SHA-256 hash
 * @returns {Promise<boolean>} - True if hash matches
 */
export async function verifyFileHash(filePath, expectedHash) {
  const actualHash = await calculateFileHash(filePath);
  return actualHash === expectedHash;
}

/**
 * Express middleware for file upload validation
 * Usage: app.post('/upload', fileUploadValidation, (req, res) => {...})
 */
export function fileUploadValidation(req, res, next) {
  try {
    // Check if file exists in request
    if (!req.file && !req.files) {
      return res.status(400).json({
        error: "No file provided",
        code: "NO_FILE",
      });
    }

    const file = req.file || req.files[0];

    // Validate file size
    if (!isAllowedFileSize(file.size)) {
      logger.warn(
        "📁 File upload rejected - Size limit exceeded: %d bytes (max: %d)",
        file.size,
        MAX_FILE_SIZE
      );
      return res.status(413).json({
        error: `File size exceeds limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        code: "FILE_TOO_LARGE",
        maxSize: MAX_FILE_SIZE,
      });
    }

    // Validate file extension
    if (!isAllowedExtension(file.originalname)) {
      logger.warn(
        "📁 File upload rejected - Invalid extension: %s (allowed: %s)",
        path.extname(file.originalname),
        ALLOWED_EXTENSIONS.join(", ")
      );
      return res.status(400).json({
        error: "File type not allowed",
        code: "INVALID_FILE_TYPE",
        allowed: ALLOWED_EXTENSIONS,
      });
    }

    // Validate MIME type
    if (!isAllowedMimeType(file.mimetype)) {
      logger.warn(
        "📁 File upload rejected - Invalid MIME type: %s (allowed: %s)",
        file.mimetype,
        ALLOWED_MIME_TYPES.join(", ")
      );
      return res.status(400).json({
        error: "MIME type not allowed",
        code: "INVALID_MIME_TYPE",
        allowed: ALLOWED_MIME_TYPES,
      });
    }

    // Store validation metadata on request for downstream handlers
    req.fileValidation = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadDir: ensureUploadDir(),
    };

    logger.info(
      "✅ File upload validation passed - %s (%s, %d bytes)",
      file.originalname,
      file.mimetype,
      file.size
    );

    next();
  } catch (error) {
    logger.error("🔥 File upload validation error: %o", error);
    res.status(500).json({
      error: "File validation failed",
      code: "VALIDATION_ERROR",
    });
  }
}

/**
 * Save uploaded file securely
 * @param {object} file - Express file object
 * @returns {Promise<object>} - {path, filename, hash}
 */
export async function saveUploadedFile(file) {
  try {
    const uploadDir = ensureUploadDir();
    const safeFilename = sanitizeFilename(file.originalname);
    const filePath = path.join(uploadDir, safeFilename);

    // Write file
    fs.writeFileSync(filePath, file.buffer);

    // Calculate hash for integrity verification
    const hash = await calculateFileHash(filePath);

    logger.info(
      "📁 File saved successfully - %s (hash: %s)",
      safeFilename,
      hash.substring(0, 16) + "..."
    );

    return {
      path: filePath,
      filename: safeFilename,
      hash: hash,
      size: file.size,
      mimeType: file.mimetype,
    };
  } catch (error) {
    logger.error("🔥 Error saving uploaded file: %o", error);
    throw error;
  }
}

/**
 * Delete uploaded file
 * @param {string} filename - Filename to delete
 * @returns {Promise<boolean>} - True if deleted
 */
export async function deleteUploadedFile(filename) {
  try {
    const uploadDir = ensureUploadDir();
    const filePath = path.join(uploadDir, filename);

    // Security: Ensure file is within upload directory
    if (!filePath.startsWith(uploadDir)) {
      throw new Error("Path traversal attempt detected");
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info("📁 File deleted - %s", filename);
      return true;
    }

    return false;
  } catch (error) {
    logger.error("🔥 Error deleting uploaded file: %o", error);
    throw error;
  }
}

/**
 * Get file info for verification
 * @param {string} filename - Filename to check
 * @returns {Promise<object|null>} - File info or null if not found
 */
export async function getFileInfo(filename) {
  try {
    const uploadDir = ensureUploadDir();
    const filePath = path.join(uploadDir, filename);

    // Security: Ensure file is within upload directory
    if (!filePath.startsWith(uploadDir)) {
      throw new Error("Path traversal attempt detected");
    }

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const hash = await calculateFileHash(filePath);

    return {
      filename,
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      hash: hash,
    };
  } catch (error) {
    logger.error("🔥 Error getting file info: %o", error);
    throw error;
  }
}

export default {
  ensureUploadDir,
  isAllowedExtension,
  isAllowedMimeType,
  isAllowedFileSize,
  sanitizeFilename,
  calculateFileHash,
  verifyFileHash,
  fileUploadValidation,
  saveUploadedFile,
  deleteUploadedFile,
  getFileInfo,
};
