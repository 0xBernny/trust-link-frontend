import {
  Dispute,
  Escrow,
  Subscription,
  Tracking,
  type VendorNotificationPreferences,
  type VendorAnalyticsResponse,
  DisputeStatusConst,
} from "@/types";
import type { VendorNotificationPreferences } from "@/types";
import type {
  ApiErrorResponse,
  CreateDisputeResponse,
  CreateEscrowResponse,
  EmptyResponse,
  GetDisputeResponse,
  GetDisputesResponse,
  GetEscrowResponse,
  GetSubscriptionResponse,
  GetTrackingResponse,
  GetVendorAnalyticsResponse,
  GetVendorEscrowsResponse,
  GetVendorNotificationPreferencesResponse,
  ResolveDisputeResponse,
  ShipEscrowResponse,
  UpgradeSubscriptionResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** @deprecated Use `ApiErrorResponse` from `@/types/api`. Kept for existing imports. */
export type ApiErrorShape = ApiErrorResponse;

export class ApiError extends Error {
  status: number;
  body?: ApiErrorResponse;

  constructor(status: number, message: string, body?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface EscrowInput {
  itemName: string;
  priceUSDC: string;
  description: string;
  shippingWindow: string;
}

export type EscrowResponse = CreateEscrowResponse;

export interface CreateDisputeInput {
  reason: string;
  description: string;
  evidence: string[];
}

export interface ShipEscrowInput {
  trackingId: string;
  carrier?: string;
}

async function parseError(res: Response): Promise<ApiError> {
  const body = await res.text();
  try {
    const json = JSON.parse(body) as ApiErrorResponse;
    return new ApiError(res.status, json.message || json.error || json.details || res.statusText, json);
  } catch {
    return new ApiError(res.status, body || res.statusText, undefined);
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: init.cache ?? "no-store" });
  if (!res.ok) {
    throw await parseError(res);
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
}

export async function createEscrow(data: EscrowInput, token?: string): Promise<CreateEscrowResponse> {
  return request<CreateEscrowResponse>("/escrow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token);
}

export async function getEscrow(id: string, token?: string): Promise<GetEscrowResponse> {
  try {
    return await request<GetEscrowResponse>(`/escrow/${id}`, {}, token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return request<GetEscrowResponse>(`/escrows/${id}`, {}, token);
    }
    throw error;
  }
}

export async function getVendorEscrows(token?: string): Promise<GetVendorEscrowsResponse> {
  return request<GetVendorEscrowsResponse>("/vendor/escrows", {}, token);
}

export async function getDispute(id: string, token?: string): Promise<GetDisputeResponse> {
  return request<GetDisputeResponse>(`/disputes/${id}`, {}, token);
}

export async function getAdminDisputes(token?: string): Promise<GetDisputesResponse> {
  const disputes = await request<GetDisputesResponse>("/disputes?status=OPEN,UNDER_REVIEW", {}, token);
  return disputes.filter((dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW");
}

export async function resolveDispute(id: string, resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER", token?: string): Promise<ResolveDisputeResponse> {
  return request<ResolveDisputeResponse>(`/disputes/${id}/resolve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution }),
  }, token);
}

export async function createDispute(escrowId: string, data: CreateDisputeInput, token?: string): Promise<CreateDisputeResponse> {
  return request<CreateDisputeResponse>(`/escrows/${escrowId}/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token);
}

export async function shipEscrow(escrowId: string, data: ShipEscrowInput, token?: string): Promise<ShipEscrowResponse> {
  return request<ShipEscrowResponse>(`/escrows/${escrowId}/ship`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token);
}

export async function getTracking(escrowId: string, token?: string): Promise<GetTrackingResponse> {
  return request<GetTrackingResponse>(`/escrows/${escrowId}/tracking`, {}, token);
}

export async function getSubscription(token?: string): Promise<GetSubscriptionResponse> {
  return request<GetSubscriptionResponse>("/subscription", {}, token);
}

export async function upgradeSubscription(token?: string): Promise<UpgradeSubscriptionResponse> {
  return request<UpgradeSubscriptionResponse>("/subscription/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, token);
}

export async function getVendorNotificationPreferences(token: string): Promise<GetVendorNotificationPreferencesResponse> {
  return request<GetVendorNotificationPreferencesResponse>("/vendor/notifications", {}, token);
}

export async function patchVendorNotifications(prefs: VendorNotificationPreferences, token: string): Promise<EmptyResponse> {
  await request<EmptyResponse>("/vendor/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  }, token);
}

export async function patchBuyerContact(escrowId: string, data: { email?: string; phone?: string }, token?: string): Promise<EmptyResponse> {
  await request<EmptyResponse>(`/escrow/${escrowId}/buyer-contact`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token);
}

export async function getVendorAnalytics(token?: string): Promise<GetVendorAnalyticsResponse> {
  return request<GetVendorAnalyticsResponse>("/vendor/analytics", {}, token);
}

export function createApiClient(token?: string) {
  return {
    createEscrow: (data: EscrowInput) => createEscrow(data, token),
    getEscrow: (id: string) => getEscrow(id, token),
    getVendorEscrows: () => getVendorEscrows(token),
    getDispute: (id: string) => getDispute(id, token),
    getAdminDisputes: () => getAdminDisputes(token),
    resolveDispute: (id: string, resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER") => resolveDispute(id, resolution, token),
    createDispute: (escrowId: string, data: CreateDisputeInput) => createDispute(escrowId, data, token),
    shipEscrow: (escrowId: string, data: ShipEscrowInput) => shipEscrow(escrowId, data, token),
    getTracking: (escrowId: string) => getTracking(escrowId, token),
    getSubscription: () => getSubscription(token),
    upgradeSubscription: () => upgradeSubscription(token),
    getVendorNotificationPreferences: (authToken = token ?? "") => getVendorNotificationPreferences(authToken),
    patchVendorNotifications: (prefs: VendorNotificationPreferences, authToken = token ?? "") => patchVendorNotifications(prefs, authToken),
    patchBuyerContact: (escrowId: string, data: { email?: string; phone?: string }) => patchBuyerContact(escrowId, data, token),
    getVendorAnalytics: () => getVendorAnalytics(token),
  };
}
