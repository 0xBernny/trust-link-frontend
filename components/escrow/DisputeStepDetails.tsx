import React from "react";

import type { DisputeFormValues } from "@/lib/validations/dispute";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

export function DisputeStepDetails({ formData, errors, updateField }: Props) {
  return (
    <div className="step step-2" data-testid="step-2">
      <h2>Step 2: Dispute Details</h2>
      <div className="form-group">
        <label htmlFor="reason">Reason for Dispute *</label>
        <select
          id="reason"
          value={formData.reason}
          onChange={(e) => updateField("reason", e.target.value)}
          aria-label="reason"
          aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? "reason-error" : undefined}
        >
          <option value="">Select a reason</option>
          <option value="product_not_received">Product not received</option>
          <option value="damaged_product">Damaged product</option>
          <option value="wrong_product">Wrong product received</option>
          <option value="defective_product">Defective product</option>
          <option value="billing_error">Billing error</option>
        </select>
        {errors.reason && (
          <span id="reason-error" className="error" role="alert">
            {errors.reason}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={5}
          placeholder="Please provide detailed information about your dispute (minimum 20 characters)"
          aria-label="description"
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <span id="description-error" className="error" role="alert">
            {errors.description}
          </span>
        )}
        <small>{formData.description.length}/20 characters minimum</small>
      </div>
    </div>
  );
}
