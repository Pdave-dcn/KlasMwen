// backend/.eslintrc.cjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      // CODE QUALITY & BEST PRACTICES
      "no-console": "off",
      "no-debugger": "error",
      "no-alert": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "warn",
      "arrow-spacing": "error",
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "require-await": "error",
      "no-return-await": "off",
      "no-process-exit": "error",
      "no-sync": "warn",
      "no-useless-rename": "error",
      "object-shorthand": "warn",
      "max-params": ["warn", 5],
      "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true }],
      complexity: ["warn", 15],

      // IMPORT ORGANIZATION & FORMATTING
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js built-in modules
            "external", // npm packages
            "internal", // Internal modules (configured via paths)
            "parent", // ../
            "sibling", // ./
            "index", // ./index.js
            "type", // type imports
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
      "import/newline-after-import": ["error", { count: 1 }],
      "import/no-duplicates": "error",
      "import/no-unresolved": "error",
      "import/no-cycle": "warn",
      "import/no-self-import": "error",
      "import/first": "error",
      "import/exports-last": "warn",
      "import/group-exports": "warn",
      "import/no-deprecated": "warn",
      "import/no-empty-named-blocks": "error",
      "import/no-mutable-exports": "error",
      "import/no-named-as-default": "warn",
      "import/no-named-as-default-member": "warn",
      "import/no-unused-modules": "warn",

      // TYPESCRIPT SPECIFIC IMPROVEMENTS
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
        },
      ],

      // DISABLE OVERLY STRICT TYPESCRIPT RULES
      // These rules can be too strict when working with external libraries
      // or legitimate use cases where type inference isn't perfect
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",

      // Problematic with async callbacks in libraries like passport
      "@typescript-eslint/no-misused-promises": "off",

      // "@typescript-eslint/no-unsafe-assignment": "warn",
      // "@typescript-eslint/no-unsafe-call": "warn",
      // "@typescript-eslint/no-unsafe-member-access": "warn",
      // "@typescript-eslint/no-unsafe-argument": "warn",
    },
  },

  // TEST FILES SPECIFIC OVERRIDES
  {
    files: [
      "**/*.test.{js,ts}",
      "**/*.spec.{js,ts}",
      "**/tests/**/*.{js,ts}",
      "**/__tests__/**/*.{js,ts}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        // Add vitest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      // RELAX RULES FOR TEST FILES
      "max-lines-per-function": "off", // Test functions can be long
      "max-params": "off", // Test setup might need many parameters
      complexity: "off", // Tests can be complex

      // Allow more flexible imports in tests
      "import/no-unresolved": "off", // Tests might import mocked modules
      "import/order": "warn",

      // TypeScript relaxations for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn", // Less strict for test variables
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_|^mock",
        },
      ],

      // Allow unused expressions in tests (for setup)
      "@typescript-eslint/no-unused-expressions": "off",

      // Allow non-null assertions in tests
      "@typescript-eslint/no-non-null-assertion": "off",

      // Allow empty functions in test mocks
      "@typescript-eslint/no-empty-function": "off",

      // Less strict about awaiting in tests
      "require-await": "warn",

      // Allow console usage in tests for debugging
      "no-console": "off",

      "@typescript-eslint/unbound-method": "off",
    },
  },

  eslintConfigPrettier,

  {
    ignores: ["vitest.config.ts"],
  },
]);
