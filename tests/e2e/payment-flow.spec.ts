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

test.describe("Buyer payment flow — wallet rejection", () => {
  test.beforeEach(async ({ page, next }) => {
    await setupNetworkMocks(page, next, { escrowId: TEST_ESCROW_ID, mockEscrow });

    // Freighter connects fine, but the user presses "Reject" on the signing
    // dialog, so `signTransaction` comes back with an error instead of an XDR.
    // Inline Freighter mock with rejection — avoids modifying helpers/mock-freighter.ts
    // so only this spec file is touched per task constraints.
    const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
    await page.addInitScript(
      ({ pubKey, signedTx, networkPassphrase }) => {
        (window as unknown as Record<string, unknown>).freighter = "mocked";
        window.addEventListener("message", (e: MessageEvent) => {
          if (e.source !== window || !e.data) return;
          if (e.data.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;

          const type = e.data.type as string | undefined;
          const reqId = e.data.messageId as string | undefined;

          const respond = (data: Record<string, unknown>) => {
            if (!reqId) return;
            window.postMessage(
              {
                source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
                messagedId: reqId,
                ...data,
              },
              window.location.origin,
            );
          };

          if (type === "REQUEST_CONNECTION_STATUS") respond({ isConnected: true });
          if (type === "REQUEST_PUBLIC_KEY") respond({ publicKey: pubKey });
          if (type === "REQUEST_NETWORK_DETAILS")
            respond({
              networkDetails: {
                network: "TESTNET",
                networkUrl: "",
                networkPassphrase,
              },
            });
          if (type === "REQUEST_ALLOWED_STATUS") respond({ isAllowed: true });
          if (type === "SET_ALLOWED_STATUS") respond({ isAllowed: true });
          if (type === "REQUEST_ACCESS") respond({ publicKey: pubKey, isAllowed: true });
          if (type === "SUBMIT_TRANSACTION") {
            // Shape mirrors a real Freighter rejection: `apiError` is set and
            // no signed transaction is returned — surfaces as "User declined access".
            respond({
              signedTransaction: "",
              signerAddress: "",
              apiError: { code: -4, message: "User declined access" },
            });
          }
          if (type === "SUBMIT_TOKEN") respond({ contractId: "", error: "" });
        });
      },
      { pubKey: MOCK_PUBLIC_KEY, signedTx: MOCK_SIGNED_XDR, networkPassphrase: NETWORK_PASSPHRASE },
    );
  });

  test("shows an error toast and no success state when the user rejects the signature", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    const payBtn = page.getByRole("button", { name: /Pay Now/i });
    // The button stays disabled until the wallet provider finishes initialising,
    // which also means the payment form has hydrated and won't reset our input.
    await expect(payBtn).toBeEnabled({ timeout: 15_000 });

    const emailInput = page.getByLabel(/Email address/i);
    const errorToast = page
      .locator('[data-sonner-toast][data-type="error"]')
      .filter({ hasText: /sign|authentication/i });

    // Enter contact details and submit. Retry the whole interaction: a stray
    // keystroke landing before React finished hydrating the controlled input
    // would otherwise trip the "provide a contact method" guard instead of
    // reaching the wallet.
    await expect(async () => {
      await emailInput.fill("");
      await emailInput.pressSequentially("buyer@example.com", { delay: 15 });
      await expect(emailInput).toHaveValue("buyer@example.com");
      await payBtn.click();
      await expect(errorToast.first()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 20_000 });

    // The success confirmation must never appear on a rejected signature.
    await expect(page.getByText(/Freighter signature completed/i)).toHaveCount(0);

    // The button recovers so the buyer can retry.
    await expect(payBtn).toBeEnabled();
    await expect(payBtn).toHaveText(/Pay Now/i);
  });
});
