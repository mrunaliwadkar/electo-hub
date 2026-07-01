"use client";

import { useState, useMemo } from "react";
import { 
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle, 
  Trash2, Plus, RefreshCw, ShoppingCart, DollarSign, ExternalLink, HelpCircle 
} from "lucide-react";
import { useCurrency } from "@/lib/currency";

// Sample BOM item interface
interface BomItem {
  id: string;
  mpn: string;
  qty: number;
  description: string;
  digikey: { price: number; stock: number; sku: string };
  mouser: { price: number; stock: number; sku: string };
  lcsc: { price: number; stock: number; sku: string };
  selectedDistributor: "digikey" | "mouser" | "lcsc";
}

// Mock data loaded when "Load Sample" is clicked
const SAMPLE_BOM_DATA: BomItem[] = [
  {
    id: "item-1",
    mpn: "ESP32-S3-WROOM-1-N16R8",
    qty: 10,
    description: "Espressif Systems Wi-Fi+BLE MCU Module",
    digikey: { price: 3.45, stock: 1250, sku: "1904-ESP32-S3-WROOM-1-N16R8-ND" },
    mouser: { price: 3.62, stock: 890, sku: "353-ESP32S3WROOM1N16R8" },
    lcsc: { price: 2.95, stock: 4500, sku: "C2913502" },
    selectedDistributor: "digikey", // initially unoptimized
  },
  {
    id: "item-2",
    mpn: "STM32F405RGT6",
    qty: 5,
    description: "STMicroelectronics ARM Cortex-M4 MCU",
    digikey: { price: 9.85, stock: 340, sku: "497-11580-ND" },
    mouser: { price: 9.55, stock: 0, sku: "511-STM32F405RGT6" }, // out of stock
    lcsc: { price: 8.90, stock: 120, sku: "C14620" },
    selectedDistributor: "digikey",
  },
  {
    id: "item-3",
    mpn: "NE555DR",
    qty: 100,
    description: "Texas Instruments Precision Timer SOIC-8",
    digikey: { price: 0.15, stock: 45000, sku: "296-12122-1-ND" },
    mouser: { price: 0.14, stock: 85200, sku: "595-NE555DR" },
    lcsc: { price: 0.08, stock: 220000, sku: "C4674" },
    selectedDistributor: "mouser",
  },
  {
    id: "item-4",
    mpn: "LM317T",
    qty: 25,
    description: "onsemi Adjustable Voltage Regulator TO-220",
    digikey: { price: 0.48, stock: 18900, sku: "LM317T-ND" },
    mouser: { price: 0.52, stock: 12000, sku: "863-LM317TG" },
    lcsc: { price: 0.35, stock: 35000, sku: "C5554" },
    selectedDistributor: "mouser",
  },
  {
    id: "item-5",
    mpn: "CL21A106KOQNNNE",
    qty: 500,
    description: "Samsung 10uF 16V X5R 0805 Ceramic Cap",
    digikey: { price: 0.025, stock: 850000, sku: "1276-1112-1-ND" },
    mouser: { price: 0.024, stock: 1200000, sku: "187-CL21A106KOQNNNE" },
    lcsc: { price: 0.012, stock: 4500000, sku: "C52994" },
    selectedDistributor: "digikey",
  }
];

export default function BomOptimizer() {
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationDone, setOptimizationDone] = useState(false);
  const { format } = useCurrency();

  // Load sample data
  const handleLoadSample = () => {
    setBomItems(JSON.parse(JSON.stringify(SAMPLE_BOM_DATA)));
    setOptimizationDone(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    // Load sample BOM as simulated upload
    handleLoadSample();
  };

  // Change selected distributor manually
  const handleDistributorChange = (itemId: string, dist: "digikey" | "mouser" | "lcsc") => {
    setBomItems(prev => prev.map(item => {
      if (item.id === itemId) {
        // Prevent selecting out of stock
        if (dist === "mouser" && item.mouser.stock === 0) return item;
        return { ...item, selectedDistributor: dist };
      }
      return item;
    }));
  };

  // Delete line item
  const handleDeleteItem = (itemId: string) => {
    setBomItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const handleQtyChange = (itemId: string, val: number) => {
    setBomItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, qty: Math.max(1, val) } : item
    ));
  };

  // Sourcing Optimizer Algorithm (Simulation)
  const runOptimizer = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setBomItems(prev => prev.map(item => {
        const prices = [
          { dist: "digikey", price: item.digikey.price, stock: item.digikey.stock },
          { dist: "mouser", price: item.mouser.price, stock: item.mouser.stock },
          { dist: "lcsc", price: item.lcsc.price, stock: item.lcsc.stock },
        ];

        // Filter out of stock
        const available = prices.filter(p => p.stock > 0);
        if (available.length === 0) return item; // No choice

        // Find minimum price
        const best = available.reduce((min, p) => p.price < min.price ? p : min, available[0]);

        return { ...item, selectedDistributor: best.dist as any };
      }));
      setIsOptimizing(false);
      setOptimizationDone(true);
    }, 1200);
  };

  // Calculate Sourcing Costs Summary
  const summary = useMemo(() => {
    let digikeySubtotal = 0;
    let mouserSubtotal = 0;
    let lcscSubtotal = 0;

    bomItems.forEach(item => {
      const price = item[item.selectedDistributor].price;
      const cost = item.qty * price;
      if (item.selectedDistributor === "digikey") digikeySubtotal += cost;
      if (item.selectedDistributor === "mouser") mouserSubtotal += cost;
      if (item.selectedDistributor === "lcsc") lcscSubtotal += cost;
    });

    // Shipping rules (Simulated)
    // DigiKey: Free shipping over $50, else $6.99
    // Mouser: Free shipping over $50, else $7.99
    // LCSC: Flat $15.00 shipping (from China)
    const digikeyShipping = digikeySubtotal > 0 && digikeySubtotal < 50 ? 6.99 : 0;
    const mouserShipping = mouserSubtotal > 0 && mouserSubtotal < 50 ? 7.99 : 0;
    const lcscShipping = lcscSubtotal > 0 ? 15.00 : 0;

    const totalCost = digikeySubtotal + digikeyShipping + mouserSubtotal + mouserShipping + lcscSubtotal + lcscShipping;

    // Unoptimized cost (simulation if everything was ordered from DigiKey, which is engineers' default)
    let defaultCost = 0;
    bomItems.forEach(item => {
      defaultCost += item.qty * item.digikey.price;
    });
    const defaultShipping = defaultCost > 0 && defaultCost < 50 ? 6.99 : 0;
    const defaultTotal = defaultCost + defaultShipping;

    const savings = Math.max(0, defaultTotal - totalCost);

    return {
      digikey: { subtotal: digikeySubtotal, shipping: digikeyShipping },
      mouser: { subtotal: mouserSubtotal, shipping: mouserShipping },
      lcsc: { subtotal: lcscSubtotal, shipping: lcscShipping },
      total: totalCost,
      savings
    };
  }, [bomItems]);

  return (
    <div className="flex-1 container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 bg-background text-foreground pb-20 md:pb-8">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
          <FileSpreadsheet className="w-3.5 h-3.5 text-primary" /> Procurement Tools
        </div>
        <h1 className="text-2xl md:text-5xl font-bold text-foreground tracking-tight">Cross-Distributor BOM Optimizer</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Upload your bill of materials CSV or KiCad design. Compare stock levels, unit pricing breaks, and shipping rates across **DigiKey**, **Mouser**, and **LCSC** to split your order optimally.
        </p>
      </div>

      {/* Upload Zone & Actions */}
      {bomItems.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px] transition-all cursor-pointer ${
            isDragOver 
              ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
              : "border-border bg-card hover:bg-secondary/20 hover:border-border/80"
          }`}
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground mb-4 group-hover:scale-105 transition-transform">
            <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-bold text-foreground text-sm sm:text-base">Upload your BOM file</h3>
          <p className="text-muted-foreground text-xs mt-1.5 max-w-sm leading-normal">
            Drag and drop your <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono">.csv</code>, <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono">.xlsx</code>, or KiCad export here.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <label className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors shadow-md shadow-primary/15">
              Browse Files
              <input type="file" accept=".csv,.xlsx,.xml" onChange={handleLoadSample} className="hidden" />
            </label>
            <button
              onClick={handleLoadSample}
              className="bg-muted hover:bg-secondary/40 border border-border text-foreground text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
            >
              Load Sample BOM
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-foreground font-bold">
                {bomItems.length} line items loaded
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={runOptimizer}
                disabled={isOptimizing}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/15"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Optimizing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> Run Sourcing Optimizer
                  </>
                )}
              </button>
              <button
                onClick={() => setBomItems([])}
                className="bg-muted border border-border hover:bg-secondary/40 hover:text-red-500 text-foreground text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Desktop Spreadsheet Grid */}
          <div className="hidden md:block bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border pb-2">
                    <th className="pb-3 font-semibold w-12">#</th>
                    <th className="pb-3 font-semibold w-40">MPN</th>
                    <th className="pb-3 font-semibold w-20">Qty</th>
                    <th className="pb-3 font-semibold w-52">Description</th>
                    <th className="pb-3 font-semibold text-center w-28">DigiKey (USD)</th>
                    <th className="pb-3 font-semibold text-center w-28">Mouser (USD)</th>
                    <th className="pb-3 font-semibold text-center w-28">LCSC (USD)</th>
                    <th className="pb-3 font-semibold w-36 text-center">Selected Vendor</th>
                    <th className="pb-3 font-semibold text-right w-24">Total</th>
                    <th className="pb-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bomItems.map((item, index) => {
                    const selectedPrice = item[item.selectedDistributor].price;
                    const totalCost = item.qty * selectedPrice;

                    return (
                      <tr key={item.id} className="hover:bg-secondary/15 transition-colors">
                        <td className="py-4 text-muted-foreground font-mono">{index + 1}</td>
                        <td className="py-4 font-bold text-foreground font-mono">{item.mpn}</td>
                         <td className="py-4">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 bg-background border border-border focus:border-primary/50 rounded px-2 py-1 text-center font-mono text-foreground focus:outline-none"
                          />
                        </td>
                        <td className="py-4 text-muted-foreground text-[11px] max-w-[180px] truncate" title={item.description}>
                          {item.description}
                        </td>
                        
                        {/* DigiKey Price Column */}
                        <td className={`py-4 text-center ${item.selectedDistributor === "digikey" ? "bg-primary/5 border-x border-border/65" : ""}`}>
                          <div className="font-mono text-foreground/90 font-semibold">${item.digikey.price.toFixed(3)}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">Stock: {item.digikey.stock.toLocaleString()}</div>
                        </td>

                        {/* Mouser Price Column */}
                        <td className={`py-4 text-center ${item.selectedDistributor === "mouser" ? "bg-primary/5 border-x border-border/65" : ""}`}>
                          {item.mouser.stock === 0 ? (
                            <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                              OUT OF STOCK
                            </span>
                          ) : (
                            <>
                              <div className="font-mono text-foreground/90 font-semibold">${item.mouser.price.toFixed(3)}</div>
                              <div className="text-[9px] text-muted-foreground mt-0.5">Stock: {item.mouser.stock.toLocaleString()}</div>
                            </>
                          )}
                        </td>

                        {/* LCSC Price Column */}
                        <td className={`py-4 text-center ${item.selectedDistributor === "lcsc" ? "bg-primary/5 border-x border-border/65" : ""}`}>
                          <div className="font-mono text-foreground/90 font-semibold">${item.lcsc.price.toFixed(3)}</div>
                          <div className="text-[9px] text-muted-foreground mt-0.5">Stock: {item.lcsc.stock.toLocaleString()}</div>
                        </td>

                        {/* Selected Vendor Picker */}
                        <td className="py-4 text-center">
                          <select
                            value={item.selectedDistributor}
                            onChange={(e) => handleDistributorChange(item.id, e.target.value as any)}
                            className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none cursor-pointer"
                          >
                            <option value="digikey">DIGIKEY</option>
                            <option value="mouser" disabled={item.mouser.stock === 0}>MOUSER</option>
                            <option value="lcsc">LCSC</option>
                          </select>
                        </td>

                        {/* Total Cost Column */}
                        <td className="py-4 text-right font-mono text-foreground font-bold">
                          ${totalCost.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-center">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-muted-foreground hover:text-red-500 rounded transition-all"
                            title="Delete line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4">
            {bomItems.map((item, index) => {
              const selectedPrice = item[item.selectedDistributor].price;
              const totalCost = item.qty * selectedPrice;

              // Find cheapest in-stock option
              const options = [
                { key: "digikey", ...item.digikey },
                { key: "mouser", ...item.mouser },
                { key: "lcsc", ...item.lcsc }
              ];
              const inStockOptions = options.filter(o => o.stock > 0);
              const cheapestKey = inStockOptions.reduce((best, cur) => cur.price < best.price ? cur : best, inStockOptions[0] || options[0])?.key;

              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">#{index + 1}</span>
                        <span className="font-bold text-sm text-foreground font-mono truncate max-w-[170px]">{item.mpn}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[210px] mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all shrink-0"
                      title="Delete line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-semibold">Quantity:</span>
                    <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg p-1">
                      <button
                        onClick={() => handleQtyChange(item.id, item.qty - 1)}
                        className="w-7 h-7 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center font-bold text-foreground transition-all active:scale-90"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 bg-transparent text-center font-mono text-xs text-foreground focus:outline-none"
                      />
                      <button
                        onClick={() => handleQtyChange(item.id, item.qty + 1)}
                        className="w-7 h-7 rounded-md bg-secondary hover:bg-secondary/80 flex items-center justify-center font-bold text-foreground transition-all active:scale-90"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Distributor comparison rates */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Distributor Rates</span>
                    <div className="grid grid-cols-3 gap-2">
                      {/* DigiKey */}
                      <button
                        onClick={() => handleDistributorChange(item.id, "digikey")}
                        className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-between transition-all ${
                          item.selectedDistributor === "digikey"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-background border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <span className="text-[9px] font-bold">DIGIKEY</span>
                        <span className="font-mono text-xs mt-1 text-foreground">${item.digikey.price.toFixed(3)}</span>
                        <span className="text-[8px] text-muted-foreground/60 mt-0.5 truncate max-w-full">
                          Stock: {item.digikey.stock > 1000 ? `${(item.digikey.stock / 1000).toFixed(0)}k` : item.digikey.stock}
                        </span>
                        {cheapestKey === "digikey" && (
                          <span className="text-[8px] text-teal-650 dark:text-teal-400 font-bold uppercase mt-1">Cheapest</span>
                        )}
                      </button>

                      {/* Mouser */}
                      <button
                        onClick={() => handleDistributorChange(item.id, "mouser")}
                        disabled={item.mouser.stock === 0}
                        className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-between transition-all ${
                          item.mouser.stock === 0
                            ? "opacity-45 bg-muted/30 border-dashed border-border text-muted-foreground/50 cursor-not-allowed"
                            : item.selectedDistributor === "mouser"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-background border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <span className="text-[9px] font-bold">MOUSER</span>
                        {item.mouser.stock === 0 ? (
                           <span className="text-[8px] text-red-500 font-bold mt-2">OUT</span>
                        ) : (
                          <>
                            <span className="font-mono text-xs mt-1 text-foreground">${item.mouser.price.toFixed(3)}</span>
                            <span className="text-[8px] text-muted-foreground/60 mt-0.5 truncate max-w-full">
                              Stock: {item.mouser.stock > 1000 ? `${(item.mouser.stock / 1000).toFixed(0)}k` : item.mouser.stock}
                            </span>
                            {cheapestKey === "mouser" && (
                              <span className="text-[8px] text-teal-655 dark:text-teal-400 font-bold uppercase mt-1">Cheapest</span>
                            )}
                          </>
                        )}
                      </button>

                      {/* LCSC */}
                      <button
                        onClick={() => handleDistributorChange(item.id, "lcsc")}
                        className={`p-2.5 rounded-lg border text-center flex flex-col items-center justify-between transition-all ${
                          item.selectedDistributor === "lcsc"
                            ? "bg-primary/10 border-primary text-primary font-bold"
                            : "bg-background border-border text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <span className="text-[9px] font-bold">LCSC</span>
                        <span className="font-mono text-xs mt-1 text-foreground">${item.lcsc.price.toFixed(3)}</span>
                        <span className="text-[8px] text-muted-foreground/60 mt-0.5 truncate max-w-full">
                          Stock: {item.lcsc.stock > 1000 ? `${(item.lcsc.stock / 1000).toFixed(0)}k` : item.lcsc.stock}
                        </span>
                        {cheapestKey === "lcsc" && (
                          <span className="text-[8px] text-teal-655 dark:text-teal-400 font-bold uppercase mt-1">Cheapest</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subtotal Total */}
                  <div className="flex justify-between items-center pt-2.5 border-t border-border/40 text-xs">
                    <div className="text-muted-foreground font-semibold flex items-center gap-1">
                      <span>Vendor:</span>
                      <span className="text-foreground uppercase font-mono font-bold text-[10px] bg-secondary px-1.5 py-0.5 rounded border border-border">
                        {item.selectedDistributor}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground mr-1.5 font-semibold">Subtotal:</span>
                      <span className="font-mono text-foreground font-bold text-sm">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sourcing Summary Card & Distributor Splits */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Split Progress Bars */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
              <h3 className="text-sm font-bold text-foreground">Consolidated Distributor Split</h3>
              
              <div className="space-y-4.5">
                {/* DigiKey Split */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="font-bold text-foreground/90">DIGIKEY CART</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      Subtotal: {format(summary.digikey.subtotal)} | Shipping: {summary.digikey.shipping === 0 ? "FREE" : format(summary.digikey.shipping)}
                    </span>
                  </div>
                  <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(summary.digikey.subtotal / (summary.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Mouser Split */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="font-bold text-foreground/90">MOUSER CART</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      Subtotal: {format(summary.mouser.subtotal)} | Shipping: {summary.mouser.shipping === 0 ? "FREE" : format(summary.mouser.shipping)}
                    </span>
                  </div>
                  <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(summary.mouser.subtotal / (summary.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* LCSC Split */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="font-bold text-foreground/90">LCSC CART (Shenzhen)</span>
                    <span className="font-mono text-muted-foreground text-[11px]">
                      Subtotal: {format(summary.lcsc.subtotal)} | Shipping: {format(summary.lcsc.shipping)}
                    </span>
                  </div>
                  <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border/50">
                    <div 
                      className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(summary.lcsc.subtotal / (summary.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sourcing Cost Box */}
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <ShoppingCart className="w-4 h-4 text-primary" /> Sourcing Cost Summary
                </h3>

                <div className="divide-y divide-border/60 space-y-2.5 text-xs pt-1">
                  <div className="flex justify-between text-muted-foreground pt-2.5">
                    <span>Parts Subtotal</span>
                    <span className="font-mono text-foreground font-semibold">
                      {format(summary.digikey.subtotal + summary.mouser.subtotal + summary.lcsc.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-2.5">
                    <span>Shipping & Handling</span>
                    <span className="font-mono text-foreground font-semibold">
                      {format(summary.digikey.shipping + summary.mouser.shipping + summary.lcsc.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-foreground pt-2.5 text-sm font-bold">
                    <span>Total Sourcing Cost</span>
                    <span className="font-mono text-primary">{format(summary.total)}</span>
                  </div>
                </div>

                {summary.savings > 0 && (
                  <div className="p-3 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 rounded-xl flex items-start gap-2.5 text-xs leading-normal">
                    <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                    <span>
                      Optimizer saved you <strong className="text-foreground font-mono">{format(summary.savings)}</strong> by splitting carts!
                    </span>
                  </div>
                )}
              </div>

              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/15">
                Export Consolidated Carts <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
