"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, SlidersHorizontal, ArrowUpDown, ChevronDown, Check, Info, AlertTriangle, ExternalLink, X } from "lucide-react";
import { useCurrency } from "@/lib/currency";

// Mock data for initial seeding of parametric search
const MOCK_COMPONENTS = [
  {
    id: "esp32-s3",
    mpn: "ESP32-S3-WROOM-1-N16R8",
    manufacturer: "Espressif Systems",
    category: "Microcontrollers",
    packageType: "Module",
    voltage: "3.3V",
    voltageVal: 3.3,
    description: "Wi-Fi + Bluetooth LE MCU module, Xtensa 32-bit LX7 dual-core, 16MB Flash, 8MB PSRAM.",
    stock: 12450,
    price: 3.45,
    distributors: ["DIGIKEY", "MOUSER", "LCSC"],
    lifecycle: "ACTIVE",
  },
  {
    id: "stm32f405",
    mpn: "STM32F405RGT6",
    manufacturer: "STMicroelectronics",
    category: "Microcontrollers",
    packageType: "LQFP-64",
    voltage: "3.3V",
    voltageVal: 3.3,
    description: "High-performance ARM Cortex-M4 MCU with DSP and FPU, 1MB Flash, 168 MHz.",
    stock: 2310,
    price: 9.85,
    distributors: ["DIGIKEY", "MOUSER"],
    lifecycle: "ACTIVE",
  },
  {
    id: "ne555",
    mpn: "NE555DR",
    manufacturer: "Texas Instruments",
    category: "Timers",
    packageType: "SOIC-8",
    voltage: "5V-15V",
    voltageVal: 5.0,
    description: "Precision timer, highly stable controller capable of producing accurate time delays or oscillation.",
    stock: 45200,
    price: 0.15,
    distributors: ["DIGIKEY", "MOUSER", "LCSC"],
    lifecycle: "ACTIVE",
  },
  {
    id: "lm317",
    mpn: "LM317T",
    manufacturer: "onsemi",
    category: "Power Management",
    packageType: "TO-220",
    voltage: "1.2V-37V",
    voltageVal: 1.2,
    description: "Adjustable 3-terminal positive voltage regulator, 1.5A output current capability.",
    stock: 18900,
    price: 0.48,
    distributors: ["DIGIKEY", "LCSC"],
    lifecycle: "ACTIVE",
  },
  {
    id: "tps563200",
    mpn: "TPS563200DDCR",
    manufacturer: "Texas Instruments",
    category: "Power Management",
    packageType: "SOT-23-6",
    voltage: "4.5V-17V",
    voltageVal: 4.5,
    description: "4.5V to 17V Input, 3A Synchronous Step-Down Voltage Regulator in SOT-23.",
    stock: 8900,
    price: 0.72,
    distributors: ["DIGIKEY", "MOUSER", "LCSC"],
    lifecycle: "ACTIVE",
  },
  {
    id: "ads1115",
    mpn: "ADS1115IRUGT",
    manufacturer: "Texas Instruments",
    category: "Sensors",
    packageType: "X2QFN-10",
    voltage: "2.0V-5.5V",
    voltageVal: 3.3,
    description: "Ultra-small, Low-Power, 16-Bit Analog-to-Digital Converter (ADC) with Internal Reference.",
    stock: 4100,
    price: 2.10,
    distributors: ["DIGIKEY", "MOUSER"],
    lifecycle: "ACTIVE",
  },
  {
    id: "mfn-cap-10uf",
    mpn: "CL21A106KOQNNNE",
    manufacturer: "Samsung Electro-Mechanics",
    category: "Passives",
    packageType: "0805",
    voltage: "16V",
    voltageVal: 16,
    description: "CAP CER 10UF 16V X5R 0805. Multi-layer ceramic capacitor.",
    stock: 850000,
    price: 0.02,
    distributors: ["DIGIKEY", "LCSC"],
    lifecycle: "ACTIVE",
  },
  {
    id: "mfn-res-10k",
    mpn: "RC0805FR-0710KL",
    manufacturer: "Yageo",
    category: "Passives",
    packageType: "0805",
    voltage: "150V",
    voltageVal: 150,
    description: "RES SMD 10K OHM 1% 1/8W 0805 thick film chip resistor.",
    stock: 1200000,
    price: 0.01,
    distributors: ["DIGIKEY", "MOUSER", "LCSC"],
    lifecycle: "ACTIVE",
  }
];

function ComponentExplorerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { format } = useCurrency();

  // Get initial query states from URL
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [voltageMin, setVoltageMin] = useState<string>("");
  const [voltageMax, setVoltageMax] = useState<string>("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");

  // Mobile Filter Drawer/Sheet state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Keep search input synced with query param updates
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Extract unique facets from mock data
  const categories = useMemo(() => Array.from(new Set(MOCK_COMPONENTS.map(c => c.category))), []);
  const manufacturers = useMemo(() => Array.from(new Set(MOCK_COMPONENTS.map(c => c.manufacturer))), []);
  const packages = useMemo(() => Array.from(new Set(MOCK_COMPONENTS.map(c => c.packageType))), []);

  // Filter components
  const filteredComponents = useMemo(() => {
    return MOCK_COMPONENTS.filter((comp) => {
      // Search Query Match (MPN or Description or Manufacturer)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchMpn = comp.mpn.toLowerCase().includes(query);
        const matchDesc = comp.description.toLowerCase().includes(query);
        const matchMfr = comp.manufacturer.toLowerCase().includes(query);
        if (!matchMpn && !matchDesc && !matchMfr) return false;
      }

      // Category Match
      if (selectedCategory && comp.category !== selectedCategory) {
        return false;
      }

      // Manufacturer Match
      if (selectedManufacturers.length > 0 && !selectedManufacturers.includes(comp.manufacturer)) {
        return false;
      }

      // Package Type Match
      if (selectedPackages.length > 0 && !selectedPackages.includes(comp.packageType)) {
        return false;
      }

      // Stock Match
      if (onlyInStock && comp.stock <= 0) {
        return false;
      }

      // Voltage Range Match
      if (voltageMin && comp.voltageVal < parseFloat(voltageMin)) {
        return false;
      }
      if (voltageMax && comp.voltageVal > parseFloat(voltageMax)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "stock-desc") return b.stock - a.stock;
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return 0; // Default relevance
    });
  }, [searchQuery, selectedCategory, selectedManufacturers, selectedPackages, onlyInStock, voltageMin, voltageMax, sortBy]);

  const toggleManufacturer = (mfr: string) => {
    setSelectedManufacturers(prev =>
      prev.includes(mfr) ? prev.filter(x => x !== mfr) : [...prev, mfr]
    );
  };

  const togglePackage = (pkg: string) => {
    setSelectedPackages(prev =>
      prev.includes(pkg) ? prev.filter(x => x !== pkg) : [...prev, pkg]
    );
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedManufacturers([]);
    setSelectedPackages([]);
    setVoltageMin("");
    setVoltageMax("");
    setOnlyInStock(false);
    setSearchQuery("");
    router.replace("/search");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    count += selectedManufacturers.length;
    count += selectedPackages.length;
    if (voltageMin) count++;
    if (voltageMax) count++;
    if (onlyInStock) count++;
    return count;
  }, [selectedCategory, selectedManufacturers, selectedPackages, voltageMin, voltageMax, onlyInStock]);

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* Search Bar Header */}
      <div className="bg-card border-b border-border py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search components by MPN, description, manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/40 border border-border focus:border-primary/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Showing {filteredComponents.length} of {MOCK_COMPONENTS.length} results
            </span>
            <div className="flex items-center bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground/80" />
              <span className="mr-1 text-muted-foreground/80">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer font-medium text-foreground"
              >
                <option value="relevance" className="bg-card">Relevance</option>
                <option value="stock-desc" className="bg-card">Stock (High to Low)</option>
                <option value="price-asc" className="bg-card">Price (Low to High)</option>
                <option value="price-desc" className="bg-card">Price (High to Low)</option>
              </select>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" /> Filters
            </h2>
            <span className="text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
              Parametric
            </span>
          </div>

          {/* Category Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("")}
                className={`w-full text-left text-xs py-1.5 px-2.5 rounded-md flex items-center justify-between transition-colors ${
                  !selectedCategory ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <span>All Categories</span>
                {!selectedCategory && <Check className="w-3.5 h-3.5" />}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left text-xs py-1.5 px-2.5 rounded-md flex items-center justify-between transition-colors ${
                    selectedCategory === cat ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Manufacturer Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manufacturer</h3>
            <div className="space-y-2">
              {manufacturers.map((mfr) => (
                <label key={mfr} className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedManufacturers.includes(mfr)}
                    onChange={() => toggleManufacturer(mfr)}
                    className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  />
                  <span>{mfr}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Voltage Range (Parametric) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operating Voltage</h3>
              <span title="Input range in Volts (V)">
                <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={voltageMin}
                onChange={(e) => setVoltageMin(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary/50 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
              />
              <span className="text-muted-foreground/60 text-xs">—</span>
              <input
                type="number"
                placeholder="Max"
                value={voltageMax}
                onChange={(e) => setVoltageMax(e.target.value)}
                className="w-full bg-background border border-border focus:border-primary/50 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Package Filter */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Package / Case</h3>
            <div className="space-y-2">
              {packages.map((pkg) => (
                <label key={pkg} className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(pkg)}
                    onChange={() => togglePackage(pkg)}
                    className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"
                  />
                  <span>{pkg}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Filter */}
          <div className="space-y-2.5 pt-2">
            <label className="flex items-center gap-2.5 text-xs text-foreground hover:text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-0"
              />
              <span className="font-medium">In Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Right Side - Component List Grid */}
        <section className="flex-1">
          {filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl space-y-3">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/60" />
              <h3 className="font-semibold text-foreground text-sm">No components found</h3>
              <p className="text-muted-foreground text-xs max-w-xs text-center">
                Try adjusting your search terms, selecting another category, or resetting the filters.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 text-xs bg-secondary hover:bg-muted text-foreground border border-border px-4 py-1.5 rounded-md transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-card border border-border hover:border-border/80 rounded-xl p-5 flex flex-col justify-between hover:shadow-md dark:hover:shadow-glow-blue transition-all"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                        {comp.category}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        Package: <span className="text-foreground">{comp.packageType}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-foreground text-base hover:text-primary transition-colors">
                        <Link href={`/components/${comp.id}`}>{comp.mpn}</Link>
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{comp.manufacturer}</p>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {comp.description}
                    </p>

                    {/* Specifications badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-medium bg-secondary border border-border px-2 py-0.5 rounded text-muted-foreground">
                        Volts: {comp.voltage}
                      </span>
                      <span className="text-[10px] font-medium bg-secondary border border-border px-2 py-0.5 rounded text-muted-foreground">
                        Stock: {comp.stock.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-medium bg-secondary border border-border px-2 py-0.5 rounded text-muted-foreground">
                        Min Price: ${comp.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                    {/* Distributors logos */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold mr-1">Sourced via:</span>
                      {comp.distributors.map(dist => (
                        <span
                          key={dist}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                        >
                          {dist}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/components/${comp.id}`}
                      className="text-xs bg-secondary hover:bg-muted text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 group"
                    >
                      View Details
                      <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Filter Drawer (Bottom Sheet) */}
      {isFilterSheetOpen && (
        <>
          <div
            onClick={() => setIsFilterSheetOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity lg:hidden"
          />
          <div className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-card border-t border-border rounded-t-2xl z-50 flex flex-col transition-transform duration-300 ease-out translate-y-0 lg:hidden shadow-2xl pb-6">
            {/* Header */}
            <div className="p-4 border-b border-border bg-secondary/35 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground">Filter Components</h3>
                <p className="text-[10px] text-muted-foreground">Select parametric specifications</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsFilterSheetOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-md transition-all border border-border bg-background"
                  aria-label="Close filters"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Filters Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Category */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border/40 pb-1">Category</h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      !selectedCategory
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manufacturer */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border/40 pb-1">Manufacturer</h3>
                <div className="grid grid-cols-2 gap-2">
                  {manufacturers.map((mfr) => {
                    const isChecked = selectedManufacturers.includes(mfr);
                    return (
                      <button
                        key={mfr}
                        onClick={() => toggleManufacturer(mfr)}
                        className={`text-xs py-2 px-3 rounded-lg border text-left font-medium flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-primary/10 border-primary/50 text-primary font-bold"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        <span className="truncate">{mfr}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voltage Range (Parametric) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Operating Voltage</h3>
                  <span title="Input range in Volts (V)">
                    <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min (e.g. 1.2)"
                    value={voltageMin}
                    onChange={(e) => setVoltageMin(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                  <span className="text-muted-foreground/50 text-xs">—</span>
                  <input
                    type="number"
                    placeholder="Max (e.g. 15)"
                    value={voltageMax}
                    onChange={(e) => setVoltageMax(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Package Filter */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b border-border/40 pb-1">Package / Case</h3>
                <div className="grid grid-cols-2 gap-2">
                  {packages.map((pkg) => {
                    const isChecked = selectedPackages.includes(pkg);
                    return (
                      <button
                        key={pkg}
                        onClick={() => togglePackage(pkg)}
                        className={`text-xs py-2 px-3 rounded-lg border text-left font-medium flex items-center justify-between transition-all ${
                          isChecked
                            ? "bg-primary/10 border-primary/50 text-primary font-bold"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        <span className="truncate">{pkg}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Filter */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => setOnlyInStock(!onlyInStock)}
                  className={`w-full py-2.5 px-3 rounded-lg border text-center font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    onlyInStock
                      ? "bg-primary border-primary text-primary-foreground shadow-md"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    readOnly
                    className="w-4 h-4 rounded border-white bg-transparent pointer-events-none"
                  />
                  <span>Show In Stock Only</span>
                </button>
              </div>
            </div>

            {/* Sticky Apply Button */}
            <div className="p-4 border-t border-border bg-card">
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-primary/15"
              >
                Apply Filters ({filteredComponents.length} results)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComponentExplorer() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground text-xs py-20">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-t-transparent border-primary animate-spin" />
          Loading Component Explorer...
        </div>
      </div>
    }>
      <ComponentExplorerContent />
    </Suspense>
  );
}
