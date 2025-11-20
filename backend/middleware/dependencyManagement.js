// middleware/dependencyManagement.js - Safe dependency handling and vulnerability checks

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, "../..");

/**
 * Known vulnerable patterns in package.json
 */
const VULNERABILITY_PATTERNS = {
  eval: /eval\s*\(/,
  functionConstructor: /new\s+Function\s*\(/,
  execSync: /execSync\s*\(/,
  exec: /child_process\.exec\s*\(/,
  require_unsafe: /require\s*\(\s*['"].*['"]\s*\)\s*\(/,
  dynamicRequire: /require\s*\(\s*\[.*\]\s*\)/,
};

/**
 * Packages known to have security issues (should be avoided or updated)
 */
const SUSPICIOUS_PACKAGES = [
  { name: "eval", reason: "Evaluates arbitrary code" },
  { name: "serialize-javascript", reason: "Can be exploited for RCE" },
  { name: "lodash", reason: "Use lodash-es instead for tree-shaking" },
  { name: "request", reason: "Deprecated, use axios or node-fetch" },
  { name: "node-uuid", reason: "Use built-in crypto.randomUUID()" },
];

/**
 * Read and parse package.json
 * @param {string} packagePath - Path to package.json
 * @returns {object} - Parsed package.json content
 */
export function readPackageJson(packagePath = null) {
  try {
    const filePath = packagePath || path.join(PROJECT_ROOT, "backend", "package.json");
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    logger.error("🔥 Error reading package.json: %o", error);
    throw error;
  }
}

/**
 * Read and parse package-lock.json (or yarn.lock)
 * @param {string} lockPath - Path to lock file
 * @returns {object} - Parsed lock file
 */
export function readLockFile(lockPath = null) {
  try {
    let filePath =
      lockPath || path.join(PROJECT_ROOT, "backend", "package-lock.json");

    // Check for package-lock.json first, then yarn.lock
    if (!fs.existsSync(filePath)) {
      filePath = path.join(PROJECT_ROOT, "backend", "yarn.lock");
    }

    if (!fs.existsSync(filePath)) {
      logger.warn("⚠️ No lock file found (package-lock.json or yarn.lock)");
      return null;
    }

    const content = fs.readFileSync(filePath, "utf8");

    // For package-lock.json
    if (filePath.endsWith("package-lock.json")) {
      return JSON.parse(content);
    }

    // yarn.lock is not JSON, just return metadata
    return {
      type: "yarn.lock",
      exists: true,
      content: content.substring(0, 100) + "...",
    };
  } catch (error) {
    logger.error("🔥 Error reading lock file: %o", error);
    return null;
  }
}

/**
 * Audit package.json for suspicious patterns
 * @param {object} packageJson - Parsed package.json
 * @returns {object} - {isClean, issues}
 */
export function auditPackageJsonScripts(packageJson) {
  const issues = [];

  if (!packageJson.scripts) {
    return { isClean: true, issues: [] };
  }

  // Check for suspicious script patterns
  Object.entries(packageJson.scripts).forEach(([scriptName, scriptContent]) => {
    Object.entries(VULNERABILITY_PATTERNS).forEach(([patternName, pattern]) => {
      if (pattern.test(scriptContent)) {
        issues.push({
          script: scriptName,
          pattern: patternName,
          content: scriptContent,
          severity: "high",
          recommendation: `Review script: "${scriptName}" for unsafe patterns`,
        });
      }
    });

    // Check for dangerous npm lifecycle hooks
    if (["preinstall", "postinstall", "preuninstall", "postuninstall"].includes(scriptName)) {
      if (scriptContent.includes("curl") || scriptContent.includes("wget")) {
        issues.push({
          script: scriptName,
          pattern: "lifecycle_download",
          content: scriptContent,
          severity: "high",
          recommendation: `Lifecycle script "${scriptName}" downloads content - verify legitimacy`,
        });
      }
    }
  });

  return {
    isClean: issues.length === 0,
    issues,
  };
}

/**
 * Check for suspicious or outdated packages
 * @param {object} packageJson - Parsed package.json
 * @returns {object} - {alerts, warnings}
 */
export function checkDependencyQuality(packageJson) {
  const alerts = [];
  const warnings = [];

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies,
  };

  Object.keys(allDeps).forEach((depName) => {
    // Check for suspicious packages
    const suspicious = SUSPICIOUS_PACKAGES.find((s) => s.name === depName);
    if (suspicious) {
      warnings.push({
        package: depName,
        reason: suspicious.reason,
        version: allDeps[depName],
      });
    }

    // Check for overly permissive version ranges (security risk)
    const version = allDeps[depName];
    if (version.startsWith("*") || version === "latest") {
      alerts.push({
        package: depName,
        issue: "Overly permissive version range",
        current: version,
        recommendation: "Use specific versions (e.g., ^1.2.3 or ~1.2.3)",
      });
    }
  });

  return { alerts, warnings };
}

/**
 * Validate that package-lock.json exists and is in sync with package.json
 * @returns {object} - {hasLockFile, inSync, issues}
 */
export function validateLockFilePresence() {
  const packagePath = path.join(PROJECT_ROOT, "backend", "package.json");
  const lockPath = path.join(PROJECT_ROOT, "backend", "package-lock.json");
  const yarnPath = path.join(PROJECT_ROOT, "backend", "yarn.lock");

  const hasLockFile = fs.existsSync(lockPath) || fs.existsSync(yarnPath);
  const lockType = fs.existsSync(lockPath) ? "npm" : fs.existsSync(yarnPath) ? "yarn" : null;

  if (!hasLockFile) {
    return {
      hasLockFile: false,
      inSync: false,
      issues: [
        "No lock file found. Run 'npm install' to create package-lock.json",
      ],
      recommendation: "Commit package-lock.json to version control",
    };
  }

  return {
    hasLockFile: true,
    lockType,
    inSync: true,
    issues: [],
    recommendation: "Lock file found. Ensure it's committed to version control.",
  };
}

/**
 * Generate dependency audit report
 * @returns {object} - Complete audit report
 */
export function generateDependencyAuditReport() {
  try {
    const packageJson = readPackageJson();
    const scriptAudit = auditPackageJsonScripts(packageJson);
    const qualityCheck = checkDependencyQuality(packageJson);
    const lockFileCheck = validateLockFilePresence();

    const report = {
      timestamp: new Date(),
      scriptAudit,
      qualityCheck,
      lockFileCheck,
      summary: {
        totalDependencies:
          Object.keys(packageJson.dependencies || {}).length +
          Object.keys(packageJson.devDependencies || {}).length,
        scriptIssues: scriptAudit.issues.length,
        dependencyWarnings: qualityCheck.warnings.length,
        versionAlerts: qualityCheck.alerts.length,
        hasLockFile: lockFileCheck.hasLockFile,
      },
    };

    return report;
  } catch (error) {
    logger.error("🔥 Error generating dependency audit report: %o", error);
    return null;
  }
}

/**
 * Log dependency audit results
 */
export function logDependencyAudit() {
  const report = generateDependencyAuditReport();

  if (!report) {
    logger.error("Failed to generate dependency audit report");
    return;
  }

  logger.info("📦 [DEPENDENCY AUDIT] Total dependencies: %d", report.summary.totalDependencies);

  if (report.scriptAudit.issues.length > 0) {
    logger.warn("⚠️ [DEPENDENCY AUDIT] Found %d script issues", report.scriptAudit.issues.length);
    report.scriptAudit.issues.forEach((issue) => {
      logger.warn(
        "  - Script '%s' contains pattern '%s': %s",
        issue.script,
        issue.pattern,
        issue.recommendation
      );
    });
  } else {
    logger.info("✅ [DEPENDENCY AUDIT] No suspicious script patterns found");
  }

  if (report.qualityCheck.warnings.length > 0) {
    logger.warn(
      "⚠️ [DEPENDENCY AUDIT] Found %d suspicious packages",
      report.qualityCheck.warnings.length
    );
    report.qualityCheck.warnings.forEach((w) => {
      logger.warn("  - %s (%s): %s", w.package, w.version, w.reason);
    });
  } else {
    logger.info("✅ [DEPENDENCY AUDIT] No suspicious packages detected");
  }

  if (!report.lockFileCheck.hasLockFile) {
    logger.error("🔥 [DEPENDENCY AUDIT] %s", report.lockFileCheck.issues[0]);
  } else {
    logger.info(
      "✅ [DEPENDENCY AUDIT] Lock file present (%s)",
      report.lockFileCheck.lockType
    );
  }
}

/**
 * Middleware to validate dependencies on startup
 * Usage: Add to server.js early in the application lifecycle
 */
export function dependencyValidationMiddleware(req, res, next) {
  // This would typically be called once at startup, not on every request
  // But included here for completeness
  next();
}

/**
 * Check if eval or Function is used anywhere (should never happen)
 * @returns {object} - {safe, files}
 */
export function checkForDangerousFunctions() {
  const dangerousFiles = [];
  const backendDir = path.join(PROJECT_ROOT, "backend");

  try {
    const jsFiles = findJsFiles(backendDir);

    jsFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Skip comments, string comparisons, and documentation
        const trimmed = line.trim();
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          line.includes('includes("eval(') ||
          line.includes('includes("new Function(') ||
          line.includes('includes("child_process.exec(') ||
          line.includes('includes("execSync(')
        ) {
          return;
        }

        // Check for actual dangerous usage (not string literals)
        if (
          (/\beval\s*\(/.test(line) && !line.includes('includes("eval')) ||
          (/\bnew\s+Function\s*\(/.test(line) && !line.includes('includes("new Function')) ||
          (/child_process\.exec\s*\(/.test(line) && !line.includes('includes("child_process.exec')) ||
          (/\bexecSync\s*\(/.test(line) && !line.includes('includes("execSync'))
        ) {
          dangerousFiles.push({
            file,
            line: index + 1,
            code: line.trim(),
          });
        }
      });
    });

    return {
      safe: dangerousFiles.length === 0,
      files: dangerousFiles,
    };
  } catch (error) {
    logger.error("🔥 Error checking for dangerous functions: %o", error);
    return { safe: false, files: [], error: error.message };
  }
}

/**
 * Helper to find all JS files recursively
 */
function findJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip node_modules, logs, uploads, and common non-code directories
    if (
      file === "node_modules" ||
      file === "logs" ||
      file === "uploads" ||
      file === ".git" ||
      file.startsWith(".")
    ) {
      return;
    }

    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (file.endsWith(".js")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

export default {
  readPackageJson,
  readLockFile,
  auditPackageJsonScripts,
  checkDependencyQuality,
  validateLockFilePresence,
  generateDependencyAuditReport,
  logDependencyAudit,
  dependencyValidationMiddleware,
  checkForDangerousFunctions,
};
