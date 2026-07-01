"use client";

import { useCurrency } from "@/lib/currency";
import { Globe } from "lucide-react";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
      <Globe className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as any)}
        className="bg-transparent focus:outline-none cursor-pointer font-medium text-white"
      >
        <option value="INR" className="bg-zinc-950">₹ INR</option>
        <option value="USD" className="bg-zinc-950">$ USD</option>
      </select>
    </div>
  );
}
