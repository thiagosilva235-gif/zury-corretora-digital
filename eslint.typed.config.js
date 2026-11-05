// Type-aware lint tier (vibe-coding-toolkit 21b71b6), kept out of eslint.config.js because
// projectService builds a full TypeScript program and roughly doubles lint time.
// Run: bunx --bun eslint -c eslint.typed.config.js src
// Both focused async rules start at "warn" for legacy violations; see docs/quality.md.
import defaultConfig from "./eslint.config.js";

export default [
  ...defaultConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
    },
  },
];
