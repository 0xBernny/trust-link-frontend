/**
 * Formats a numeric or string value as a standardized USDC currency string (e.g., "1,234.50 USDC").
 * Returns "0.00 USDC" if value is null, undefined, or NaN.
 *
 * @param value - The numerical amount or numeric string to format.
 * @returns Formatted USDC string.
 */
export function formatUSDC(value: number | string | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) return "0.00 USDC";
  
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + " USDC";
}