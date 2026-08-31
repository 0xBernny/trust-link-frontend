import React from "react";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { label: "Step 1: Info", step: 1 as Step },
  { label: "Step 2: Details", step: 2 as Step },
  { label: "Step 3: Evidence", step: 3 as Step },
  { label: "Step 4: Review", step: 4 as Step },
];

interface Props {
  currentStep: Step;
}

export function DisputeFormProgress({ currentStep }: Props) {
  return (
    <nav
      className="progress-indicator"
      data-testid="progress-indicator"
      aria-label="Form progress"
    >
      {STEPS.map(({ label, step }) => (
        <div
          key={step}
          className={`step-indicator ${currentStep >= step ? "active" : ""}`}
          aria-current={currentStep === step ? "step" : undefined}
        >
          {label}
        </div>
      ))}
    </nav>
  );
}
