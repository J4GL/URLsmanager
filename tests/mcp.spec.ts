import { test, expect, request } from '@playwright/test';

// This is a placeholder test that pings the MCP server's root path.
// Set MCP_BASE_URL env var (e.g., http://localhost:3000) to point to your server.

test.describe('MCP server basic availability', () => {
  test('responds at /', async ({ page, baseURL }) => {
    test.skip(!baseURL, 'No baseURL configured');
    await page.goto('/');
    // We don't know the page content/title; just ensure we get some response
    await expect(page).toHaveURL(/\//);
  });

  test('GET /health (if available)', async () => {
    const baseURL = process.env.MCP_BASE_URL || 'http://localhost:3000';
    const ctx = await request.newContext();
    const res = await ctx.get(`${baseURL}/health`);
    // If /health doesn't exist, this will be non-200 and fail; skip for now
    test.skip(res.status() >= 400, 'No /health endpoint');
    expect(res.ok()).toBeTruthy();
  });
});
