"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Cpu, Zap, Activity, Layers, Database, ArrowRight, ShieldCheck, Clock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const categories = [
    { name: "Microcontrollers", icon: Cpu, count: "12,403 parts", path: "/search?category=Microcontrollers" },
    { name: "Power Regulators", icon: Zap, count: "8,912 parts", path: "/search?category=Power%20Management" },
    { name: "Operational Amplifiers", icon: Activity, count: "5,120 parts", path: "/search?category=Amplifiers" },
    { name: "Sensors", icon: Layers, count: "6,743 parts", path: "/search?category=Sensors" },
  ];

  const featuredParts = [
    {
      id: "esp32-s3",
      mpn: "ESP32-S3-WROOM-1-N16R8",
      manufacturer: "Espressif Systems",
      description: "Powerful Wi-Fi + Bluetooth LE MCU module with Xtensa 32-bit LX7 dual-core processor, 16MB Flash, and 8MB PSRAM.",
      category: "Microcontrollers",
      status: "ACTIVE",
    },
    {
      id: "stm32f405",
      mpn: "STM32F405RGT6",
      manufacturer: "STMicroelectronics",
      description: "High-performance ARM Cortex-M4 MCU with DSP and FPU, 1MB Flash, 168 MHz, LQFP-64 package.",
      category: "Microcontrollers",
      status: "ACTIVE",
    },
    {
      id: "ne555",
      mpn: "NE555DR",
      manufacturer: "Texas Instruments",
      description: "Precision timer capable of generating accurate time delays or oscillation. SOIC-8 package.",
      category: "Timers",
      status: "ACTIVE",
    },
    {
      id: "lm317",
      mpn: "LM317T",
      manufacturer: "onsemi",
      description: "Adjustable 3-terminal positive voltage regulator capable of supplying in excess of 1.5 A over an output voltage range of 1.2 V to 37 V.",
      category: "Power Management",
      status: "ACTIVE",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      {/* Hero Section */}
      <section className="w-full relative py-20 md:py-32 flex flex-col items-center text-center px-4 overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-600/15 via-cyan-500/10 to-purple-600/15 rounded-full blur-[100px] -z-10 animate-pulse-glow" />

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            AI-Powered Datasheet Ingestion Engine v1.2
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gradient">
            Electronics Intelligence <br />
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-450 dark:to-teal-400 bg-clip-text text-transparent">
              Without the Friction.
            </span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Instantly parse datasheets, visualize pinouts, compare alternatives, and optimize your BOMs with AI-structured hardware data.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mt-10 relative group">
            <div className="relative flex items-center bg-card/85 border border-border focus-within:border-primary/50 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl transition-all">
              <div className="pl-4 text-muted-foreground">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search by MPN (e.g. ESP32-S3, NE555) or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent px-3 py-4 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none"
              />
              <div className="pr-3 flex items-center gap-2">
                <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground/60 bg-secondary px-2 py-1 rounded border border-border font-mono">
                  ⌘K
                </kbd>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
                >
                  Search <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-3xl mx-auto mt-16 pt-8 border-t border-border">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">50,000+</div>
              <div className="text-muted-foreground text-xs mt-1">Components Indexed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">&lt; 50ms</div>
              <div className="text-muted-foreground text-xs mt-1">Search Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">99.8%</div>
              <div className="text-muted-foreground text-xs mt-1">Extraction Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">1.2M+</div>
              <div className="text-muted-foreground text-xs mt-1">Data Points Mapped</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="w-full max-w-7xl mx-auto px-4 py-16 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Browse by Category</h2>
            <p className="text-muted-foreground text-sm mt-1">Find components structured with normalized attributes and verified pinouts.</p>
          </div>
          <Link href="/search" className="text-primary hover:underline text-sm flex items-center gap-1 transition-colors">
            View all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                href={cat.path}
                className="group p-5 bg-card border border-border hover:border-border/80 rounded-xl flex flex-col justify-between h-36 hover:bg-secondary/40 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{cat.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Components */}
      <section className="w-full max-w-7xl mx-auto px-4 py-16 border-t border-border">
        <div className="mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Featured Components</h2>
          <p className="text-muted-foreground text-sm mt-1">Explore pre-loaded components featuring interactive pinout canvas and structured specifications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredParts.map((part) => (
            <div
              key={part.id}
              className="group p-5 bg-card border border-border hover:border-border/80 rounded-xl flex flex-col justify-between h-[250px] hover:shadow-md dark:hover:shadow-glow-blue transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                    {part.category}
                  </span>
                  <span className="text-[10px] font-bold text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {part.status}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors line-clamp-1">
                  {part.mpn}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{part.manufacturer}</p>
                <p className="text-xs text-muted-foreground/90 line-clamp-3 leading-relaxed">
                  {part.description}
                </p>
              </div>
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Verified Pinout</span>
                <Link
                  href={`/components/${part.id}`}
                  className="text-xs text-primary group-hover:text-primary/90 font-semibold flex items-center gap-1 transition-all"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="w-full bg-card/30 border-t border-border py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Built for Modern Hardware Engineering</h2>
            <p className="text-muted-foreground text-sm">
              We bridge the gap between manufacturer datasheets, inventory distributors, and CAD libraries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-card border border-border rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Unit-Normalized Search</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                No more split categories. Searching for <code className="text-xs text-primary bg-secondary px-1 py-0.5 rounded">10nF</code> matches <code className="text-xs text-primary bg-secondary px-1 py-0.5 rounded">0.01uF</code> instantly. Filter voltage ranges and tolerances with precision.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Interactive Pinout Canvas</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Color-coded functional groups (Power, Ground, I/O, Communication) with hover tooltips. Instantly understand the physical and logical layout of any chip.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-650 dark:text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">BOM Cost Optimization</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Upload your CSV. Our engine checks stock levels, compares unit prices across DigiKey, Mouser, and LCSC, and splits the order to achieve the lowest total cost.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
