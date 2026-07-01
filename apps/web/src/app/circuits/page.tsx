"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, Layers, Cpu, Zap, Activity, Info, 
  ChevronDown, ChevronUp, Check, Play, FileText, ArrowRight 
} from "lucide-react";

// Mock data for the Circuit Library
const CIRCUITS_DATA = [
  {
    id: "buck-regulator",
    title: "5V to 3.3V Step-Down Buck Regulator",
    category: "Power Regulation",
    difficulty: "EASY",
    difficultyColor: "text-green-600 dark:text-green-450 bg-green-500/10 dark:bg-green-950/30 border-green-500/20 dark:border-green-900/30",
    coreIc: "TPS563200",
    coreIcId: "tps563200",
    description: "A high-efficiency synchronous step-down (buck) converter circuit designed to convert a 5V or 12V input rail into a stable 3.3V system supply, supporting up to 3A output.",
    explanation: "This buck regulator works by rapidly switching the input voltage across an inductor (L1) using internal MOSFETs. The duty cycle of the switching determines the output voltage. The capacitor (C2) filters the output ripple, while the feedback network (R1/R2) monitors the output voltage and adjusts the switching duty cycle to maintain exactly 3.3V.",
    components: [
      { designator: "U1", mpn: "TPS563200DDCR", quantity: 1, role: "Synchronous Buck Regulator IC", id: "tps563200" },
      { designator: "L1", mpn: "VLCF5020T-100MR87", quantity: 1, role: "10µH Power Inductor (3A)", id: "mfn-inductor" },
      { designator: "C1", mpn: "CL21A106KOQNNNE", quantity: 1, role: "10µF Ceramic Cap, 16V (Input Decoupling)", id: "mfn-cap-10uf" },
      { designator: "C2", mpn: "CL31A226KOCLNNC", quantity: 2, role: "22µF Ceramic Cap, 6.3V (Output Filter)", id: "mfn-cap-22uf" },
      { designator: "R1", mpn: "RC0805FR-0756KL", quantity: 1, role: "56kΩ Resistor 1% (Feedback Top)", id: "mfn-res" },
      { designator: "R2", mpn: "RC0805FR-0710KL", quantity: 1, role: "10kΩ Resistor 1% (Feedback Bottom)", id: "mfn-res-10k" },
    ],
    // Render SVG schematic
    schematicSvg: (
      <svg viewBox="0 0 400 200" className="w-full h-48 bg-zinc-950 rounded-lg border border-zinc-800 p-2 text-white">
        {/* Input Voltage */}
        <text x="30" y="50" fill="#a1a1aa" fontSize="10" fontFamily="monospace">VIN (5-12V)</text>
        <line x1="30" y1="60" x2="80" y2="60" stroke="#3f3f46" strokeWidth="2" />
        
        {/* Input Cap C1 */}
        <line x1="60" y1="60" x2="60" y2="90" stroke="#3f3f46" strokeWidth="2" />
        {/* Capacitor symbol */}
        <line x1="50" y1="90" x2="70" y2="90" stroke="#60a5fa" strokeWidth="2" />
        <line x1="50" y1="96" x2="70" y2="96" stroke="#60a5fa" strokeWidth="2" />
        <line x1="60" y1="96" x2="60" y2="130" stroke="#3f3f46" strokeWidth="2" />
        <text x="75" y="98" fill="#a1a1aa" fontSize="9" fontFamily="monospace">C1 10µF</text>
        
        {/* Regulator IC U1 */}
        <rect x="120" y="40" width="100" height="80" rx="4" fill="#09090b" stroke="#3b82f6" strokeWidth="2" />
        <text x="170" y="85" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">TPS563200</text>
        <text x="125" y="60" fill="#a1a1aa" fontSize="8" fontFamily="monospace">1 VIN</text>
        <text x="200" y="60" fill="#a1a1aa" fontSize="8" fontFamily="monospace">2 SW</text>
        <text x="125" y="100" fill="#a1a1aa" fontSize="8" fontFamily="monospace">3 GND</text>
        <text x="200" y="100" fill="#a1a1aa" fontSize="8" fontFamily="monospace">4 FB</text>

        {/* SW output connection to Inductor */}
        <line x1="220" y1="60" x2="260" y2="60" stroke="#3f3f46" strokeWidth="2" />
        
        {/* Inductor L1 symbol */}
        <path d="M 260 60 C 265 50, 270 50, 275 60 C 280 50, 285 50, 290 60 C 295 50, 300 50, 305 60" fill="none" stroke="#fbbf24" strokeWidth="2" />
        <text x="275" y="45" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontFamily="monospace">L1 10µH</text>
        <line x1="305" y1="60" x2="350" y2="60" stroke="#3f3f46" strokeWidth="2" />

        {/* Output Cap C2 */}
        <line x1="330" y1="60" x2="330" y2="90" stroke="#3f3f46" strokeWidth="2" />
        <line x1="320" y1="90" x2="340" y2="90" stroke="#60a5fa" strokeWidth="2" />
        <line x1="320" y1="96" x2="340" y2="96" stroke="#60a5fa" strokeWidth="2" />
        <line x1="330" y1="96" x2="330" y2="130" stroke="#3f3f46" strokeWidth="2" />
        <text x="345" y="98" fill="#a1a1aa" fontSize="9" fontFamily="monospace">C2 22µF</text>

        {/* Feedback loop connection */}
        <line x1="350" y1="60" x2="350" y2="130" stroke="#3f3f46" strokeWidth="2" />
        {/* R1 top feedback resistor */}
        <rect x="255" y="95" width="30" height="15" fill="#09090b" stroke="#a1a1aa" strokeWidth="1.5" />
        <text x="270" y="106" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">R1 56k</text>
        
        {/* Ground rail */}
        <line x1="30" y1="130" x2="370" y2="130" stroke="#3f3f46" strokeWidth="2" />
        {/* GND symbol */}
        <line x1="200" y1="130" x2="200" y2="140" stroke="#3f3f46" strokeWidth="2" />
        <line x1="190" y1="140" x2="210" y2="140" stroke="#3f3f46" strokeWidth="2" />
        <line x1="195" y1="145" x2="205" y2="145" stroke="#3f3f46" strokeWidth="2" />

        <text x="350" y="50" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold" fontFamily="monospace">VOUT (3.3V)</text>
      </svg>
    )
  },
  {
    id: "esp32s3-boot",
    title: "ESP32-S3 Minimum System Boot Circuit",
    category: "Microcontrollers",
    difficulty: "MEDIUM",
    difficultyColor: "text-amber-600 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-955/30 border-amber-500/20 dark:border-amber-900/30",
    coreIc: "ESP32-S3-WROOM-1",
    coreIcId: "esp32-s3",
    description: "The essential support circuitry required to boot and run an ESP32-S3 module, featuring power decoupling, an auto-reset circuit for programming, and boot selection buttons.",
    explanation: "This circuit powers the ESP32-S3 at 3.3V. The EN (Reset) pin is pulled up to 3.3V via R1 and has C3 to provide a delay during power-up (RC delay). Button S1 pulls EN low to reset the chip. Button S2 pulls IO0 low during boot to force the ESP32-S3 into serial programming mode. Diodes D1/D2 and transistors Q1/Q2 form the auto-program circuit controlled by a USB-UART bridge.",
    components: [
      { designator: "U1", mpn: "ESP32-S3-WROOM-1-N16R8", quantity: 1, role: "Wi-Fi/BLE MCU Module", id: "esp32-s3" },
      { designator: "R1", mpn: "RC0805FR-0710KL", quantity: 1, role: "10kΩ Resistor (EN Pull-Up)", id: "mfn-res-10k" },
      { designator: "R2", mpn: "RC0805FR-0710KL", quantity: 1, role: "10kΩ Resistor (IO0 Pull-Up)", id: "mfn-res-10k" },
      { designator: "C3", mpn: "CL21A105KOFNNNE", quantity: 1, role: "1µF Ceramic Cap (EN Debounce)", id: "mfn-cap-1uf" },
      { designator: "C4", mpn: "CL21A106KOQNNNE", quantity: 2, role: "10µF Ceramic Cap (Power Decoupling)", id: "mfn-cap-10uf" },
      { designator: "S1", mpn: "PTS645SL43SMTR92LFS", quantity: 1, role: "Tactile Switch (Reset Button)", id: "mfn-switch" },
      { designator: "S2", mpn: "PTS645SL43SMTR92LFS", quantity: 1, role: "Tactile Switch (Boot Button)", id: "mfn-switch" },
    ],
    schematicSvg: (
      <svg viewBox="0 0 400 200" className="w-full h-48 bg-zinc-950 rounded-lg border border-zinc-800 p-2 text-white">
        {/* Power Rail */}
        <text x="30" y="30" fill="#ef4444" fontSize="10" fontFamily="monospace">3.3V</text>
        <line x1="30" y1="40" x2="160" y2="40" stroke="#ef4444" strokeWidth="1.5" />

        {/* Pull up Resistors */}
        {/* R1 */}
        <line x1="60" y1="40" x2="60" y2="60" stroke="#3f3f46" strokeWidth="1.5" />
        <rect x="50" y="60" width="20" height="25" fill="#09090b" stroke="#a1a1aa" strokeWidth="1.5" />
        <text x="60" y="75" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">R1 10k</text>
        <line x1="60" y1="85" x2="60" y2="110" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="70" y="115" fill="#60a5fa" fontSize="9" fontFamily="monospace">EN</text>

        {/* R2 */}
        <line x1="120" y1="40" x2="120" y2="60" stroke="#3f3f46" strokeWidth="1.5" />
        <rect x="110" y="60" width="20" height="25" fill="#09090b" stroke="#a1a1aa" strokeWidth="1.5" />
        <text x="120" y="75" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">R2 10k</text>
        <line x1="120" y1="85" x2="120" y2="110" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="130" y="115" fill="#60a5fa" fontSize="9" fontFamily="monospace">IO0</text>

        {/* ESP32 Module */}
        <rect x="200" y="30" width="150" height="130" rx="4" fill="#09090b" stroke="#3b82f6" strokeWidth="2" />
        <text x="275" y="85" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">ESP32-S3</text>
        <text x="275" y="105" textAnchor="middle" fill="#a1a1aa" fontSize="8" fontFamily="monospace">WROOM-1 Module</text>

        {/* EN Input to module */}
        <line x1="60" y1="110" x2="200" y2="110" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="205" y="113" fill="#a1a1aa" fontSize="8" fontFamily="monospace">3 EN</text>

        {/* IO0 Input to module */}
        <line x1="120" y1="140" x2="200" y2="140" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="120" y1="85" x2="120" y2="140" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="205" y="143" fill="#a1a1aa" fontSize="8" fontFamily="monospace">27 IO0</text>

        {/* Decoupling Caps */}
        <line x1="160" y1="40" x2="160" y2="75" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="150" y1="75" x2="170" y2="75" stroke="#60a5fa" strokeWidth="2" />
        <line x1="150" y1="81" x2="170" y2="81" stroke="#60a5fa" strokeWidth="2" />
        <line x1="160" y1="81" x2="160" y2="160" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="175" y="83" fill="#a1a1aa" fontSize="8" fontFamily="monospace">C4 10µF</text>

        {/* Ground connection */}
        <line x1="30" y1="160" x2="370" y2="160" stroke="#3f3f46" strokeWidth="2" />
        <line x1="275" y1="160" x2="275" y2="170" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="265" y1="170" x2="285" y2="170" stroke="#3f3f46" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: "hbridge-motor",
    title: "H-Bridge DC Motor Driver",
    category: "Motor Control",
    difficulty: "MEDIUM",
    difficultyColor: "text-amber-600 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-955/30 border-amber-500/20 dark:border-amber-900/30",
    coreIc: "DRV8833",
    coreIcId: "drv8833",
    description: "A dual H-bridge motor driver circuit capable of controlling two DC motors or one bipolar stepper motor. Includes current limiting, thermal shutdown, and flyback diode protection.",
    explanation: "The DRV8833 consists of H-bridges, which are arrangements of 4 transistors (MOSFETs) that allow voltage to be applied across a load in either direction. By toggling IN1 and IN2 high or low, you can turn the motor clockwise, counterclockwise, brake, or let it coast. The current-limiting resistors (R1/R2) set the maximum current threshold for the motors.",
    components: [
      { designator: "U1", mpn: "DRV8833RTYR", quantity: 1, role: "Dual H-Bridge Motor Driver IC", id: "drv8833" },
      { designator: "C1", mpn: "CL21A106KOQNNNE", quantity: 1, role: "10µF Ceramic Cap (VCP Charge Pump)", id: "mfn-cap-10uf" },
      { designator: "C2", mpn: "CL31A226KOCLNNC", quantity: 2, role: "22µF Ceramic Cap, 16V (VM Bulk Decoupling)", id: "mfn-cap-22uf" },
      { designator: "R1", mpn: "RC0805FR-07R10L", quantity: 2, role: "0.1Ω Current Sense Resistors (1W)", id: "mfn-res-sense" },
    ],
    schematicSvg: (
      <svg viewBox="0 0 400 200" className="w-full h-48 bg-zinc-950 rounded-lg border border-zinc-800 p-2 text-white">
        <text x="30" y="30" fill="#ef4444" fontSize="10" fontFamily="monospace">VM (5-10V Motor Power)</text>
        <line x1="30" y1="40" x2="130" y2="40" stroke="#ef4444" strokeWidth="1.5" />
        
        {/* Bulk cap */}
        <line x1="60" y1="40" x2="60" y2="70" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="50" y1="70" x2="70" y2="70" stroke="#60a5fa" strokeWidth="2" />
        <line x1="50" y1="76" x2="70" y2="76" stroke="#60a5fa" strokeWidth="2" />
        <line x1="60" y1="76" x2="60" y2="130" stroke="#3f3f46" strokeWidth="1.5" />

        {/* DRV8833 IC */}
        <rect x="130" y="30" width="130" height="110" rx="4" fill="#09090b" stroke="#3b82f6" strokeWidth="2" />
        <text x="195" y="80" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">DRV8833</text>

        {/* VM Input pin */}
        <line x1="130" y1="45" x2="100" y2="45" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="100" y1="45" x2="100" y2="40" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="135" y="50" fill="#a1a1aa" fontSize="7" fontFamily="monospace">VM</text>

        {/* Inputs */}
        <line x1="50" y1="90" x2="130" y2="90" stroke="#a855f7" strokeWidth="1.5" />
        <text x="45" y="85" fill="#a855f7" fontSize="8" fontFamily="monospace">IN1 (PWM)</text>
        <line x1="50" y1="115" x2="130" y2="115" stroke="#a855f7" strokeWidth="1.5" />
        <text x="45" y="110" fill="#a855f7" fontSize="8" fontFamily="monospace">IN2 (PWM)</text>

        {/* Outputs */}
        <line x1="260" y1="60" x2="310" y2="60" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="255" y="65" textAnchor="end" fill="#a1a1aa" fontSize="7" fontFamily="monospace">OUT1</text>
        
        <line x1="260" y1="100" x2="310" y2="100" stroke="#3f3f46" strokeWidth="1.5" />
        <text x="255" y="105" textAnchor="end" fill="#a1a1aa" fontSize="7" fontFamily="monospace">OUT2</text>

        {/* Motor Symbol */}
        <circle cx="330" cy="80" r="18" fill="#09090b" stroke="#fbbf24" strokeWidth="2" />
        <text x="330" y="84" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">M</text>
        <line x1="310" y1="60" x2="315" y2="70" stroke="#3f3f46" strokeWidth="1.5" />
        <line x1="310" y1="100" x2="315" y2="90" stroke="#3f3f46" strokeWidth="1.5" />

        {/* Ground */}
        <line x1="30" y1="130" x2="370" y2="130" stroke="#3f3f46" strokeWidth="2" />
      </svg>
    )
  }
];

export default function CircuitLibrary() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedCircuit, setExpandedCircuit] = useState<string | null>("buck-regulator");

  const categories = ["All", "Power Regulation", "Microcontrollers", "Motor Control"];

  const filteredCircuits = selectedCategory === "All"
    ? CIRCUITS_DATA
    : CIRCUITS_DATA.filter(c => c.category === selectedCategory);

  return (
    <div className="flex-1 container mx-auto px-4 py-6 md:py-8 bg-background text-foreground pb-20 md:pb-8">
      {/* Header */}
      <div className="max-w-3xl space-y-3 mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Circuit Intelligence
        </div>
        <h1 className="text-2xl md:text-5xl font-bold text-foreground tracking-tight">Verified Sub-Circuits</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Accelerate your hardware prototyping. Browse verified electrical schematics, explanations, and dynamic bills of materials integrated with our sourcing pipeline.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-4 mb-6 sm:mb-8 border-b border-border">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-all shrink-0 ${
              selectedCategory === cat
                ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80 shadow-sm"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Circuit Cards List */}
      <div className="space-y-6">
        {filteredCircuits.map((circuit) => {
          const isExpanded = expandedCircuit === circuit.id;
          return (
            <div
              key={circuit.id}
              className={`bg-card border rounded-xl overflow-hidden transition-all shadow-sm ${
                isExpanded ? "border-blue-500/40 shadow-md shadow-blue-500/5" : "border-border hover:border-border/80"
              }`}
            >
              {/* Header Accordion */}
              <div
                onClick={() => setExpandedCircuit(isExpanded ? null : circuit.id)}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-secondary/15 transition-colors"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-md">
                      {circuit.category}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${circuit.difficultyColor}`}>
                      {circuit.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Core IC: <span className="text-foreground font-mono">{circuit.coreIc}</span>
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {circuit.title}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {circuit.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                    {circuit.components.length} components
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Schematic & BOM Details */}
              {isExpanded && (
                <div className="border-t border-border p-5 sm:p-6 bg-secondary/10 space-y-6 md:space-y-8 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Schematic Box */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Circuit Schematic (Electrical Layout)
                      </h3>
                      <div className="overflow-hidden rounded-xl border border-border shadow-sm bg-zinc-950 dark:bg-black">
                        {circuit.schematicSvg}
                      </div>
                      <div className="flex items-start gap-2 text-[11px] text-muted-foreground leading-normal">
                        <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Interactive symbols are color-coded: Power is Red, Filters are Blue, Actuators are Yellow.</span>
                      </div>
                    </div>

                    {/* Functional Explanation */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        How It Works
                      </h3>
                      <p className="text-xs text-foreground/90 leading-relaxed bg-background border border-border p-4 rounded-xl shadow-sm">
                        {circuit.explanation}
                      </p>
                      <div className="p-4 rounded-xl bg-primary/5 text-primary border border-primary/10 text-xs leading-relaxed flex items-start gap-2.5">
                        <Cpu className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <span className="font-bold text-foreground block mb-0.5">Design Guideline:</span>
                          Always place decoupling capacitors as close to the power pins of the IC as physically possible on your PCB layout to minimize trace inductance and noise.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bill of Materials (BOM) */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Reference Bill of Materials (BOM)
                    </h3>
                    
                    {/* Desktop Reference BOM Table */}
                    <div className="hidden md:block overflow-x-auto bg-background border border-border rounded-xl shadow-sm">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-secondary/40 text-muted-foreground border-b border-border">
                            <th className="p-3 font-semibold w-16">RefDes</th>
                            <th className="p-3 font-semibold">Manufacturer Part Number (MPN)</th>
                            <th className="p-3 font-semibold w-16 text-center">Qty</th>
                            <th className="p-3 font-semibold">Functional Description</th>
                            <th className="p-3 font-semibold w-24 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {circuit.components.map((c, idx) => (
                            <tr key={idx} className="hover:bg-secondary/15 transition-colors">
                              <td className="p-3 font-mono font-bold text-primary">{c.designator}</td>
                              <td className="p-3 font-mono text-foreground font-semibold">{c.mpn}</td>
                              <td className="p-3 text-center text-foreground">{c.quantity}</td>
                              <td className="p-3 text-muted-foreground leading-relaxed">{c.role}</td>
                              <td className="p-3 text-right">
                                {c.id ? (
                                  <Link
                                    href={`/components/${c.id}`}
                                    className="text-[11px] text-primary hover:text-primary/90 font-bold flex items-center justify-end gap-0.5"
                                  >
                                    View <ArrowRight className="w-3 h-3" />
                                  </Link>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/60">Standard</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Reference BOM (Stack Cards) */}
                    <div className="md:hidden space-y-3">
                      {circuit.components.map((c: any, idx: number) => (
                        <div key={idx} className="bg-background border border-border rounded-xl p-3.5 space-y-2 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-550/15">{c.designator}</span>
                              <span className="font-mono text-xs font-bold text-foreground">{c.mpn}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-semibold">Qty: {c.quantity}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-normal">{c.role}</p>
                          <div className="pt-2 border-t border-border/55 flex justify-end">
                            {c.id ? (
                              <Link
                                href={`/components/${c.id}`}
                                className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 font-bold"
                              >
                                View Details <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60 italic">Standard Component</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
