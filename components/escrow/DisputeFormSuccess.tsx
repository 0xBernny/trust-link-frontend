import React from "react";

interface Props {
  message: string;
  onReset: () => void;
}

export function DisputeFormSuccess({ message, onReset }: Props) {
  return (
    <div
      className="dispute-form success-state"
      data-testid="success-state"
      role="status"
      aria-live="polite"
    >
      <div className="success-message">
        <h2>✓ Dispute Submitted Successfully!</h2>
        <p>{message}</p>
        <p>
          We will review your dispute and get back to you within 3-5 business
          days.
        </p>
        <button
          type="button"
          onClick={onReset}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onReset();
            }
          }}
          data-testid="new-dispute-button"
        >
          Submit Another Dispute
        </button>
      </div>
    </div>
  );
}
