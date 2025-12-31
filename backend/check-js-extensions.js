import fs from "fs";
import path from "path";

const srcDir = "src";
let totalFilesProcessed = 0;
let totalFilesFixed = 0;
let totalImportsFixed = 0;

/**
 * Check if an import path is a relative path
 */
function isRelativePath(importPath) {
  return importPath.startsWith("./") || importPath.startsWith("../");
}

/**
 * Check if a relative import has .js extension
 */
function hasJsExtension(importPath) {
  return importPath.endsWith(".js");
}

/**
 * Process a file and fix all its imports
 */
function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let modified = content;
  let fixCount = 0;

  // Define all import/export patterns to check
  const patterns = [
    // import ... from "path" or import ... from 'path'
    {
      regex:
        /(import\s+(?:type\s+)?(?:{[^}]+}|[\w*]+|\*\s+as\s+\w+)\s+from\s+)(["'])([^"']+)\2/g,
      pathGroup: 3,
    },
    // import "path" or import 'path'
    {
      regex: /(import\s+)(["'])([^"']+)\2/g,
      pathGroup: 3,
    },
    // export ... from "path" or export ... from 'path'
    {
      regex:
        /(export\s+(?:type\s+)?(?:{[^}]+}|[\w*]+|\*\s+as\s+\w+)\s+from\s+)(["'])([^"']+)\2/g,
      pathGroup: 3,
    },
    // export * from "path" or export * from 'path'
    {
      regex: /(export\s+\*\s+from\s+)(["'])([^"']+)\2/g,
      pathGroup: 3,
    },
  ];

  patterns.forEach(({ regex }) => {
    modified = modified.replace(regex, (match, before, quote, importPath) => {
      // Only fix relative paths without .js extension
      if (isRelativePath(importPath) && !hasJsExtension(importPath)) {
        fixCount++;
        return `${before}${quote}${importPath}.js${quote}`;
      }
      return match;
    });
  });

  // Write changes if any were made
  if (fixCount > 0) {
    fs.writeFileSync(filePath, modified, "utf8");
    totalFilesFixed++;
    totalImportsFixed += fixCount;
    return { fixed: true, count: fixCount };
  }

  return { fixed: false, count: 0 };
}

/**
 * Recursively walk through directory
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  const results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...walkDir(filePath));
    } else if (
      file.endsWith(".ts") ||
      file.endsWith(".tsx") ||
      file.endsWith(".js") ||
      file.endsWith(".jsx")
    ) {
      totalFilesProcessed++;
      const result = processFile(filePath);

      if (result.fixed) {
        results.push({
          file: filePath,
          count: result.count,
        });
      }
    }
  }

  return results;
}

// Main execution
console.log("🔧 Adding .js extensions to relative imports...\n");
console.log("=".repeat(70));

if (!fs.existsSync(srcDir)) {
  console.error(`❌ Error: Directory '${srcDir}' not found!`);
  process.exit(1);
}

const fixedFiles = walkDir(srcDir);

console.log("\n" + "=".repeat(70));

if (fixedFiles.length === 0) {
  console.log("\n✅ All relative imports already have .js extensions!");
  console.log(`   Processed ${totalFilesProcessed} file(s)`);
} else {
  console.log(`\n✅ Fixed ${totalFilesFixed} file(s):\n`);

  fixedFiles.forEach((result) => {
    console.log(
      `   📄 ${result.file} (${result.count} import${
        result.count > 1 ? "s" : ""
      })`
    );
  });

  console.log("\n📊 Summary:");
  console.log(`   Total files processed: ${totalFilesProcessed}`);
  console.log(`   Files fixed: ${totalFilesFixed}`);
  console.log(`   Imports fixed: ${totalImportsFixed}`);
  console.log("\n✨ All relative imports now have .js extensions!");
}

console.log("\n" + "=".repeat(70));
