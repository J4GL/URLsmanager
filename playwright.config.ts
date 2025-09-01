import { defineConfig } from '@playwright/test';

// Base URL for MCP server under test. Override with MCP_BASE_URL env var.
const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  use: {
    baseURL: MCP_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Adjust if you want to run headed by default
  // workers: 1,
});
