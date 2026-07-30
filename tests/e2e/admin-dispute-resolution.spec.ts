import { expect, test } from "next/experimental/testmode/playwright";

import { BUYER_KEY, JWT,VENDOR_KEY } from "./helpers/constants";
import { type MockDispute,setupNetworkMocks } from "./helpers/mock-api";

const disputeId = "dispute-1";
let isResolved = false;

const mockDispute: MockDispute = {
  id: disputeId,
  escrowId: "escrow-42",
  buyerId: BUYER_KEY,
  reason: "Item not received",
  evidence: ["https://example.com/evidence.jpg"],
  status: "OPEN",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  escrow: {
    id: "escrow-42",
    vendorId: VENDOR_KEY,
    buyerId: BUYER_KEY,
    item: "Gold Necklace",
    amount: 180.0,
    status: "DISPUTED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    history: [],
  },
};

test("admin can resolve a dispute and the dispute list updates", async ({ page, next }) => {
  isResolved = false;

  await page.addInitScript(() => {
    window.localStorage.setItem("wallet.jwt", JWT);
  });

  await setupNetworkMocks(page, next);
  
  await page.route("**/api/disputes**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    // Client-side fetch for dispute list
    if (url.searchParams.has("status")) {
      const body = isResolved ? [] : [mockDispute];
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    }

    // Client-side resolve action — deliberately slow so the assertions below
    // prove the badge updates optimistically rather than after the response.
    if (url.pathname.includes(`/disputes/${disputeId}/resolve`)) {
      isResolved = true;
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockDispute,
          status: "RESOLVED",
          resolution: "RELEASE_TO_VENDOR",
        }),
      });
    }

    return route.continue();
  });

  next.onFetch(async (request) => {
    const url = new URL(request.url);

    // Server-side fetch for the dispute detail page
    if (url.pathname === `/disputes/${disputeId}`) {
      return new Response(JSON.stringify(mockDispute), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return "continue";
  });

  await page.goto("/admin/disputes");

  await expect(page.getByText("Admin Disputes")).toBeVisible();
  await page.getByRole("link", { name: /view dispute/i }).click();

  await expect(page.getByText(/release to vendor/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("dispute-status-badge")).toHaveText("OPEN");

  await page.getByRole("button", { name: /release to vendor/i }).click();
  await page.getByRole("button", { name: "Confirm" }).click();

  // Optimistic update: badges flip while the 1.5s resolve request is still in flight.
  await expect(page.getByTestId("dispute-status-badge")).toHaveText("RESOLVED", { timeout: 1_000 });
  await expect(page.getByTestId("escrow-status-badge")).toHaveText("RELEASED", { timeout: 1_000 });

  await expect(page.getByText(/no open disputes right now/i)).toBeVisible({ timeout: 10_000 });
});
