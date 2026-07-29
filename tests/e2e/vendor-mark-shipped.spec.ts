import { expect, test } from "next/experimental/testmode/playwright";

const escrowId = "escrow-ship-1";

const mockEscrow = {
  id: escrowId,
  vendorId: "GCFM4VENDOR8TESTING1234567890ABCDEF",
  buyerId: "GCBUYER8TESTING1234567890ABCDEF",
  item: "Vintage Camera",
  amount: 249.99,
  status: "FUNDED",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  history: [],
};

test("vendor mark shipped updates vendor and buyer status", async ({ page, next }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("wallet.jwt", "jwt-token");
  });

  // Intercept server-side escrow fetch (for /track/[escrowId] page component)
  // getEscrow() tries /escrow/:id first, then falls back to /escrows/:id on 404
  next.onFetch(async (request) => {
    const url = new URL(request.url);
    if (
      url.pathname === `/escrow/${escrowId}` ||
      url.pathname === `/escrows/${escrowId}`
    ) {
      return new Response(
        JSON.stringify({ ...mockEscrow, status: "SHIPPED" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return "continue";
  });

  // Client-side mocks for vendor dashboard data
  await page.route("**/vendor/escrows", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([mockEscrow]),
    });
  });

  await page.route(`**/escrow/${escrowId}/ship`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...mockEscrow,
        status: "SHIPPED",
        trackingId: "TRACK-123",
        carrier: "Terminal Africa",
      }),
    });
  });

  await page.route(`**/escrow/${escrowId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...mockEscrow, status: "SHIPPED" }),
    });
  });

  await page.goto("/dashboard");

  await page.getByRole("button", { name: /mark shipped/i }).click();
  await page.getByLabel("Tracking ID").fill("TRACK-123");
  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page.getByText("SHIPPED")).toBeVisible();

  await page.goto(`/track/${escrowId}`);
  await expect(page.getByText("SHIPPED")).toBeVisible();
});
