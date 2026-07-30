import { beforeEach,describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/escrowStore", () => ({
  getEscrowItems: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
}));

import { getEscrowItems } from "@/lib/escrowStore";

describe("GET /api/escrow", () => {
  beforeEach(() => {
    vi.mocked(getEscrowItems).mockReset();
  });

  it("returns escrow items with a 200 status", async () => {
    const escrowItems = [
      { escrowId: "escrow-1", vendor: "Alliance Logistics", orders: 24, status: "Ready" },
    ];
    vi.mocked(getEscrowItems).mockReturnValue(escrowItems);

    const response = await GET(new Request("https://test.local/escrow"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(escrowItems);
  });
});
