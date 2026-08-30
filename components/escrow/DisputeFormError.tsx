import React from "react";

interface Props {
  message: string;
  onRetry: () => void;
}

export function DisputeFormError({ message, onRetry }: Props) {
  return (
    <div
      className="dispute-form error-state"
      data-testid="error-state"
      role="alert"
      aria-live="assertive"
    >
      <div className="error-message">
        <h2>✗ Submission Failed</h2>
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRetry();
            }
          }}
          data-testid="try-again-button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
