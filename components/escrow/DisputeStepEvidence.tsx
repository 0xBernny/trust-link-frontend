import React from "react";

import { FormField } from "@/components/ui/FormField";
import type { DisputeFormValues } from "@/lib/validations/dispute";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

export function DisputeStepEvidence({ formData, errors, handleFileUpload, removeFile }: Props) {
  return (
    <div className="step step-3" data-testid="step-3">
      <h2>Step 3: Upload Evidence</h2>
      <FormField
        id="files"
        label="Upload Supporting Documents *"
        error={errors.files as string | undefined}
        hint="Accepted formats: JPEG, PNG, WebP, PDF (Max 10MB each)"
        className="form-group"
        labelClassName=""
        errorClassName="error"
      >
        <input
          id="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
          onChange={handleFileUpload}
          aria-label="upload files"
          data-testid="file-input"
        />
      </FormField>

      {formData.files.length > 0 && (
        <div className="file-list" data-testid="file-list">
          <h4>Uploaded Files:</h4>
          <ul>
            {formData.files.map((file, index) => (
              <li key={index} data-testid={`file-${index}`}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      removeFile(index);
                    }
                  }}
                  aria-label={`Delete ${file.name}`}
                  data-testid={`delete-file-${index}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
