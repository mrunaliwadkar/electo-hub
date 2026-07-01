"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CurrencyCode = "USD" | "INR";

export interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  exchangeRate: number; // 1 USD = 83.5 INR
  format: (amountInUSD: number, fractionDigits?: number) => string;
  convert: (amountInUSD: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const USD_TO_INR = 83.5;

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to INR for India localization
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("preferred_currency") as CurrencyCode;
    if (stored) {
      setCurrencyState(stored);
    } else {
      setCurrencyState("INR");
      localStorage.setItem("preferred_currency", "INR");
    }
    setMounted(true);
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem("preferred_currency", code);
  };

  const convert = (amountInUSD: number): number => {
    if (currency === "INR") {
      return amountInUSD * USD_TO_INR;
    }
    return amountInUSD;
  };

  const format = (amountInUSD: number, fractionDigits: number = 2): string => {
    const converted = convert(amountInUSD);
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits >= 2 ? 2 : fractionDigits,
      }).format(converted);
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits >= 2 ? 2 : fractionDigits,
      }).format(converted);
    }
  };

  // Prevent hydration mismatch by rendering children only after mounting
  if (!mounted) {
    // Fallback formatting using default INR before client hydration
    const fallbackFormat = (amountInUSD: number, fractionDigits: number = 2) => {
      const converted = amountInUSD * USD_TO_INR;
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits >= 2 ? 2 : fractionDigits,
      }).format(converted);
    };

    return (
      <CurrencyContext.Provider value={{ currency: "INR", setCurrency: () => {}, exchangeRate: USD_TO_INR, format: fallbackFormat, convert: (val) => val * USD_TO_INR }}>
        <div style={{ visibility: "hidden" }}>{children}</div>
      </CurrencyContext.Provider>
    );
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, exchangeRate: USD_TO_INR, format, convert }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
