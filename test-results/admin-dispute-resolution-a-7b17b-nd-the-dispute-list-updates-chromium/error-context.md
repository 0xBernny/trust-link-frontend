# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dispute-resolution.spec.ts >> admin can resolve a dispute and the dispute list updates
- Location: tests/e2e/admin-dispute-resolution.spec.ts:29:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/admin/disputes/dispute-1" until "load"
  navigated to "http://127.0.0.1:3000/admin/disputes"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - alert [ref=f1e2]: You are on Testnet — funds have no real value
  - link "Skip to content" [ref=f1e3] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=f1e4]:
    - generic [ref=f1e5]:
      - generic [ref=f1e6]: TrustLink
      - generic [ref=f1e8]:
        - switch "Switch to Mainnet" [ref=f1e9] [cursor=pointer]:
          - generic [ref=f1e11]: Testnet
        - button "Switch to dark mode" [ref=f1e12]
  - main [ref=f1e15]:
    - main [ref=f1e17]:
      - region [ref=f1e19]:
        - generic [ref=f1e20]:
          - generic [ref=f1e21]:
            - heading "Admin Disputes" [level=1] [ref=f1e22]
            - paragraph [ref=f1e23]: "Open Disputes: 1"
          - generic [ref=f1e24]:
            - text: Sort by
            - combobox "Sort disputes by field" [ref=f1e25]:
              - option "Date" [selected]
              - option "Amount"
              - option "Status"
        - list "Disputes list" [ref=f1e26]:
          - listitem [ref=f1e27]:
            - generic [ref=f1e28]:
              - generic [ref=f1e29]:
                - paragraph [ref=f1e30]: Gold Necklace
                - paragraph [ref=f1e31]: "Escrow #escrow-42"
                - paragraph [ref=f1e32]: Item not received
              - generic [ref=f1e33]:
                - paragraph [ref=f1e34]: 180.00 USDC
                - paragraph [ref=f1e35]: OPEN
                - paragraph [ref=f1e36]: 7 months ago
            - generic [ref=f1e37]:
              - paragraph [ref=f1e38]: "Evidence links: 1"
              - link "View dispute for Gold Necklace" [ref=f1e39] [cursor=pointer]:
                - /url: /admin/disputes/dispute-1
                - text: View Dispute
  - contentinfo [ref=f1e40]:
    - generic [ref=f1e41]:
      - paragraph [ref=f1e42]: © 2026 TrustLink
      - generic [ref=f1e43]:
        - generic [ref=f1e44]: "Language:"
        - combobox "Select language" [ref=f1e45]:
          - option "English" [selected]
          - option "Français"
          - option "Pidgin"
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=f1e51] [cursor=pointer]
  - alert [ref=f1e55]
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
> 77 |   await page.waitForURL(`/admin/disputes/${disputeId}`, { timeout: 15_000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  78 | 
  79 |   await expect(page.getByText(/release to vendor/i)).toBeVisible({ timeout: 10_000 });
  80 |   await page.getByRole("button", { name: /release to vendor/i }).click();
  81 |   await page.getByRole("button", { name: /confirm/i }).click();
  82 | 
  83 |   await expect(page.getByText(/no open disputes right now/i)).toBeVisible({ timeout: 10_000 });
  84 | });
  85 | 
```