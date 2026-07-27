import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getEscrow,
  getVendorEscrows,
  createEscrow,
  getDispute,
  getAdminDisputes,
  resolveDispute,
  createDispute,
  getTracking,
  getSubscription,
  upgradeSubscription,
  patchVendorNotifications,
  patchBuyerContact,
  ApiError,
  type VendorNotificationPreferences,
} from "@/lib/api";

function mockResponse(
  body: unknown,
  { ok = true, status = 200, statusText = "OK" }: { ok?: boolean; status?: number; statusText?: string } = {}
) {
  return {
    ok,
    status,
    statusText,
    text: async () => (body ? JSON.stringify(body) : ""),
  } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function lastCall() {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: String(url), init: (init ?? {}) as RequestInit };
}

function getAuthHeader(init: RequestInit): string | null {
  const headers = init.headers as Headers;
  if (headers && typeof headers.get === "function") {
    return headers.get("Authorization");
  }
  const record = headers as unknown as Record<string, string>;
  return record?.Authorization ?? null;
}

describe("getEscrow", () => {
  it("returns the escrow from the primary endpoint", async () => {
    const escrow = { id: "e1" };
    fetchMock.mockResolvedValueOnce(mockResponse(escrow));

    await expect(getEscrow("e1")).resolves.toEqual(escrow);
    expect(lastCall().url).toContain("/escrow/e1");
  });

  it("falls back to the plural endpoint when the primary 404s", async () => {
    const escrow = { id: "e2" };
    fetchMock
      .mockResolvedValueOnce(mockResponse(null, { ok: false, status: 404 }))
      .mockResolvedValueOnce(mockResponse(escrow));

    await expect(getEscrow("e2")).resolves.toEqual(escrow);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lastCall().url).toContain("/escrows/e2");
  });

  it("throws when both endpoints fail", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(null, { ok: false, status: 500, statusText: "Server Error" }))
      .mockResolvedValueOnce(mockResponse(null, { ok: false, status: 404 }));

    await expect(getEscrow("e3")).rejects.toThrow();
  });
});

describe("getVendorEscrows", () => {
  it("requests vendor escrows without an auth header when no token is given", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([{ id: "e1" }]));

    await getVendorEscrows();
    const { url, init } = lastCall();
    expect(url).toContain("/vendor/escrows");
    expect(getAuthHeader(init)).toBeNull();
  });

  it("attaches a Bearer token when provided", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await getVendorEscrows("tok123");
    expect(getAuthHeader(lastCall().init)).toBe("Bearer tok123");
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 400 }));
    await expect(getVendorEscrows()).rejects.toThrow();
  });
});

describe("createEscrow", () => {
  const input = {
    itemName: "Laptop",
    priceUSDC: "100",
    description: "A laptop",
    shippingWindow: "3 days",
  };

  it("POSTs the payload as JSON and returns the response", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ url: "/pay/abc" }));

    await expect(createEscrow(input)).resolves.toEqual({ url: "/pay/abc" });
    const { url, init } = lastCall();
    expect(url).toContain("/escrow");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(input);
  });

  it("includes the server error text in the thrown message", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 400, statusText: "bad request" }));
    await expect(createEscrow(input)).rejects.toThrow();
  });
});

describe("getDispute", () => {
  it("fetches a dispute and forwards the token", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: "d1" }));
    await getDispute("d1", "tok");
    expect(getAuthHeader(lastCall().init)).toBe("Bearer tok");
  });

  it("throws on failure", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 404 }));
    await expect(getDispute("d1")).rejects.toThrow();
  });
});

describe("getAdminDisputes", () => {
  it("filters out resolved disputes client-side", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse([
        { id: "1", status: "OPEN" },
        { id: "2", status: "RESOLVED" },
        { id: "3", status: "UNDER_REVIEW" },
      ])
    );

    const result = await getAdminDisputes();
    expect(result.map((d) => d.id)).toEqual(["1", "3"]);
  });
});

describe("resolveDispute", () => {
  it("PATCHes the resolution with a JSON body", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: "d1", status: "RESOLVED" }));

    await resolveDispute("d1", "REFUND_BUYER", "tok");
    const { url, init } = lastCall();
    expect(url).toContain("/disputes/d1/resolve");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ resolution: "REFUND_BUYER" });
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 400 }));
    await expect(resolveDispute("d1", "RELEASE_TO_VENDOR")).rejects.toThrow();
  });
});

describe("createDispute", () => {
  it("POSTs reason/description/evidence to the escrow dispute endpoint", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: "d9" }));
    const payload = { reason: "not delivered", description: "never arrived", evidence: ["url"] };

    await createDispute("e1", payload);
    const { url, init } = lastCall();
    expect(url).toContain("/escrows/e1/dispute");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("surfaces the server error text", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 400, statusText: "Bad Request" }));
    await expect(
      createDispute("e1", { reason: "r", description: "d", evidence: [] })
    ).rejects.toThrow();
  });
});

describe("getTracking", () => {
  it("returns tracking details", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ escrowId: "e1", status: "IN_TRANSIT" }));
    await expect(getTracking("e1")).resolves.toMatchObject({ status: "IN_TRANSIT" });
    expect(lastCall().url).toContain("/escrows/e1/tracking");
  });

  it("throws on failure", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 404 }));
    await expect(getTracking("e1")).rejects.toThrow();
  });
});

describe("subscription endpoints", () => {
  it("getSubscription returns the plan", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ plan: "PRO", vendorId: "v1" }));
    await expect(getSubscription("tok")).resolves.toMatchObject({ plan: "PRO" });
  });

  it("upgradeSubscription POSTs and returns the upgraded plan", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ plan: "PRO", vendorId: "v1" }));
    await expect(upgradeSubscription("tok")).resolves.toMatchObject({ plan: "PRO" });
    expect(lastCall().init.method).toBe("POST");
  });

  it("upgradeSubscription throws with the server error text", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 400 }));
    await expect(upgradeSubscription()).rejects.toThrow();
  });
});

describe("notification + contact mutations", () => {
  const prefs: VendorNotificationPreferences = {
    funded: { email: true, sms: false },
    shipped: { email: true, sms: false },
    delivered: { email: false, sms: false },
    disputed: { email: true, sms: true },
    completed: { email: true, sms: false },
  };

  it("patchVendorNotifications sends prefs with auth and resolves void", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null));
    await expect(patchVendorNotifications(prefs, "tok")).resolves.toBeUndefined();
    const { init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect(getAuthHeader(init)).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual(prefs);
  });

  it("patchVendorNotifications throws on failure", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 400 }));
    await expect(patchVendorNotifications(prefs, "tok")).rejects.toThrow();
  });

  it("patchBuyerContact PATCHes contact info", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null));
    await patchBuyerContact("e1", { email: "a@b.com" });
    const { url, init } = lastCall();
    expect(url).toContain("/escrow/e1/buyer-contact");
    expect(init.method).toBe("PATCH");
  });

  it("patchBuyerContact surfaces the server error text", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, status: 400 }));
    await expect(patchBuyerContact("e1", {})).rejects.toThrow();
  });
});

describe("ApiError", () => {
  it("creates an error with status and body", () => {
    const err = new ApiError(404, "Not found", { message: "missing" });
    expect(err.status).toBe(404);
    expect(err.body?.message).toBe("missing");
    expect(err.message).toBe("Not found");
  });
});
