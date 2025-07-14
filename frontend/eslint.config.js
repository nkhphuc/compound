// @ts-check
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";

const compat = new FlatCompat();

export default [
  js.configs.recommended,
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:react/recommended"),
  ...compat.extends("plugin:react-hooks/recommended"),
  ...compat.extends("plugin:import/recommended"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json"
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react": react,
      "react-hooks": reactHooks,
      "import": importPlugin,
    },
    rules: {
      // Example: customize rules here
      "react/react-in-jsx-scope": "off", // Not needed for React 17+
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "import/order": ["warn", { "alphabetize": { "order": "asc" } }],
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
  },
];
