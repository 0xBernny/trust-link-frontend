import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import EscrowTableRow from "../EscrowTableRow";

const mockEscrow = {
  id: "escrow-1",
  item: "Test Product",
  buyer: "GBUYER...",
  amount: 100,
  status: "PENDING" as const,
  createdAt: "2026-05-01",
};

describe("EscrowTableRow", () => {
  it("renders cancel button for PENDING escrows and handles click", () => {
    const handleCancel = vi.fn();
    const handleCopy = vi.fn();

    render(
      <table>
        <tbody>
          <EscrowTableRow
            escrow={mockEscrow}
            onCancelEscrow={handleCancel}
            onCopyLink={handleCopy}
          />
        </tbody>
      </table>
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(handleCancel).toHaveBeenCalledWith(mockEscrow);
  });

  it("does not render cancel button for non-PENDING escrows", () => {
    const handleCancel = vi.fn();
    const handleCopy = vi.fn();

    const activeEscrow = { ...mockEscrow, status: "FUNDED" };

    render(
      <table>
        <tbody>
          <EscrowTableRow
            escrow={activeEscrow}
            onCancelEscrow={handleCancel}
            onCopyLink={handleCopy}
          />
        </tbody>
      </table>
    );

    expect(screen.queryByRole("button", { name: /Cancel/i })).not.toBeInTheDocument();
  });
});
