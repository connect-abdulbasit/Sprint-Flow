import { defineConfig, globalIgnores } from "eslint/config";
import tsEslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...tsEslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    rules: {
      // Strict rules for code quality
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      "eqeqeq": ["error", "always"],
      "no-implicit-coercion": "error",
      "no-unused-vars": "off", 
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",

    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".env*",
    "dist/**",
    "*.mjs",
    "*.config.ts"
  ]),
]);

export default eslintConfig;
