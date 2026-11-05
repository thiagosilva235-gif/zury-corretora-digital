import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

import quality from "./eslint-rules/index.cjs";

// Test files keep the file budget exemption built into quality/max-lines and skip the
// statement/length budgets that fire on describe/it nesting without pointing at a real problem.
const testFiles = [
  "**/*{.,-}{test,spec}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
  "**/{__tests__,__mocks__,fixtures,mocks}/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}",
];

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // vibe-coding-toolkit quality gates (revision 21b71b6); adoption plan in docs/quality.md.
    // The size/complexity budget is "warn" by design. quality/max-lines starts at "warn" because
    // src/lib/content.ts is over 350 lines; promote it to "error" once that file is split.
    files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
    plugins: { quality },
    rules: {
      complexity: ["warn", 12],
      "max-depth": ["warn", 4],
      "max-statements": ["warn", 20],
      "max-params": ["warn", 4],
      "max-lines-per-function": ["warn", { max: 150, skipBlankLines: true, skipComments: true }],
      "max-nested-callbacks": ["warn", 3],
      "quality/max-lines": "warn",
    },
  },
  {
    files: testFiles,
    rules: {
      "max-statements": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
    },
  },
  eslintPluginPrettier,
);
