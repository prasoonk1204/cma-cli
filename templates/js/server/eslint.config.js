import js from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  js.configs.recommended,

  // Your base configuration for normal JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off", // allow console in backend
      "prefer-const": "error",
    },
  },

  // Add a Jest-specific override just for tests
  {
    files: ["**/__tests__/**/*.js", "**/*.test.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
  },

  {
    ignores: ["node_modules/", "dist/"],
  },
];

export default config;
