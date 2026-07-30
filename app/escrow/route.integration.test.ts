import { NextRequest } from "next/server";
import { beforeEach,describe, expect, it } from "vitest";

import { __resetRateLimitMemory } from "@/lib/rateLimit";

import { PATCH } from "./[id]/ship/route";
import { GET } from "./route";

describe("API Route Integration Tests: Escrow & Shipping", () => {
  beforeEach(() => {
    __resetRateLimitMemory();
  });

  describe("GET /escrow Integration", () => {
    it("returns 200 OK with array of escrow items", async () => {
      const request = new Request("http://localhost/escrow");
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty("escrowId");
      expect(body[0]).toHaveProperty("status");
    });

    it("returns 429 Too Many Requests when rate limit is exceeded", async () => {
      const request = new Request("http://localhost/escrow", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      // Fire 20 allowed requests
      for (let i = 0; i < 20; i++) {
        const res = await GET(request);
        expect(res.status).toBe(200);
      }

      // The 21st request should be rate limited
      const rateLimitedRes = await GET(request);
      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.headers.get("Retry-After")).toBeDefined();

      const body = await rateLimitedRes.json();
      expect(body.message).toContain("Too many requests");
    });
  });

  describe("PATCH /escrow/:id/ship Integration", () => {
    it("returns 400 Bad Request when trackingId is missing", async () => {
      const request = new Request("http://localhost/escrow/escrow-1/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier: "FedEx" }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "escrow-1" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message).toBe("Tracking ID is required.");
    });

    it("returns 400 Bad Request when trackingId exceeds 64 characters", async () => {
      const longTrackingId = "A".repeat(65);
      const request = new Request("http://localhost/escrow/escrow-1/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: longTrackingId }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "escrow-1" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message).toBe("Tracking ID must be 64 characters or less.");
    });

    it("successfully ships an escrow item and updates status to Shipped", async () => {
      const request = new Request("http://localhost/escrow/escrow-1/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: "TRK-987654", carrier: "DHL Express" }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "escrow-1" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.escrowId).toBe("escrow-1");
      expect(body.status).toBe("Shipped");
      expect(body.trackingId).toBe("TRK-987654");
      expect(body.carrier).toBe("DHL Express");
    });

    it("returns 404 Not Found when attempting to ship a non-existent escrow", async () => {
      const request = new Request("http://localhost/escrow/non-existent-id/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: "TRK-000000" }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "non-existent-id" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.message).toBe("Escrow item not found.");
    });
  });
});
