import { NextFixture } from "next/experimental/testmode/playwright";

export interface MockApiOptions {
  escrowId?: string;
  mockEscrow?: Record<string, unknown>;
  mockDispute?: Record<string, unknown>;
  mockEscrowsList?: Record<string, unknown>[];
  mockDisputesList?: Record<string, unknown>[];
}

export function setupNextOnFetch(next: NextFixture, options?: MockApiOptions) {
  next.onFetch(async (request) => {
    const url = new URL(request.url);

    // Auth
    if (url.pathname.includes("/auth/challenge")) {
      return new Response(
        JSON.stringify({
          transaction: "challenge-xdr",
          network_passphrase: "Test SDF Network ; September 2015",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    if (url.pathname.includes("/auth/verify")) {
      return new Response(JSON.stringify({ token: "jwt-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Single Escrow (GET/POST/PUT)
    if (
      options?.escrowId &&
      (url.pathname.endsWith(`/escrow/${options.escrowId}`) ||
        url.pathname.endsWith(`/escrows/${options.escrowId}`))
    ) {
      return new Response(JSON.stringify(options.mockEscrow), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fund Escrow
    if (
      options?.escrowId &&
      url.pathname.includes(`/escrows/${options.escrowId}/fund`)
    ) {
      return new Response(
        JSON.stringify({
          txHash: "abc123def456tx789hash_mock_payment_confirmed",
          escrowId: options.escrowId,
          status: "FUNDED",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ship Escrow
    if (
      options?.escrowId &&
      url.pathname.includes(`/escrow/${options.escrowId}/ship`)
    ) {
      return new Response(
        JSON.stringify({
          ...(options.mockEscrow || {}),
          status: "SHIPPED",
          trackingId: "TRACK-123",
          carrier: "Terminal Africa",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Dispute Escrow (Create or Fetch)
    if (
      options?.escrowId &&
      url.pathname.includes(`/escrows/${options.escrowId}/dispute`)
    ) {
      return new Response(JSON.stringify(options.mockDispute), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vendor Dashboard Escrows
    if (url.pathname.includes("/vendor/escrows") && options?.mockEscrowsList) {
      return new Response(JSON.stringify(options.mockEscrowsList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Escrow
    if (url.pathname.endsWith("/escrow") && request.method === "POST") {
      let payload: Record<string, unknown> = {};
      try {
        const body = await request.clone().text();
        if (body) payload = JSON.parse(body);
      } catch {
        // ignore JSON parse error
      }

      return new Response(
        JSON.stringify({
          url: `https://trustlink.example.com/escrow/${encodeURIComponent(
            payload.itemName || "ESCROW-12345"
          )}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Disputes List
    if (url.pathname.includes("/disputes") && request.method === "GET") {
      // If asking for a specific dispute by ID
      if (options?.mockDispute && url.pathname.match(/\/disputes\/[^?]+$/)) {
        return new Response(JSON.stringify(options.mockDispute), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      // If asking for a list
      if (options?.mockDisputesList) {
        return new Response(JSON.stringify(options.mockDisputesList), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Resolve Dispute
    if (url.pathname.includes("/resolve") && request.method === "POST") {
      return new Response(
        JSON.stringify({ ...(options?.mockDispute || {}), status: "RESOLVED" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return "continue";
  });
}
