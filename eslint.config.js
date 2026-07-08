// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // No usar `any` sin justificación — regla del proyecto
      "@typescript-eslint/no-explicit-any": "error",
      // Requiere tipo de retorno explícito en funciones
      "@typescript-eslint/explicit-function-return-type": "off",
      // Variables declaradas deben usarse
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      // Preferir const sobre let cuando no se reasigna
      "prefer-const": "error",
      // No console.log en producción (usar logger)
      "no-console": "warn"
    },
  },
  {
    // Ignorar archivos generados y node_modules
    ignores: ["node_modules/**", "dist/**", "src/database/generated/**", "src/generated/**"],
  }
);
