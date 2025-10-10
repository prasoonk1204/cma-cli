import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        NodeJS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-object-type": "error",
      "no-undef": "off",
    },
  },

  // Jest test override — disables `project` lookup entirely
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null, // 👈 disables project-based type-checking for tests
        ecmaVersion: "latest",
        sourceType: "module",
      },
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
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  {
    ignores: ["dist/", "node_modules/", "*.js"],
  },
];
