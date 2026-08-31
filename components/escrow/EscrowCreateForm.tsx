import React, { useMemo } from "react";

interface EscrowCreateFormProps {
  value: string;
}

// Mocking buildQrMatrix utility for demonstration
const buildQrMatrix = (val: string) => {
  // Heavy QR matrix computation simulation
  return val ? Array(21).fill(Array(21).fill(0)) : [];
};

export const EscrowCreateForm: React.FC<EscrowCreateFormProps> = ({ value }) => {
  // Memoize QR code matrix generation to prevent recalculating on every render
  const qrMatrix = useMemo(() => {
    return buildQrMatrix(value);
  }, [value]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="border p-2 bg-white rounded-lg shadow-sm">
        {/* Render QR Matrix using memoized value */}
        <div className="grid grid-cols-21 gap-0.5">
          {qrMatrix.length > 0 ? (
            <p className="text-sm text-gray-600">QR Matrix loaded ({qrMatrix.length}x{qrMatrix.length})</p>
          ) : (
            <p className="text-sm text-gray-400">No value provided</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default EscrowCreateForm;
