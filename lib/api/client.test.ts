import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, createApiClient } from "./client";

const fetchMock = vi.fn();

function mockResponse(body: unknown, { ok = true, status = 200, statusText = "OK" }: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return {
    ok,
    status,
    statusText,
    text: async () => (body ? JSON.stringify(body) : ""),
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("injects the auth header automatically from the client token", async () => {
    fetchMock.mockResolvedOnce(mockResponse({ ok: true }));

    const client = createApiClient("jht-123");
    await client.getEscrow("e1");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("Authorization").toBe("Bearer jht-123");
  });

  it("returns typed JSON and surfaces ApiError on failure", async () => {
    fetchMock.mockResolved(mockResponse({ message: "bad" }, { ok: false, status: 400, statusText: "Bad Request" }));

    const client = createApiClient();

    await expect(client.getEscrow("bad")).rejects.toBeInstanceOf(ApiError);
    await expect(client.getEscrow("bad")).rejects.toMatchObject({ status: 400 });
  });

  it("supports the dispute and shipping helpers", async () => {
    fetchMock
      .mockResolvedOnce(mockResponse({ id: "d1" }))
      .mockResolvedOnce(mockResponse({ escrowId: "e1" }));

    const client = createApiClient("jwt-456");
    await expect(client.createDispute("e1", { reason: "late", description: "late", evidence: ["a"] })).resolves.toEqual({ id: "d1" });
    await expect(client.shipEscrow("e1", { trackingId: "t1", carrier: "UPS" })).resolves.toEqual({ escrowId: "e1" });
  });

  // New tests for acceptance criteria

  it("parses JSON error responses into ApiError with message", async () => {
    fetchMock.mockResolvedOnce(
      mockResponse({ message: "Not Found" }, { ok: false, status: 404, statusText: "Not Found" })
    );

    const client = createApiClient();
    const error = await client.getEscrow("missing").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toContain("Not Found");
  });

  it("parses non-JSON (plain text) error responses into ApiError", async () => {
    fetchMock.mockResolvedOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Server exploded",
    } as unknown as Response);

    const client = createApiClient();
    const error = await client.getEscrow("boom").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toContain("Server exploded");
  });

  it("falls back from /escrow/{id} to /escrows/{id} on 404", async () => {
    fetchMock
      .mockResolvedOnce(
        mockResponse({ message: "Not Found" }, { ok: false, status: 404, statusText: "Not Found" })
      )
      .mockResolvedOnce(mockResponse({ id: "e1", status: "active" }));

    const client = createApiClient();
    const result = await client.getEscrow("e1");

    expect(result).toEqual({ id: "e1", status: "active" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/escrow/e1");
    expect(fetchMock.mock.calls[1][0]).toContain("/escrows/e1");
  });

  it("does not set an Authorization header when no token is provided", async () => {
    fetchMock.mockResolvedOnce(mockResponse({ ok: true }));

    const client = createApiClient();
    await client.getEscrow("e1");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});
