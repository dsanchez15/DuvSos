import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // The app relies on standard data-fetching inside useEffect for many
      // dashboard/page hooks. This rule flags every promise->setState pattern
      // as a cascading-render hazard, which is too noisy for this codebase.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/app/api/**/*.ts'],
    rules: {
      // API routes frequently deal with Prisma-generated and request payload
      // shapes that are tedious to type exhaustively. Keep other rules active.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      // One-off Node.js scripts intentionally use CommonJS require.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/lib/db.ts'],
    rules: {
      // Conditional adapter loading needs synchronous require at runtime.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);

export default eslintConfig;
