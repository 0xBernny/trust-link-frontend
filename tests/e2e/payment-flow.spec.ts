import { mockFreighter } from "./helpers/mock-freighter";
import { test, expect } from "next/experimental/testmode/playwright";
import { setupNetworkMocks, setupNextOnFetch, type MockEscrow } from "./helpers/mock-api";

const TEST_ESCROW_ID = "test_escrow_e2e_001";
const MOCK_PUBLIC_KEY = "GBTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MOCK_TX_HASH = "abc123def456tx789hash_mock_payment_confirmed";
const MOCK_SIGNED_XDR = "AAAAAQAAAA...mock_signed_xdr";

const mockEscrow: MockEscrow = {
  id: TEST_ESCROW_ID,
  vendorId: "vendor_test_1",
  // No buyer yet — the escrow is claimed when the buyer funds it.
  buyerId: undefined,
  amount: 150.0,
  item: "Test Product",
  status: "FUNDED",
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
    // Escrow item name appears on page
    await expect(page.getByText("Test Product")).toBeVisible();
  });

  test("connects mock wallet", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    const connectBtn = page.getByTestId("connect-wallet-btn");
    await expect(connectBtn).toBeVisible();
    await connectBtn.click();

    // After connecting, the wallet-connected indicator appears
    await expect(page.getByTestId("wallet-connected")).toBeVisible({ timeout: 10_000 });
  });

  test("signs and submits mock transaction", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    // Connect wallet first
    await page.getByTestId("connect-wallet-btn").click();
    await expect(page.getByTestId("wallet-connected")).toBeVisible({ timeout: 10_000 });

    // Submit the payment
    const submitBtn = page.getByTestId("submit-payment-btn");
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Confirmation should appear
    await expect(page.getByTestId("payment-confirmation")).toBeVisible({ timeout: 10_000 });
  });

  test("asserts confirmation UI appears with tx hash", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    await page.getByTestId("connect-wallet-btn").click();
    await expect(page.getByTestId("wallet-connected")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("submit-payment-btn").click();

    // Confirmation section is visible
    await expect(page.getByTestId("payment-confirmation")).toBeVisible({ timeout: 10_000 });

    // Transaction hash is shown
    const txHashEl = page.getByTestId("tx-hash");
    await expect(txHashEl).toBeVisible();
    await expect(txHashEl).toContainText(MOCK_TX_HASH);
  });

  test("asserts tracking page is linked after confirmation", async ({ page, next }) => {
    setupNextOnFetch(next, { escrowId: TEST_ESCROW_ID, mockEscrow: { ...mockEscrow, status: "FUNDED" } });


    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    await page.getByTestId("connect-wallet-btn").click();
    await expect(page.getByTestId("wallet-connected")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("submit-payment-btn").click();
    await expect(page.getByTestId("payment-confirmation")).toBeVisible({ timeout: 10_000 });

    // Tracking link points to the correct track page
    const trackLink = page.getByTestId("track-link");
    await expect(trackLink).toBeVisible();
    await expect(trackLink).toHaveAttribute("href", `/track/${TEST_ESCROW_ID}`);
  });
});
