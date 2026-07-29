import { expect, test } from "next/experimental/testmode/playwright";
import { setupNetworkMocks, type MockEscrow } from "./helpers/mock-api";

const escrowId = "escrow-ship-1";

const mockEscrow: MockEscrow = {
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

  await setupNetworkMocks(page, next, {
    escrowId,
    mockEscrow: { ...mockEscrow, status: "SHIPPED" },
    mockEscrowsList: [mockEscrow]
  });

  await page.goto("/dashboard");

  await page.getByRole("button", { name: /mark shipped/i }).click();
  await page.getByLabel("Tracking ID").fill("TRACK-123");
  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page.getByText("SHIPPED")).toBeVisible();

  await page.goto(`/track/${escrowId}`);
  await expect(page.getByText("SHIPPED")).toBeVisible();
});
