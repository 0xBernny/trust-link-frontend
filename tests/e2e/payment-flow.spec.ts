import { expect,test } from "next/experimental/testmode/playwright";

import { MOCK_TX_HASH } from "./helpers/constants";
import { type MockEscrow,setupNetworkMocks, setupNextOnFetch } from "./helpers/mock-api";
import { mockFreighter } from "./helpers/mock-freighter";

const TEST_ESCROW_ID = "test_escrow_e2e_001";
const MOCK_PUBLIC_KEY = "GBTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MOCK_SIGNED_XDR = "AAAAAQAAAA...mock_signed_xdr";

const mockEscrow: MockEscrow = {
  id: TEST_ESCROW_ID,
  vendorId: "vendor_test_1",
  // No buyer yet — the escrow is claimed when the buyer funds it.
  buyerId: undefined,
  amount: 150.0,
  item: "Test Product",
  status: "PENDING",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

test.describe("Buyer payment flow", () => {
  test.beforeEach(async ({ page, next }) => {
    await setupNetworkMocks(page, next, { escrowId: TEST_ESCROW_ID, mockEscrow });

    // Inject mock Freighter wallet into window before page load
    await mockFreighter(page, MOCK_PUBLIC_KEY, MOCK_SIGNED_XDR);
  });

  test("navigates to /pay/:escrowId with a test escrow", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    await expect(page).toHaveURL(`/pay/${TEST_ESCROW_ID}`);
    // Escrow item name appears on page in a definition element
    await expect(page.locator("dd").filter({ hasText: "Test Product" })).toBeVisible();
  });

  test("submits payment and shows success message", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    const payBtn = page.getByRole("button", { name: /Pay Now/i });
    await expect(payBtn).toBeVisible();
    
    // Fill contact info to bypass validation
    const emailInput = page.getByLabel(/Email address/i);
    await expect(async () => {
      await emailInput.fill("buyer@example.com");
      expect(await emailInput.inputValue()).toBe("buyer@example.com");
    }).toPass({ timeout: 5000 });
    
    await payBtn.click();

    // After connecting and signing, the success indicator appears
    await expect(page.getByText(/Freighter signature completed/i)).toBeVisible({ timeout: 10_000 });
  });

  test("displays tracking timeline when escrow is funded", async ({ page, next }) => {
    setupNextOnFetch(next, { escrowId: TEST_ESCROW_ID, mockEscrow: { ...mockEscrow, status: "FUNDED" } });

    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    await expect(page.getByText(/This escrow is already funded/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Shipment Tracking/i)).toBeVisible();
  });
});
