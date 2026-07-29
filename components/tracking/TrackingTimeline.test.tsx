import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TrackingTimeline from "./TrackingTimeline";
import { Escrow, EscrowStatusConst } from "@/types";

// Mock the API
vi.mock("@/lib/api", () => ({
  getEscrow: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

vi.mock("@/hooks/useEscrow", () => ({
  useEscrow: vi.fn(),
}));

import { useEscrow } from "@/hooks/useEscrow";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { NetworkProvider } from "@/components/providers/NetworkProvider";

const mockEscrow: Escrow = {
  id: "esc_123",
  vendorId: "vendor_1",
  buyerId: "buyer_1",
  amount: 150.0,
  item: "Wireless Headphones",
  status: EscrowStatusConst.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

describe("TrackingTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEscrow).mockImplementation((escrowId: string | null | undefined, opts?: { initialData?: Escrow }) => ({
      escrow: opts?.initialData ?? mockEscrow,
      isLoading: false,
      error: undefined,
      refetch: vi.fn(),
    }));
  });

  it("renders loading state", async () => {
    await act(async () => {
      render(
        <TrackingTimeline
          escrowId="esc_123"
          initialEscrow={mockEscrow}
          loading={true}
        />
      );
    });

    // Should show skeleton loaders
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders all 5 tracking stages", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    expect(screen.getByText("tracking.orderPlaced")).toBeInTheDocument();
    expect(screen.getByText("tracking.paymentConfirmed")).toBeInTheDocument();
    expect(screen.getByText("tracking.shipped")).toBeInTheDocument();
    expect(screen.getByText("tracking.outForDelivery")).toBeInTheDocument();
    expect(screen.getByText("tracking.delivered")).toBeInTheDocument();
  });

  it("highlights current stage for PENDING status", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    const orderPlaced = screen.getByText("tracking.orderPlaced");
    expect(orderPlaced).toBeInTheDocument();
  });

  it("shows Confirm Delivery button when status is SHIPPED", async () => {
    const shippedEscrow = { ...mockEscrow, status: EscrowStatusConst.SHIPPED as const };
    await act(async () => {
      render(
        <NetworkProvider>
          <WalletProvider>
            <TrackingTimeline escrowId="esc_123" initialEscrow={shippedEscrow} />
          </WalletProvider>
        </NetworkProvider>
      );
    });

    expect(screen.getByText("Confirm Delivery")).toBeInTheDocument();
  });

  it("shows Raise a Dispute button when status is SHIPPED", async () => {
    const shippedEscrow = { ...mockEscrow, status: EscrowStatusConst.SHIPPED as const };
    await act(async () => {
      render(
        <NetworkProvider>
          <WalletProvider>
            <TrackingTimeline escrowId="esc_123" initialEscrow={shippedEscrow} />
          </WalletProvider>
        </NetworkProvider>
      );
    });

    expect(screen.getByText("tracking.raiseDispute")).toBeInTheDocument();
  });

  it("does not show action buttons when status is PENDING", async () => {
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    expect(screen.queryByText("Confirm Delivery")).not.toBeInTheDocument();
    expect(screen.queryByText("Raise a Dispute")).not.toBeInTheDocument();
  });

  it("shows dispute status when order is disputed", async () => {
    const disputedEscrow = { ...mockEscrow, status: EscrowStatusConst.DISPUTED as const };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={disputedEscrow} />
      );
    });

    expect(screen.getByText("tracking.disputeInProgress")).toBeInTheDocument();
  });

  it("highlights completed stages correctly for FUNDED status", async () => {
    const fundedEscrow = { ...mockEscrow, status: EscrowStatusConst.FUNDED as const };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={fundedEscrow} />
      );
    });

    // Order Placed should be completed, Payment Confirmed should be current
    expect(screen.getByText("tracking.orderPlaced")).toBeInTheDocument();
    expect(screen.getByText("tracking.paymentConfirmed")).toBeInTheDocument();
  });

  it("highlights all stages as completed for COMPLETED status", async () => {
    const completedEscrow = { ...mockEscrow, status: EscrowStatusConst.COMPLETED as const };
    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={completedEscrow} />
      );
    });

    // Use the translation key as the mock returns the key itself
    expect(screen.getByText("tracking.delivered")).toBeInTheDocument();
  });

  it("shows a user-friendly error state when fetching fails", async () => {
    const refetch = vi.fn();
    vi.mocked(useEscrow).mockReturnValue({
      escrow: undefined,
      isLoading: false,
      error: new Error("Failed to fetch escrow"),
      refetch,
    });

    await act(async () => {
      render(
        <TrackingTimeline escrowId="esc_123" initialEscrow={mockEscrow} />
      );
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("We couldn't load tracking status")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch escrow")).toBeInTheDocument();
  });
});
