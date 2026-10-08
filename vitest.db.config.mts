import { defineConfig } from "vitest/config";

/**
 * Database security tests (RLS, grants, triggers) against the Supabase project in
 * SUPABASE_DB_URL. Each test runs in a rolled-back transaction. Run: npm run test:db
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // One connection, one transaction at a time.
    fileParallelism: false,
  },
});
