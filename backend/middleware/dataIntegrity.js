// middleware/dataIntegrity.js - Data integrity verification and checksums

import crypto from "crypto";
import logger from "../logger.js";

/**
 * Calculate SHA-256 hash of data
 * @param {any} data - Data to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
export function calculateDataHash(data) {
  const jsonString = JSON.stringify(data);
  return crypto.createHash("sha256").update(jsonString).digest("hex");
}

/**
 * Calculate hash of multiple fields (for composite integrity checks)
 * @param {object} fields - Object with fields to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
export function calculateCompositeHash(fields) {
  const sorted = Object.keys(fields)
    .sort()
    .reduce((acc, key) => {
      acc[key] = fields[key];
      return acc;
    }, {});

  return calculateDataHash(sorted);
}

/**
 * Verify data integrity by comparing hashes
 * @param {any} data - Current data
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} - True if hashes match
 */
export function verifyDataIntegrity(data, expectedHash) {
  const actualHash = calculateDataHash(data);
  return actualHash === expectedHash;
}

/**
 * Add integrity metadata to MongoDB document
 * Usage: doc.integrity = addIntegrityMetadata(doc)
 * @param {object} data - Data to protect
 * @returns {object} - {hash, timestamp, version}
 */
export function addIntegrityMetadata(data) {
  return {
    hash: calculateDataHash(data),
    timestamp: new Date(),
    version: 1,
  };
}

/**
 * Update integrity metadata after changes
 * @param {object} oldIntegrity - Previous integrity metadata
 * @param {object} newData - Updated data
 * @returns {object} - Updated integrity metadata
 */
export function updateIntegrityMetadata(oldIntegrity, newData) {
  return {
    hash: calculateDataHash(newData),
    timestamp: new Date(),
    version: (oldIntegrity?.version || 0) + 1,
    previousHash: oldIntegrity?.hash,
  };
}

/**
 * Detect unauthorized data modification
 * @param {object} storedData - Data from database
 * @param {object} storedIntegrity - Integrity metadata from database
 * @returns {boolean} - True if data has been tampered with
 */
export function hasDataBeenTampered(storedData, storedIntegrity) {
  if (!storedIntegrity || !storedIntegrity.hash) {
    logger.warn("🚨 [INTEGRITY] Missing integrity metadata");
    return true;
  }

  const currentHash = calculateDataHash(storedData);
  const isTampered = currentHash !== storedIntegrity.hash;

  if (isTampered) {
    logger.error(
      "🚨 [INTEGRITY] Data tampering detected! Expected: %s, Got: %s",
      storedIntegrity.hash.substring(0, 16) + "...",
      currentHash.substring(0, 16) + "..."
    );
  }

  return isTampered;
}

/**
 * Generate cryptographic signature for data
 * @param {object} data - Data to sign
 * @param {string} secret - Secret key for HMAC
 * @returns {string} - Hex-encoded HMAC-SHA256 signature
 */
export function generateDataSignature(data, secret) {
  const jsonString = JSON.stringify(data);
  return crypto.createHmac("sha256", secret).update(jsonString).digest("hex");
}

/**
 * Verify data signature
 * @param {object} data - Data to verify
 * @param {string} signature - Expected signature
 * @param {string} secret - Secret key for HMAC
 * @returns {boolean} - True if signature is valid
 */
export function verifyDataSignature(data, signature, secret) {
  const expectedSignature = generateDataSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/**
 * Middleware to attach data integrity helpers to request
 * Usage: app.use(integrityMiddleware)
 */
export function integrityMiddleware(req, res, next) {
  // Attach helper methods to request
  req.integrity = {
    calculate: calculateDataHash,
    verify: verifyDataIntegrity,
    addMetadata: addIntegrityMetadata,
    updateMetadata: updateIntegrityMetadata,
    sign: generateDataSignature,
    verifySignature: verifyDataSignature,
    checkTampering: hasDataBeenTampered,
  };

  next();
}

/**
 * Middleware to validate request body integrity
 * Checks for X-Checksum header
 * Usage: app.post('/critical-endpoint', checksumValidation, handler)
 */
export function checksumValidation(req, res, next) {
  try {
    const providedChecksum = req.headers["x-checksum"];
    const providedTimestamp = req.headers["x-timestamp"];

    // If checksums provided, verify them
    if (providedChecksum) {
      const expectedChecksum = calculateDataHash(req.body);

      if (providedChecksum !== expectedChecksum) {
        logger.warn(
          "🚨 [INTEGRITY] Checksum validation failed for %s %s",
          req.method,
          req.path
        );
        return res.status(400).json({
          error: "Data integrity check failed",
          code: "CHECKSUM_MISMATCH",
        });
      }

      logger.info("✅ [INTEGRITY] Checksum validated for %s %s", req.method, req.path);
    }

    // Attach helpers to request
    req.integrity = {
      calculate: calculateDataHash,
      verify: verifyDataIntegrity,
    };

    next();
  } catch (error) {
    logger.error("🔥 [INTEGRITY] Checksum validation error: %o", error);
    res.status(500).json({
      error: "Integrity validation error",
      code: "VALIDATION_ERROR",
    });
  }
}

/**
 * Helper to create atomic database transactions for data consistency
 * Note: Requires MongoDB session support (MongoDB 3.6+)
 * Usage: const session = await startTransaction(); await operation(session); await commitTransaction(session);
 */
export async function startTransaction(mongooseConnection) {
  const session = await mongooseConnection.startSession();
  session.startTransaction();
  return session;
}

/**
 * Commit transaction
 */
export async function commitTransaction(session) {
  try {
    await session.commitTransaction();
    logger.info("✅ Transaction committed successfully");
  } catch (error) {
    logger.error("🔥 Error committing transaction: %o", error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Rollback transaction on error
 */
export async function rollbackTransaction(session) {
  try {
    await session.abortTransaction();
    logger.warn("↩️ Transaction rolled back");
  } catch (error) {
    logger.error("🔥 Error rolling back transaction: %o", error);
  } finally {
    await session.endSession();
  }
}

/**
 * Validate package.json integrity
 * Ensures no malicious modifications to dependencies
 * @param {string} packagePath - Path to package.json
 * @returns {object} - {isValid, hash, warning}
 */
export function validatePackageJsonIntegrity(packagePath) {
  try {
    const fs = require("fs");
    const packageContent = fs.readFileSync(packagePath, "utf8");
    const packageData = JSON.parse(packageContent);

    // Check for suspicious fields
    const dangerousFields = ["preinstall", "postinstall", "setup"];
    const hasDangerousScripts = dangerousFields.some(
      (field) => packageData.scripts && packageData.scripts[field]
    );

    const hash = crypto.createHash("sha256").update(packageContent).digest("hex");

    return {
      isValid: !hasDangerousScripts,
      hash,
      warning: hasDangerousScripts ? "Suspicious install scripts detected" : null,
    };
  } catch (error) {
    logger.error("🔥 Error validating package.json: %o", error);
    return {
      isValid: false,
      hash: null,
      warning: error.message,
    };
  }
}

export default {
  calculateDataHash,
  calculateCompositeHash,
  verifyDataIntegrity,
  addIntegrityMetadata,
  updateIntegrityMetadata,
  hasDataBeenTampered,
  generateDataSignature,
  verifyDataSignature,
  integrityMiddleware,
  checksumValidation,
  startTransaction,
  commitTransaction,
  rollbackTransaction,
  validatePackageJsonIntegrity,
};
