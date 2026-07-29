import { mockFreighter } from "./helpers/mock-freighter";
import { expect, test } from "next/experimental/testmode/playwright";

test("vendor can connect Freighter, create an escrow link, and see the QR code", async ({ page }) => {
  await mockFreighter(page);

  await page.route("**/auth/challenge**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transaction: "challenge-xdr",
        network_passphrase: "Test SDF Network ; September 2015",
      }),
    });
  });

  await page.route("**/auth/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "jwt-token" }),
    });
  });

  await page.route("**/escrow", async (route) => {
    const request = route.request();
    const payload = JSON.parse(request.postData() || "{}") as { itemName?: string };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: `https://trustlink.example.com/escrow/${encodeURIComponent(payload.itemName || "ESCROW-12345")}`,
      }),
    });
  });

  await page.goto("/create");

  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByRole("button", { name: /gcfm4v.*cdef/i })).toBeVisible();

  await page.getByLabel("Item name").fill("Vintage Camera");
  await page.getByLabel("Price (USDC)").fill("249.99");
  await page.getByLabel("Description").fill("Collector-grade camera in working condition");
  await page.getByLabel("Shipping window").selectOption("1 week");

  await page.getByRole("button", { name: /create escrow link/i }).click();

  const shareableUrl = page.getByTestId("shareable-url");
  await expect(page.getByTestId("link-card")).toBeVisible();
  await expect(shareableUrl).toHaveValue(/^https:\/\/trustlink\.example\.com\/escrow\/Vintage%20Camera$/);
  await expect(page.getByTestId("qr-code")).toBeVisible();
});
