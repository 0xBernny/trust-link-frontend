# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dispute-resolution.spec.ts >> admin can resolve a dispute and the dispute list updates
- Location: tests/e2e/admin-dispute-resolution.spec.ts:29:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/release to vendor/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/release to vendor/i)
    - waiting for "http://127.0.0.1:3000/admin/disputes" navigation to finish...
    - navigated to "http://127.0.0.1:3000/admin/disputes"

```

```yaml
- alert: You are on Testnet — funds have no real value
- link "Skip to content":
  - /url: "#main-content"
- banner:
  - text: TrustLink
  - switch "Switch to Mainnet": Testnet
  - button "Switch to dark mode"
- main:
  - main:
    - region "Admin Disputes":
      - heading "Admin Disputes" [level=1]
      - paragraph: "Open Disputes: 0"
      - text: Sort by
      - combobox "Sort disputes by field":
        - option "Date" [selected]
        - option "Amount"
        - option "Status"
      - status "Loading disputes":
        - article
        - article
        - article
- contentinfo:
  - paragraph: © 2026 TrustLink
  - text: "Language:"
  - combobox "Select language":
    - option "English" [selected]
    - option "Français"
    - option "Pidgin"
- region "Notifications alt+T"
```

# Test source

```ts
  1  | import { mockFreighter } from "./helpers/mock-freighter";
  2  | import { expect, test } from "next/experimental/testmode/playwright";
  3  | 
  4  | const disputeId = "dispute-1";
  5  | let isResolved = false;
  6  | 
  7  | const mockDispute = {
  8  |   id: disputeId,
  9  |   escrowId: "escrow-42",
  10 |   buyerId: "GBUYER8TESTING1234567890ABCDEF",
  11 |   reason: "Item not received",
  12 |   evidence: ["https://example.com/evidence.jpg"],
  13 |   status: "OPEN",
  14 |   createdAt: "2026-01-01T00:00:00Z",
  15 |   updatedAt: "2026-01-02T00:00:00Z",
  16 |   escrow: {
  17 |     id: "escrow-42",
  18 |     vendorId: "GCFM4VENDOR8TESTING1234567890ABCDEF",
  19 |     buyerId: "GBUYER8TESTING1234567890ABCDEF",
  20 |     item: "Gold Necklace",
  21 |     amount: 180.0,
  22 |     status: "DISPUTED",
  23 |     createdAt: "2026-01-01T00:00:00Z",
  24 |     updatedAt: "2026-01-02T00:00:00Z",
  25 |     history: [],
  26 |   },
  27 | };
  28 | 
  29 | test("admin can resolve a dispute and the dispute list updates", async ({ page, next }) => {
  30 |   isResolved = false;
  31 | 
  32 |   await page.addInitScript(() => {
  33 |     window.localStorage.setItem("wallet.jwt", "jwt-token");
  34 |   });
  35 | 
  36 |   // Intercept client-side fetches (DisputesListClient uses client-side fetch)
  37 |   await page.route("**/disputes?status=OPEN,UNDER_REVIEW", async (route) => {
  38 |     const body = isResolved ? [] : [mockDispute];
  39 |     await route.fulfill({
  40 |       status: 200,
  41 |       contentType: "application/json",
  42 |       body: JSON.stringify(body),
  43 |     });
  44 |   });
  45 | 
  46 |   // Intercept client-side resolve action
  47 |   await page.route(`**/disputes/${disputeId}/resolve`, async (route) => {
  48 |     isResolved = true;
  49 |     await route.fulfill({
  50 |       status: 200,
  51 |       contentType: "application/json",
  52 |       body: JSON.stringify({
  53 |         ...mockDispute,
  54 |         status: "RESOLVED",
  55 |         resolution: "RELEASE_TO_VENDOR",
  56 |       }),
  57 |     });
  58 |   });
  59 | 
  60 |   // Intercept server-side fetch for the dispute detail page
  61 |   // (app/admin/disputes/[id]/page.tsx fetches data server-side)
  62 |   next.onFetch(async (request) => {
  63 |     const url = new URL(request.url);
  64 |     if (url.pathname === `/disputes/${disputeId}`) {
  65 |       return new Response(JSON.stringify(mockDispute), {
  66 |         status: 200,
  67 |         headers: { "Content-Type": "application/json" },
  68 |       });
  69 |     }
  70 |     return "continue";
  71 |   });
  72 | 
  73 |   await page.goto("/admin/disputes");
  74 | 
  75 |   await expect(page.getByText("Admin Disputes")).toBeVisible();
  76 |   await page.getByRole("link", { name: /view dispute/i }).click();
  77 |   await page.waitForURL(`/admin/disputes/${disputeId}`, { timeout: 15_000 });
  78 | 
> 79 |   await expect(page.getByText(/release to vendor/i)).toBeVisible({ timeout: 10_000 });
     |                                                      ^ Error: expect(locator).toBeVisible() failed
  80 |   await page.getByRole("button", { name: /release to vendor/i }).click();
  81 |   await page.getByRole("button", { name: /confirm/i }).click();
  82 | 
  83 |   await expect(page.getByText(/no open disputes right now/i)).toBeVisible({ timeout: 10_000 });
  84 | });
  85 | 
```