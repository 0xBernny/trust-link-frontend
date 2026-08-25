import "@testing-library/jest-dom";
import "@/lib/i18n";
import { vi } from "vitest";

vi.mock("@/components/providers/CurrencyProvider", () => ({
  useCurrency: () => ({
    currency: "USDC",
    setCurrency: vi.fn(),
    formatAmount: (amount: number | string) => {
      const num = typeof amount === "string" ? parseFloat(amount) : amount;
      return `USDC ${num.toFixed(2)}`;
    },
  }),
  CurrencyProvider: ({ children }: { children: React.ReactNode }) => children,
}));
