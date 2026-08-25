import type { DisputeFormValues } from "@/lib/validations/dispute";
import React from "react";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

export function DisputeStepInfo({ formData, errors, updateField }: Props) {
  return (
    <div className="step step-1" data-testid="step-1">
      <h2>Step 1: Personal Information</h2>
      <div className="form-group">
        <label htmlFor="name">Full Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          aria-label="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <span id="name-error" className="error" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address *</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-label="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <span id="email-error" className="error" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="orderNumber">Order Number *</label>
        <input
          id="orderNumber"
          type="text"
          value={formData.orderNumber}
          onChange={(e) => updateField("orderNumber", e.target.value)}
          aria-label="order number"
          aria-invalid={!!errors.orderNumber}
          aria-describedby={errors.orderNumber ? "orderNumber-error" : undefined}
        />
        {errors.orderNumber && (
          <span id="orderNumber-error" className="error" role="alert">
            {errors.orderNumber}
          </span>
        )}
      </div>
    </div>
  );
}
