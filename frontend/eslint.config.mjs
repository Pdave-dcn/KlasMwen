import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  globalIgnores([
    "dist/**",
    "node_modules/**",
    "public/**",
    "build/**",
    ".next/**",
    "coverage/**",
    "tests/**", // ← ADD THIS: Exclude the entire tests folder
    "*.config.{js,ts,mjs,cjs}",
    "vite.config.{js,ts}",
    "tailwind.config.{js,ts}",
    "postcss.config.{js,ts}",
    "*.json",
    "*.md",
    "*.html",
    ".env*",
    ".gitignore",
    ".npmrc",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
  ]),

  // Base JavaScript/TypeScript configuration
  {
    files: ["src/**/*.{js,mjs,cjs,ts,tsx}"], // Only lint source files
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      // CODE QUALITY & BEST PRACTICES
      "no-console": "warn",
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
      "no-useless-rename": "error",
      "object-shorthand": "warn",
      "max-params": ["warn", 5],
      // "max-lines-per-function": ["warn", { max: 80, skipBlankLines: true }],
      complexity: ["warn", 15],

      // MODERN JAVASCRIPT FEATURES
      "prefer-template": "warn",
      "prefer-destructuring": [
        "warn",
        {
          array: false,
          object: true,
        },
      ],
      "no-useless-concat": "error",
      "prefer-spread": "warn",
    },
  },

  // TypeScript specific configuration
  {
    files: ["src/**/*.{ts,tsx}"], // Only lint TypeScript files in src
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: {
      import: importPlugin,
      react: react,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          projectService: true,
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        alias: {
          map: [["@", "./src"]],
          extensions: [".ts", ".tsx", ".js", ".jsx"],
        },
      },
      react: {
        version: "detect",
      },
    },
    rules: {
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
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "react-**",
              group: "external",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin", "react"],
        },
      ],
      "import/newline-after-import": ["error", { count: 1 }],
      "import/no-duplicates": "error",
      "import/no-unresolved": "error",
      "import/no-cycle": "warn",
      "import/no-self-import": "error",
      "import/first": "error",
      "import/no-deprecated": "warn",
      "import/no-empty-named-blocks": "error",
      "import/no-mutable-exports": "error",
      "import/no-named-as-default": "warn",
      "import/no-named-as-default-member": "warn",

      // TYPESCRIPT SPECIFIC IMPROVEMENTS
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
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
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": "allow-with-description",
        },
      ],

      // REACT SPECIFIC RULES
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/jsx-key": [
        "error",
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
        },
      ],
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-pascal-case": "warn",
      "react/jsx-fragments": ["warn", "syntax"],
      "react/jsx-boolean-value": ["warn", "never"],
      "react/jsx-curly-brace-presence": [
        "warn",
        {
          props: "never",
          children: "never",
        },
      ],
      "react/self-closing-comp": [
        "warn",
        {
          component: true,
          html: true,
        },
      ],
      "react/no-array-index-key": "warn",
      "react/no-danger": "warn",
      "react/no-deprecated": "error",
      "react/no-direct-mutation-state": "error",
      "react/no-find-dom-node": "error",
      "react/no-is-mounted": "error",
      "react/no-render-return-value": "error",
      "react/no-string-refs": "error",
      "react/no-unescaped-entities": "off",
      "react/no-unknown-property": "error",
      "react/prop-types": "off", // Using TypeScript for prop validation
      "react/react-in-jsx-scope": "off", // Not needed with new JSX transform

      // ACCESSIBILITY RULES
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/mouse-events-have-key-events": "warn",
      "jsx-a11y/no-access-key": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",

      // DISABLE OVERLY STRICT TYPESCRIPT RULES FOR FRONTEND
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-misused-promises": "off",
    },
  },

  // React Hooks and Refresh configuration
  {
    files: ["src/**/*.{ts,tsx}"], // Only apply to source TypeScript files
    extends: [
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    rules: {
      // Customize react-refresh rules if needed
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  // CONFIGURATION FILES (if you need to lint them specifically)
  {
    files: [
      "*.config.{js,ts,mjs}",
      "vite.config.{js,ts}",
      "tailwind.config.{js,ts}",
    ],
    languageOptions: {
      globals: {
        ...globals.node, // Config files run in Node.js
      },
    },
    rules: {
      "import/no-default-export": "off",
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  eslintConfigPrettier,
]);
