import fs from "fs";
import path from "path";

const testsDir = "tests";

/**
 * Process controller test files to:
 * 1. Remove handleError import and mock
 * 2. Add mockNext to test setup
 * 3. Add next parameter to controller function calls
 * 4. Replace handleError expectations with next() expectations
 */
function processControllerTestFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let modified = content;
  let changed = false;
  const changes = [];

  // Check if this file tests controllers (has controller imports or handleError)
  const isControllerTest =
    /from\s+["'][^"']*controllers[^"']*["']/.test(modified) ||
    /handleError/.test(modified);

  if (!isControllerTest) {
    return false;
  }

  // Step 1: Remove handleError import
  const handleErrorImportRegex =
    /import\s*{\s*handleError\s*}\s*from\s*["'][^"']*error[^"']*["'];?\s*\n/g;
  if (handleErrorImportRegex.test(modified)) {
    modified = modified.replace(handleErrorImportRegex, "");
    changed = true;
    changes.push("Removed handleError import");
  }

  // Step 2: Remove handleError mock
  const handleErrorMockRegex =
    /vi\.mock\(["'][^"']*error\/index\.js["']\);?\s*\n/g;
  if (handleErrorMockRegex.test(modified)) {
    modified = modified.replace(handleErrorMockRegex, "");
    changed = true;
    changes.push("Removed handleError mock");
  }

  // Step 3: Add mockNext variable if not present
  if (!modified.includes("let mockNext")) {
    // Try multiple patterns for variable declarations

    // Pattern 1: let mockResponse: Response;
    const pattern1 = /let mockResponse: Response;/;
    // Pattern 2: let mockRes: Response;
    const pattern2 = /let mockRes: Response;/;
    // Pattern 3: let mockResponse: Partial<Response>;
    const pattern3 = /let mockResponse: Partial<Response>;/;
    // Pattern 4: After any Response declaration
    const pattern4 = /(let \w+: (?:Partial<)?Response>?;)(?!\s*let mockNext)/;

    if (pattern1.test(modified)) {
      modified = modified.replace(
        pattern1,
        "let mockResponse: Response;\n  let mockNext: any;"
      );
      changed = true;
      changes.push("Added mockNext variable declaration (after mockResponse)");
    } else if (pattern2.test(modified)) {
      modified = modified.replace(
        pattern2,
        "let mockRes: Response;\n  let mockNext: any;"
      );
      changed = true;
      changes.push("Added mockNext variable declaration (after mockRes)");
    } else if (pattern3.test(modified)) {
      modified = modified.replace(
        pattern3,
        "let mockResponse: Partial<Response>;\n  let mockNext: any;"
      );
      changed = true;
      changes.push(
        "Added mockNext variable declaration (after Partial<Response>)"
      );
    } else if (pattern4.test(modified)) {
      modified = modified.replace(pattern4, "$1\n  let mockNext: any;");
      changed = true;
      changes.push("Added mockNext variable declaration (generic pattern)");
    }
  }

  // Also check if mockNext is being initialized in beforeEach without declaration
  if (
    !modified.includes("let mockNext") &&
    modified.includes("mockNext = vi.fn()")
  ) {
    // Find the describe block and add variable declaration
    const describePattern =
      /(describe\([^{]+{\s+let \w+: (?:Partial<)?(?:Request|Response)>?;)/;
    if (describePattern.test(modified)) {
      modified = modified.replace(describePattern, "$1\n  let mockNext: any;");
      changed = true;
      changes.push(
        "Added missing mockNext variable declaration (was only initialized)"
      );
    }
  }

  // Step 4: Initialize mockNext in beforeEach
  if (!modified.includes("mockNext = vi.fn()")) {
    // Try multiple patterns for beforeEach blocks

    // Pattern 1: vi.clearAllMocks() at the start
    const beforeEachPattern1 =
      /(beforeEach\(\(\) => {\s+vi\.clearAllMocks\(\);)/;

    // Pattern 2: createMockRequest/Response first
    const beforeEachPattern2 =
      /(beforeEach\(\(\) => {\s+mockRequest = createMockRequest\(\);)/;

    // Pattern 3: vi.clearAllMocks() at the end (before closing brace)
    const beforeEachPattern3 =
      /(beforeEach\(\(\) => {[\s\S]*?)(vi\.clearAllMocks\(\);\s+}\);)/;

    if (beforeEachPattern1.test(modified)) {
      modified = modified.replace(
        beforeEachPattern1,
        "$1\n\n    mockNext = vi.fn();"
      );
      changed = true;
      changes.push(
        "Added mockNext initialization in beforeEach (after clearAllMocks)"
      );
    } else if (beforeEachPattern2.test(modified)) {
      modified = modified.replace(
        beforeEachPattern2,
        "$1\n    mockNext = vi.fn();"
      );
      changed = true;
      changes.push(
        "Added mockNext initialization in beforeEach (with other mocks)"
      );
    } else if (
      beforeEachPattern3.test(modified) &&
      !modified.includes("mockNext = vi.fn()")
    ) {
      // Add before vi.clearAllMocks() at the end
      modified = modified.replace(
        beforeEachPattern3,
        "$1mockNext = vi.fn();\n    $2"
      );
      changed = true;
      changes.push(
        "Added mockNext initialization in beforeEach (before clearAllMocks)"
      );
    } else {
      // Fallback: try to find any beforeEach and add after the opening brace
      const genericBeforeEach = /(beforeEach\(\(\) => {\s*\n)/;
      if (genericBeforeEach.test(modified)) {
        modified = modified.replace(
          genericBeforeEach,
          "$1    mockNext = vi.fn();\n"
        );
        changed = true;
        changes.push(
          "Added mockNext initialization in beforeEach (generic pattern)"
        );
      }
    }
  }

  // Step 5: Update controller function calls to include mockNext
  // Pattern 1: await controllerFunction(mockRequest, mockResponse);
  const controllerCallPattern1 =
    /await\s+(\w+)\(mockRequest,\s*mockResponse\);/g;
  const controllerCallsPattern1 = modified.match(controllerCallPattern1);

  if (controllerCallsPattern1 && controllerCallsPattern1.length > 0) {
    modified = modified.replace(
      controllerCallPattern1,
      "await $1(mockRequest, mockResponse, mockNext);"
    );
    changed = true;
    changes.push(
      `Updated ${controllerCallsPattern1.length} controller call(s) mockRequest/mockResponse to include mockNext`
    );
  }

  // Pattern 2: await controllerFunction(mockReq, mockRes);
  const controllerCallPattern2 = /await\s+(\w+)\(mockReq,\s*mockRes\);/g;
  const controllerCallsPattern2 = modified.match(controllerCallPattern2);

  if (controllerCallsPattern2 && controllerCallsPattern2.length > 0) {
    modified = modified.replace(
      controllerCallPattern2,
      "await $1(mockReq, mockRes, mockNext);"
    );
    changed = true;
    changes.push(
      `Updated ${controllerCallsPattern2.length} controller call(s) mockReq/mockRes to include mockNext`
    );
  }

  // Pattern 3: await controllerFunction(mockRequest as Request, mockResponse as Response);
  const controllerCallPattern3 =
    /await\s+(\w+)\(mockRequest as Request,\s*mockResponse as Response\);/g;
  const controllerCallsPattern3 = modified.match(controllerCallPattern3);

  if (controllerCallsPattern3 && controllerCallsPattern3.length > 0) {
    modified = modified.replace(
      controllerCallPattern3,
      "await $1(mockRequest as Request, mockResponse as Response, mockNext);"
    );
    changed = true;
    changes.push(
      `Updated ${controllerCallsPattern3.length} controller call(s) with 'as' type assertions to include mockNext`
    );
  }

  // Step 6: Replace handleError expectations with next() expectations

  // Pattern 1: expect(handleError).toHaveBeenCalledWith(error, mockResponse);
  const handleErrorPattern1 =
    /expect\(handleError\)\.toHaveBeenCalledWith\(\s*([^,]+),\s*mockResponse\s*\);/g;
  const matchesPattern1 = modified.match(handleErrorPattern1);

  if (matchesPattern1 && matchesPattern1.length > 0) {
    modified = modified.replace(
      handleErrorPattern1,
      "expect(mockNext).toHaveBeenCalledWith($1);"
    );
    changed = true;
    changes.push(
      `Updated ${matchesPattern1.length} handleError expectation(s) with mockResponse to next()`
    );
  }

  // Pattern 2: expect(handleError).toHaveBeenCalledWith(error, mockRes);
  const handleErrorPattern2 =
    /expect\(handleError\)\.toHaveBeenCalledWith\(\s*([^,]+),\s*mockRes\s*\);/g;
  const matchesPattern2 = modified.match(handleErrorPattern2);

  if (matchesPattern2 && matchesPattern2.length > 0) {
    modified = modified.replace(
      handleErrorPattern2,
      "expect(mockNext).toHaveBeenCalledWith($1);"
    );
    changed = true;
    changes.push(
      `Updated ${matchesPattern2.length} handleError expectation(s) with mockRes to next()`
    );
  }

  // Pattern 3: expect(handleError).toHaveBeenCalled();
  const handleErrorCalledRegex =
    /expect\(handleError\)\.toHaveBeenCalled\(\);/g;
  const handleErrorCalled = modified.match(handleErrorCalledRegex);

  if (handleErrorCalled && handleErrorCalled.length > 0) {
    modified = modified.replace(
      handleErrorCalledRegex,
      "expect(mockNext).toHaveBeenCalled();"
    );
    changed = true;
    changes.push(
      `Updated ${handleErrorCalled.length} handleError.toHaveBeenCalled() expectation(s) to next()`
    );
  }

  // Pattern 4: expect(handleError).not.toHaveBeenCalled();
  const handleErrorNotCalledRegex =
    /expect\(handleError\)\.not\.toHaveBeenCalled\(\);/g;
  const handleErrorNotCalled = modified.match(handleErrorNotCalledRegex);

  if (handleErrorNotCalled && handleErrorNotCalled.length > 0) {
    modified = modified.replace(
      handleErrorNotCalledRegex,
      "expect(mockNext).not.toHaveBeenCalled();"
    );
    changed = true;
    changes.push(
      `Updated ${handleErrorNotCalled.length} handleError.not.toHaveBeenCalled() expectation(s)`
    );
  }

  // Step 7: Update test descriptions that mention handleError
  const handleErrorDescriptionRegex = /"should handle ([^"]+) error"/g;
  if (handleErrorDescriptionRegex.test(modified)) {
    // These are fine to keep, they still describe error handling
    // But we could optionally update them to be more specific
  }

  // Step 8: Add comment for error handling tests
  // Find error handling test blocks and add helpful comment
  const errorTestBlockRegex =
    /(it\("should handle [^"]+",\s*async\s*\(\)\s*=>\s*{)/g;
  if (errorTestBlockRegex.test(modified) && changed) {
    // This is optional - just for clarity
  }

  // Write changes if any were made
  if (changed) {
    fs.writeFileSync(filePath, modified, "utf8");
    return { changed: true, changes };
  }

  return { changed: false, changes: [] };
}

/**
 * Recursively walk through directory and process test files
 */
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let totalFilesChanged = 0;
  const fileResults = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const result = walkDir(filePath);
      totalFilesChanged += result.totalFilesChanged;
      fileResults.push(...result.fileResults);
    } else if (
      (file.endsWith(".test.ts") || file.endsWith(".spec.ts")) &&
      !file.includes("index.test.ts") // Skip the handleError index test
    ) {
      const result = processControllerTestFile(filePath);

      if (result.changed) {
        totalFilesChanged++;
        fileResults.push({
          path: filePath,
          changes: result.changes,
        });
      }
    }
  }

  return { totalFilesChanged, fileResults };
}

// Main execution
console.log("🔧 Updating controller test files...\n");
console.log("=".repeat(60));

if (!fs.existsSync(testsDir)) {
  console.error(`❌ Error: Directory '${testsDir}' not found!`);
  process.exit(1);
}

const { totalFilesChanged, fileResults } = walkDir(testsDir);

if (totalFilesChanged > 0) {
  console.log("\n✨ Updated Files:\n");

  fileResults.forEach((result, index) => {
    console.log(`${index + 1}. 📝 ${result.path}`);
    result.changes.forEach((change) => {
      console.log(`   ✅ ${change}`);
    });
    console.log("");
  });

  console.log("=".repeat(60));
  console.log(`\n✨ Done! ${totalFilesChanged} test file(s) updated.`);
  console.log("\n📋 Summary of changes:");
  console.log("   1. Removed handleError imports and mocks");
  console.log("   2. Added mockNext to test setup");
  console.log("   3. Updated controller calls to include mockNext parameter");
  console.log("   4. Changed handleError expectations to next() expectations");
  console.log("\n⚠️  Please run your tests to verify everything works!");
  console.log("   npm test");
} else {
  console.log("\n=".repeat(60));
  console.log("\n⏭️  No controller test files needed updates!");
}

console.log("");
