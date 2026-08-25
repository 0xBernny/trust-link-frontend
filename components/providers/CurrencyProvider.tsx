"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CurrencyCode = "USDC" | "USD" | "EUR" | "NGN" | "GBP";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatAmount: (amountUsdc: number | string) => string;
}

const mockRates: Record<CurrencyCode, number> = {
  USDC: 1,
  USD: 1,
  EUR: 0.92,
  NGN: 1500,
  GBP: 0.78,
};

const currencySymbols: Record<CurrencyCode, string> = {
  USDC: "USDC ",
  USD: "$",
  EUR: "€",
  NGN: "₦",
  GBP: "£",
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USDC");

  useEffect(() => {
    const saved = localStorage.getItem("preferredCurrency") as CurrencyCode;
    if (saved && mockRates[saved]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("preferredCurrency", newCurrency);
  };

  const formatAmount = (amountUsdc: number | string) => {
    const num =
      typeof amountUsdc === "string" ? parseFloat(amountUsdc) : amountUsdc;
    if (isNaN(num)) return `${currencySymbols[currency]}0.00`;

    const converted = num * mockRates[currency];

    // Format with commas and 2 decimal places
    const formattedNum = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);

    return `${currencySymbols[currency]}${formattedNum}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
