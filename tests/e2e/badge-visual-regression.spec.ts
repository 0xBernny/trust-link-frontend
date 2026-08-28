import { expect,test } from "@playwright/test";

test.describe("EscrowStatusBadge visual regression", () => {
  test("renders all badge variants and matches baseline snapshot", async ({ page }) => {
    await page.goto("/badge-visual-test");

    // Wait for the page to fully render
    await expect(page.getByText("EscrowStatusBadge Variants")).toBeVisible();

    // Take a full-page screenshot for visual comparison
    await expect(page).toHaveScreenshot("escrow-status-badge-variants.png", {
      fullPage: true,
      // Allow minor pixel differences for anti-aliasing across platforms
      maxDiffPixelRatio: 0.02,
    });
  });
});