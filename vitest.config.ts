import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://postgres@localhost:5432/hotel_test",
      APP_BASE_URL: "http://localhost:3000",
      PAYMENT_PROVIDER: "fake",
      AUTH_SECRET: "test-secret-test-secret-test-secret-123",
      EMAIL_FROM: "buchung@example.ch",
      PLATFORM_ALERT_EMAIL: "alarm@example.ch",
    },
  },
});
