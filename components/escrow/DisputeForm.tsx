"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { SubmitDisputeFormResponse } from "@/types/api";
import type { DisputeFormValues } from "@/lib/validations/dispute";
import {
  validateStep1Data,
  validateStep2Data,
  validateStep3Data,
  validateStep4Data,
} from "@/lib/validations/disputeValidators";
import { DisputeStepInfo } from "./DisputeStepInfo";
import { DisputeStepDetails } from "./DisputeStepDetails";
import { DisputeStepEvidence } from "./DisputeStepEvidence";
import { DisputeStepReview } from "./DisputeStepReview";
import "./DisputeForm.css";

interface DisputeFormProps {
  onSubmit?: (data: DisputeFormValues) => Promise<void>;
  apiEndpoint?: string;
  onSuccess?: (response: SubmitDisputeFormResponse) => void;
  onError?: (error: Error) => void;
}

type Step = 1 | 2 | 3 | 4;

const DisputeForm: React.FC<DisputeFormProps> = ({
  onSubmit,
  apiEndpoint = "/api/dispute",
  onSuccess,
  onError,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<DisputeFormValues>({
    name: "",
    email: "",
    orderNumber: "",
    reason: "",
    description: "",
    files: [],
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof DisputeFormValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const firstErrorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const errorKeys = Object.keys(errors).filter(
      (key) => errors[key as keyof DisputeFormValues]
    );
    if (errorKeys.length > 0 && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [errors]);

  const validateStep = useCallback(
    (step: Step): boolean => {
      let newErrors: Partial<Record<keyof DisputeFormValues, string>> = {};
      switch (step) {
        case 1:
          newErrors = validateStep1Data(formData);
          break;
        case 2:
          newErrors = validateStep2Data(formData);
          break;
        case 3:
          newErrors = validateStep3Data(formData);
          break;
        case 4:
          newErrors = validateStep4Data(formData);
          break;
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        const firstErrorKey = Object.keys(newErrors)[0] as keyof DisputeFormValues;
        firstErrorRef.current = document.getElementById(firstErrorKey as string);
        return false;
      }

      return true;
    },
    [formData]
  );

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
      setErrors({});
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      setErrors({});
    }
  }, [currentStep]);

  const updateField = useCallback(
    <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "application/pdf",
      ];
      const maxSize = 10 * 1024 * 1024;

      const rejectedByType = selectedFiles.filter(
        (file) => !allowedTypes.includes(file.type)
      );
      const rejectedBySize = selectedFiles.filter(
        (file) => file.size > maxSize
      );

      if (rejectedByType.length > 0) {
        setErrors((prev) => ({
          ...prev,
          files: "Please upload an image (JPG, PNG, WebP) or PDF.",
        }));
        return;
      }

      if (rejectedBySize.length > 0) {
        setErrors((prev) => ({
          ...prev,
          files: "Each file must be 10 MB or smaller.",
        }));
        return;
      }

      setErrors((prev) => ({ ...prev, files: undefined }));
      updateField("files", [...formData.files, ...selectedFiles]);
    },
    [formData.files, updateField]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = formData.files.filter((_, i) => i !== index);
      updateField("files", newFiles);
    },
    [formData.files, updateField]
  );

  const handleSubmit = useCallback(async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        orderNumber: formData.orderNumber,
        reason: formData.reason,
        description: formData.description,
        files: formData.files.map((file: File) => ({
          name: file.name,
          type: file.type,
          size: file.size,
        })),
        submittedAt: new Date().toISOString(),
      };

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = (await response.json()) as SubmitDisputeFormResponse;

        if (onSuccess) {
          onSuccess(responseData);
        }
      }

      setSubmitStatus("success");
      setSubmitMessage("Your dispute has been submitted successfully!");
    } catch (error: unknown) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Failed to submit dispute"
      );
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, apiEndpoint, onSuccess, onError, validateStep]);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      orderNumber: "",
      reason: "",
      description: "",
      files: [],
      agreeToTerms: false,
    });
    setCurrentStep(1);
    setErrors({});
    setSubmitStatus("idle");
    setSubmitMessage("");
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <DisputeStepInfo
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        );
      case 2:
        return (
          <DisputeStepDetails
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        );
      case 3:
        return (
          <DisputeStepEvidence
            formData={formData}
            errors={errors}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
          />
        );
      case 4:
        return (
          <DisputeStepReview
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        );
      default:
        return null;
    }
  };

  if (submitStatus === "success") {
    return (
      <div
        className="dispute-form success-state"
        data-testid="success-state"
        role="status"
        aria-live="polite"
      >
        <div className="success-message">
          <h2>✓ Dispute Submitted Successfully!</h2>
          <p>{submitMessage}</p>
          <p>
            We will review your dispute and get back to you within 3-5 business
            days.
          </p>
          <button
            type="button"
            onClick={resetForm}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                resetForm();
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

  if (submitStatus === "error") {
    return (
      <div
        className="dispute-form error-state"
        data-testid="error-state"
        role="alert"
        aria-live="assertive"
      >
        <div className="error-message">
          <h2>✗ Submission Failed</h2>
          <p>{submitMessage}</p>
          <button
            type="button"
            onClick={() => setSubmitStatus("idle")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSubmitStatus("idle");
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

  return (
    <div className="dispute-form" data-testid="dispute-form">
      <nav
        className="progress-indicator"
        data-testid="progress-indicator"
        aria-label="Form progress"
      >
        <div
          className={`step-indicator ${currentStep >= 1 ? "active" : ""}`}
          aria-current={currentStep === 1 ? "step" : undefined}
        >
          Step 1: Info
        </div>
        <div
          className={`step-indicator ${currentStep >= 2 ? "active" : ""}`}
          aria-current={currentStep === 2 ? "step" : undefined}
        >
          Step 2: Details
        </div>
        <div
          className={`step-indicator ${currentStep >= 3 ? "active" : ""}`}
          aria-current={currentStep === 3 ? "step" : undefined}
        >
          Step 3: Evidence
        </div>
        <div
          className={`step-indicator ${currentStep >= 4 ? "active" : ""}`}
          aria-current={currentStep === 4 ? "step" : undefined}
        >
          Step 4: Review
        </div>
      </nav>

      <form
        onSubmit={(e) => e.preventDefault()}
        aria-label="Dispute submission form"
        noValidate
      >
        {renderStep()}

        <div className="navigation-buttons">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleBack();
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
              onClick={handleNext}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNext();
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
              onClick={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isSubmitting}
              data-testid="submit-button"
            >
              {isSubmitting ? "Submitting..." : "Submit Dispute"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default DisputeForm;
