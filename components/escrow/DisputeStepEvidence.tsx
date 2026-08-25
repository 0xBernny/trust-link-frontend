import type { DisputeFormValues } from "@/lib/validations/dispute";
import React from "react";

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
      <div className="form-group">
        <label htmlFor="files">Upload Supporting Documents *</label>
        <input
          id="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
          onChange={handleFileUpload}
          aria-label="upload files"
          aria-invalid={!!errors.files}
          aria-describedby={errors.files ? "files-error" : "files-hint"}
          data-testid="file-input"
        />
        <small id="files-hint">
          Accepted formats: JPEG, PNG, WebP, PDF (Max 10MB each)
        </small>
      </div>

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

      {errors.files && (
        <span id="files-error" className="error" role="alert">
          {errors.files as string}
        </span>
      )}
    </div>
  );
}
