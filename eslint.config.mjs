import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts", "styles/**", "public/**"],
  },
  {
    // The codebase predates linting: keep these visible as warnings while the backlog is cleaned up
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "prefer-const": "warn",
      // React Compiler advisories (performance, not correctness) — fix as files are touched
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
]

export default eslintConfig
