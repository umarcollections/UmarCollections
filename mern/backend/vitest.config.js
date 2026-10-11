import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    // These win over backend/.env, so tests never touch the real database.
    // The real connection string is replaced by an in-memory MongoDB in setup.js.
    env: {
      NODE_ENV: 'test',
      MONGO_URI: 'mongodb://in-memory-test-db',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
      JWT_EXPIRES_IN: '1h',
      // Used by tests/auth/admin.test.js; seeding only runs when a test calls it
      ADMIN_EMAIL: 'owner@example.com',
      ADMIN_PASSWORD: 'owner-password-123',
    },
    // The first run downloads a MongoDB binary
    hookTimeout: 120_000,
  },
});
