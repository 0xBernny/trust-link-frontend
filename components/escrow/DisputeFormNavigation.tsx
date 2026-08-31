import React from "react";

type Step = 1 | 2 | 3 | 4;

interface Props {
  currentStep: Step;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function DisputeFormNavigation({
  currentStep,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}: Props) {
  return (
    <div className="navigation-buttons">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onBack}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onBack();
            }
          }}
          disabled={isSubmitting}
          data-testid="back-button"
        >
          Back
        </button>
      )}

      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNext}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onNext();
            }
          }}
          disabled={isSubmitting}
          data-testid="next-button"
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={isSubmitting}
          data-testid="submit-button"
        >
          {isSubmitting ? "Submitting..." : "Submit Dispute"}
        </button>
      )}
    </div>
  );
}
