import type { DisputeFormValues } from "@/lib/validations/dispute";
import React from "react";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

export function DisputeStepReview({ formData, errors, updateField }: Props) {
  return (
    <div className="step step-4" data-testid="step-4">
      <h2>Step 4: Review & Submit</h2>
      <div className="review-section" data-testid="review-section">
        <h3>Personal Information</h3>
        <p>
          <strong>Name:</strong> {formData.name}
        </p>
        <p>
          <strong>Email:</strong> {formData.email}
        </p>
        <p>
          <strong>Order Number:</strong> {formData.orderNumber}
        </p>

        <h3>Dispute Details</h3>
        <p>
          <strong>Reason:</strong> {formData.reason}
        </p>
        <p>
          <strong>Description:</strong> {formData.description}
        </p>

        <h3>Evidence</h3>
        <p>
          <strong>Files:</strong> {formData.files.length} file(s) uploaded
        </p>
        <ul>
          {formData.files.map((file, index) => (
            <li key={index}>{file.name}</li>
          ))}
        </ul>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) => updateField("agreeToTerms", e.target.checked)}
              aria-label="agree to terms"
              aria-invalid={!!errors.agreeToTerms}
              aria-describedby={
                errors.agreeToTerms ? "agreeToTerms-error" : undefined
              }
            />
            I confirm that all information provided is accurate and complete *
          </label>
          {errors.agreeToTerms && (
            <span id="agreeToTerms-error" className="error" role="alert">
              {errors.agreeToTerms as string}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
