"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Cpu, Zap, Info, FileText, ArrowLeft, ArrowRight, Share2, 
  MessageSquare, Plus, ShoppingCart, Sparkles, Check, AlertCircle, 
  ChevronRight, Search, Download, ExternalLink, X, Send
} from "lucide-react";
import { useCurrency } from "@/lib/currency";

// Detailed mock database for component details
const COMPONENT_DETAILS: Record<string, any> = {
  "esp32-s3": {
    id: "esp32-s3",
    mpn: "ESP32-S3-WROOM-1-N16R8",
    manufacturer: "Espressif Systems",
    category: "Microcontrollers",
    packageType: "Module (SMD)",
    description: "Powerful Wi-Fi + Bluetooth LE MCU module with Xtensa 32-bit LX7 dual-core processor, 16MB Flash, and 8MB PSRAM. Designed for AIoT and smart home applications.",
    lifecycle: "ACTIVE",
    pdfUrl: "https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf",
    specs: {
      "Absolute Maximum Ratings": [
        { parameter: "Supply Voltage (VDD)", value: "-0.3 V to 3.6 V", notes: "Recommended operating at 3.3V" },
        { parameter: "Input Pin Voltage (VIN)", value: "-0.3 V to VDD + 0.3 V", notes: "Pins are NOT 5V tolerant" },
        { parameter: "Maximum Output Current per I/O", value: "40 mA", notes: "Cumulative current should not exceed VDD rating" },
        { parameter: "Operating Junction Temperature (Tj)", value: "-40°C to 125°C", notes: "Thermal pad must be soldered to GND" },
      ],
      "Electrical Characteristics": [
        { parameter: "CPU Frequency", value: "Up to 240 MHz", notes: "Dual-core LX7 microprocessor" },
        { parameter: "SRAM Size", value: "512 KB", notes: "Internal SRAM" },
        { parameter: "Flash Memory", value: "16 MB", notes: "SPI Flash" },
        { parameter: "PSRAM Size", value: "8 MB", notes: "Octal SPI PSRAM" },
        { parameter: "Wi-Fi Protocol", value: "802.11 b/g/n", notes: "Up to 150 Mbps" },
        { parameter: "Bluetooth Protocol", value: "Bluetooth 5.0 LE", notes: "Supports Mesh and high speed" },
      ]
    },
    pins: [
      { number: "1", name: "GND", type: "GROUND", desc: "Ground connection" },
      { number: "2", name: "3V3", type: "POWER", desc: "3.3V power supply input" },
      { number: "3", name: "EN", type: "INPUT", desc: "High: chip enabled; Low: power off. Don't leave floating." },
      { number: "4", name: "IO4", type: "BIDIRECT", desc: "GPIO4, ADC1_CH3, Touch4" },
      { number: "5", name: "IO5", type: "BIDIRECT", desc: "GPIO5, ADC1_CH4, Touch5" },
      { number: "6", name: "IO6", type: "BIDIRECT", desc: "GPIO6, ADC1_CH5, Touch6" },
      { number: "7", name: "IO7", type: "BIDIRECT", desc: "GPIO7, ADC1_CH6, Touch7" },
      { number: "8", name: "TXD0", type: "COMM", desc: "UART0 TX, GPIO43" },
      { number: "9", name: "RXD0", type: "COMM", desc: "UART0 RX, GPIO44" },
      { number: "10", name: "IO18", type: "BIDIRECT", desc: "GPIO18, ADC2_CH7, DAC output" },
      { number: "11", name: "IO19", type: "COMM", desc: "USB D-, GPIO19, SPI SS" },
      { number: "12", name: "IO20", type: "COMM", desc: "USB D+, GPIO20, SPI MOSI" },
      { number: "13", name: "IO21", type: "BIDIRECT", desc: "GPIO21, SDA (I2C)" },
      { number: "14", name: "IO35", type: "ANALOG", desc: "GPIO35, ADC2_CH4, Analog Input" },
      { number: "15", name: "IO36", type: "ANALOG", desc: "GPIO36, ADC2_CH5, Analog Input" },
      { number: "16", name: "GND", type: "GROUND", desc: "Ground connection" },
    ],
    alternatives: [
      { mpn: "ESP32-S3-WROOM-1-N8R2", manufacturer: "Espressif Systems", package: "Module (SMD)", flash: "8 MB", ram: "2 MB PSRAM", price: 2.95, stock: "8,500", match: "98%", status: "Identical Pinout, lower memory" },
      { mpn: "ESP32-S2-WROOM-I", manufacturer: "Espressif Systems", package: "Module (SMD)", flash: "4 MB", ram: "320 KB SRAM", price: 2.20, stock: "14,200", match: "82%", status: "Single-core, pin-compatible" },
      { mpn: "ESP32-WROOM-32E", manufacturer: "Espressif Systems", package: "Module (SMD)", flash: "4 MB", ram: "520 KB SRAM", price: 2.50, stock: "45,000", match: "70%", status: "Legacy ESP32, different pinout" },
    ]
  },
  "stm32f405": {
    id: "stm32f405",
    mpn: "STM32F405RGT6",
    manufacturer: "STMicroelectronics",
    category: "Microcontrollers",
    packageType: "LQFP-64",
    description: "High-performance ARM Cortex-M4 32-bit RISC core operating at a frequency of up to 168 MHz. Features floating point unit (FPU), high-speed embedded memories, and extensive peripheral support.",
    lifecycle: "ACTIVE",
    pdfUrl: "https://www.st.com/resource/en/datasheet/stm32f405rg.pdf",
    specs: {
      "Absolute Maximum Ratings": [
        { parameter: "Supply Voltage (VDD)", value: "-0.3 V to 4.0 V", notes: "Recommended 1.8V to 3.6V" },
        { parameter: "Input Pin Voltage (VIN)", value: "-0.3 V to 5.5 V", notes: "Five-volt (5V) tolerant pins" },
        { parameter: "Operating Temperature (TA)", value: "-40°C to 85°C", notes: "Industrial grade" },
      ],
      "Electrical Characteristics": [
        { parameter: "Core Processor", value: "ARM Cortex-M4", notes: "With DSP and FPU" },
        { parameter: "Core Size", value: "32-Bit", notes: "Harvard architecture" },
        { parameter: "Speed", value: "168 MHz", notes: "210 DMIPS" },
        { parameter: "Program Memory Size", value: "1 MB", notes: "Flash" },
        { parameter: "RAM Size", value: "192 KB", notes: "SRAM" },
      ]
    },
    pins: [
      { number: "1", name: "VBAT", type: "POWER", desc: "Backup power supply" },
      { number: "2", name: "PC13", type: "BIDIRECT", desc: "GPIO, Tamper detection, RTC out" },
      { number: "3", name: "PC14", type: "ANALOG", desc: "OSC32_IN, 32kHz crystal input" },
      { number: "4", name: "PC15", type: "ANALOG", desc: "OSC32_OUT, 32kHz crystal output" },
      { number: "5", name: "PH0", type: "ANALOG", desc: "OSC_IN, main crystal input" },
      { number: "6", name: "PH1", type: "ANALOG", desc: "OSC_OUT, main crystal output" },
      { number: "7", name: "NRST", type: "INPUT", desc: "Reset input (active low)" },
      { number: "8", name: "VSSA", type: "GROUND", desc: "Analog ground" },
      { number: "9", name: "VDDA", type: "POWER", desc: "Analog power supply" },
      { number: "10", name: "PA0", type: "BIDIRECT", desc: "GPIO, ADC1_IN0, WKUP pin" },
      { number: "11", name: "PA1", type: "BIDIRECT", desc: "GPIO, ADC1_IN1, UART4_RX" },
      { number: "12", name: "PA2", type: "COMM", desc: "USART2_TX, ADC1_IN2" },
      { number: "13", name: "PA3", type: "COMM", desc: "USART2_RX, ADC1_IN3" },
      { number: "14", name: "VSS", type: "GROUND", desc: "Digital ground" },
      { number: "15", name: "VDD", type: "POWER", desc: "Digital power supply" },
      { number: "16", name: "PA4", type: "ANALOG", desc: "GPIO, ADC1_IN4, DAC1_OUT" },
    ],
    alternatives: [
      { mpn: "STM32F415RGT6", manufacturer: "STMicroelectronics", package: "LQFP-64", flash: "1 MB", ram: "192 KB RAM", price: 11.20, stock: "3,200", match: "97%", status: "Includes Cryptographic acceleration" },
      { mpn: "STM32F407VGT6", manufacturer: "STMicroelectronics", package: "LQFP-100", flash: "1 MB", ram: "192 KB RAM", price: 12.50, stock: "18,900", match: "85%", status: "More pins, Ethernet support" },
      { mpn: "GD32F405RGT6", manufacturer: "GigaDevice", package: "LQFP-64", flash: "1 MB", ram: "192 KB RAM", price: 5.80, stock: "22,000", match: "92%", status: "Direct Chinese drop-in replacement clone" },
    ]
  },
  "ne555": {
    id: "ne555",
    mpn: "NE555DR",
    manufacturer: "Texas Instruments",
    category: "Timers",
    packageType: "SOIC-8",
    description: "Precision timing circuit capable of producing accurate time delays or oscillation. In the time-delay or mono-stable mode of operation, the timed interval is controlled by a single external resistor and capacitor network.",
    lifecycle: "ACTIVE",
    pdfUrl: "https://www.ti.com/lit/ds/symlink/ne555.pdf",
    specs: {
      "Absolute Maximum Ratings": [
        { parameter: "Supply Voltage (VCC)", value: "18 V", notes: "Recommended 4.5V to 16V" },
        { parameter: "Input Voltage (CONT, RESET, THRES, TRIG)", value: "VCC", notes: "Cannot exceed supply voltage" },
        { parameter: "Output Current", value: "±225 mA", notes: "Can sink or source current" },
        { parameter: "Operating Temperature (TA)", value: "0°C to 70°C", notes: "Commercial grade" },
      ],
      "Electrical Characteristics": [
        { parameter: "Timing Error, Monostable", value: "1% typ", notes: "VCC = 5V to 15V" },
        { parameter: "Timing Error, Astable", value: "2.25% typ", notes: "With external components" },
        { parameter: "Trigger Voltage", value: "1.67 V typ", notes: "At VCC = 5V" },
        { parameter: "Threshold Voltage", value: "3.33 V typ", notes: "At VCC = 5V" },
        { parameter: "Supply Current (Low Output)", value: "3 mA to 6 mA", notes: "At VCC = 5V, RL = open" },
      ]
    },
    pins: [
      { number: "1", name: "GND", type: "GROUND", desc: "Ground connection (0V)" },
      { number: "2", name: "TRIG", type: "INPUT", desc: "Trigger input (active below 1/3 VCC)" },
      { number: "3", name: "OUT", type: "OUTPUT", desc: "Timer output (sinks or sources up to 200mA)" },
      { number: "4", name: "RESET", type: "INPUT", desc: "Reset input (active low, forces output low)" },
      { number: "5", name: "CONT", type: "ANALOG", desc: "Control voltage (2/3 VCC bypass)" },
      { number: "6", name: "THRES", type: "INPUT", desc: "Threshold input (active above 2/3 VCC)" },
      { number: "7", name: "DISCH", type: "BIDIRECT", desc: "Discharge output, open collector to discharge capacitor" },
      { number: "8", name: "VCC", type: "POWER", desc: "Supply voltage input (4.5V to 16V)" },
    ],
    alternatives: [
      { mpn: "LM555CM/NOPB", manufacturer: "Texas Instruments", package: "SOIC-8", flash: "N/A", ram: "N/A", price: 0.35, stock: "120,000", match: "100%", status: "Identical replacement, equivalent specs" },
      { mpn: "NE555P", manufacturer: "Texas Instruments", package: "PDIP-8", flash: "N/A", ram: "N/A", price: 0.22, stock: "80,000", match: "99%", status: "Through-hole version of the same chip" },
      { mpn: "LMC555IMX/NOPB", manufacturer: "Texas Instruments", package: "SOIC-8", flash: "N/A", ram: "N/A", price: 0.65, stock: "45,000", match: "95%", status: "Low-power CMOS version, 1.5V operation" },
    ]
  },
  "lm317": {
    id: "lm317",
    mpn: "LM317T",
    manufacturer: "onsemi",
    category: "Power Management",
    packageType: "TO-220",
    description: "Adjustable 3-terminal positive voltage regulator capable of supplying in excess of 1.5 A over an output voltage range of 1.2 V to 37 V. It is exceptionally easy to use and requires only two external resistors to set the output voltage.",
    lifecycle: "ACTIVE",
    pdfUrl: "https://www.onsemi.com/pdf/datasheet/lm317-d.pdf",
    specs: {
      "Absolute Maximum Ratings": [
        { parameter: "Input-Output Voltage Differential (VI - VO)", value: "40 V", notes: "Do not exceed during operation" },
        { parameter: "Power Dissipation", value: "Internally Limited", notes: "Depends on heatsink size" },
        { parameter: "Operating Junction Temperature Range", value: "-40°C to 125°C", notes: "Built-in thermal overload protection" },
      ],
      "Electrical Characteristics": [
        { parameter: "Output Voltage Range", value: "1.2 V to 37 V", notes: "Set by two external resistors" },
        { parameter: "Reference Voltage (Vref)", value: "1.25 V typ", notes: "Between OUT and ADJ pins" },
        { parameter: "Line Regulation", value: "0.01% / V typ", notes: "3.0V <= VI - VO <= 40V" },
        { parameter: "Load Regulation", value: "0.1% typ", notes: "10mA <= IO <= 1.5A" },
        { parameter: "Adjustment Pin Current (Iadj)", value: "50 uA typ", notes: "Very stable, minimizes error" },
      ]
    },
    pins: [
      { number: "1", name: "ADJ", type: "INPUT", desc: "Adjust pin. Output voltage set point input." },
      { number: "2", name: "OUT", type: "OUTPUT", desc: "Regulated output voltage pin. Connected to tab in TO-220." },
      { number: "3", name: "IN", type: "POWER", desc: "Unregulated input voltage supply pin." },
    ],
    alternatives: [
      { mpn: "LM317LDG", manufacturer: "onsemi", package: "SOIC-8", flash: "N/A", ram: "N/A", price: 0.32, stock: "15,000", match: "95%", status: "Low-current version (100mA max)" },
      { mpn: "LM350T", manufacturer: "Texas Instruments", package: "TO-220", flash: "N/A", ram: "N/A", price: 1.85, stock: "2,300", match: "90%", status: "High-current version (3A max)" },
      { mpn: "LD1117V33", manufacturer: "STMicroelectronics", package: "TO-220", flash: "N/A", ram: "N/A", price: 0.45, stock: "89,000", match: "60%", status: "Fixed 3.3V LDO, different pinout" },
    ]
  }
};

export default function ComponentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { format } = useCurrency();

  // Find target component, default to ESP32-S3 if not found
  const compId = (id as string) || "esp32-s3";
  const comp = useMemo(() => COMPONENT_DETAILS[compId] || COMPONENT_DETAILS["esp32-s3"], [compId]);

  const [activeTab, setActiveTab] = useState<"specs" | "pinout" | "datasheet" | "alternatives">("specs");
  const [hoveredPin, setHoveredPin] = useState<any>(null);
  const [pinSearchQuery, setPinSearchQuery] = useState("");

  // AI Panel State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hi there! I am the ElectroHub AI Assistant. I have fully indexed the datasheet for **${comp.mpn}**. Ask me anything about its absolute maximum ratings, pinout configuration, or decoupling capacitor recommendations!`
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Check window size for touch adaptations
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setAiMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");

    // Simulate AI response based on the component
    setTimeout(() => {
      let response = "";
      const lowerMsg = userMsg.toLowerCase();

      if (lowerMsg.includes("voltage") || lowerMsg.includes("max")) {
        response = `According to the absolute maximum ratings, the maximum supply voltage for **${comp.mpn}** is **${comp.specs["Absolute Maximum Ratings"][0].value}**. Exceeding this limit will cause permanent damage.`;
      } else if (lowerMsg.includes("pin") || lowerMsg.includes("pinout") || lowerMsg.includes("gnd")) {
        const gndPins = comp.pins.filter((p: any) => p.type === "GROUND").map((p: any) => `Pin ${p.number}`).join(", ");
        response = `The **${comp.mpn}** has ${comp.pins.length} pins. The ground connections are on ${gndPins}. ${
          comp.id === "esp32-s3" ? "Please note that the thermal pad underneath must also be soldered to Ground for proper heat dissipation." : ""
        }`;
      } else if (lowerMsg.includes("decoupling") || lowerMsg.includes("capacitor") || lowerMsg.includes("circuit")) {
        response = `For the **${comp.mpn}**, it is highly recommended to place a **100nF** ceramic decoupling capacitor as close as possible to the VCC/3V3 pins, in parallel with a **10uF** electrolytic or tantalum bulk capacitor to filter out high and low frequency noise.`;
      } else {
        response = `I've analyzed the datasheet for **${comp.mpn}** (${comp.manufacturer}). It is a ${comp.category} in a ${comp.packageType} package. What specific electrical characteristics or reference design guidelines would you like me to pull up?`;
      }

      setAiMessages(prev => [...prev, { role: "assistant", content: response }]);
    }, 1000);
  };

  const handleQuickQuestion = (question: string) => {
    setChatInput(question);
    // Triggering send next tick
    setTimeout(() => {
      setAiMessages(prev => [...prev, { role: "user", content: question }]);
      setChatInput("");
      
      setTimeout(() => {
        let response = "";
        if (question.includes("maximum supply voltage")) {
          response = `The absolute maximum supply voltage is **${comp.specs["Absolute Maximum Ratings"][0].value}**. The recommended operating voltage is 3.3V for microcontrollers.`;
        } else if (question.includes("decoupling capacitor")) {
          response = `Place a **100nF** (0.1uF) ceramic capacitor and a **10uF** capacitor in parallel close to the power input pin to stabilize voltage levels and suppress transients.`;
        } else {
          response = `GPIO pins on the **${comp.mpn}** are rated for VDD + 0.3 V. They are **NOT 5V tolerant**. Applying 5V to any GPIO pin will damage the silicon.`;
        }
        setAiMessages(prev => [...prev, { role: "assistant", content: response }]);
      }, 800);
    }, 50);
  };

  // Filtered Pins List
  const filteredPins = useMemo(() => {
    return comp.pins.filter((p: any) => 
      p.number.includes(pinSearchQuery) || 
      p.name.toLowerCase().includes(pinSearchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(pinSearchQuery.toLowerCase()) ||
      (p.desc && p.desc.toLowerCase().includes(pinSearchQuery.toLowerCase()))
    );
  }, [comp.pins, pinSearchQuery]);

  // Color mapping for pin types
  const getPinColorClass = (type: string) => {
    switch (type) {
      case "POWER": return "bg-red-500/10 text-red-500 dark:text-red-400 border-red-500/20 dark:border-red-500/30";
      case "GROUND": return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
      case "ANALOG": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30";
      case "COMM": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-500/30";
      case "INPUT": return "bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/30";
      case "OUTPUT": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/30";
      default: return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:border-sky-500/30"; // BIDIRECT or other
    }
  };

  const getPinSvgFill = (type: string) => {
    switch (type) {
      case "POWER": return "#ef4444"; // Red
      case "GROUND": return "#71717a"; // Gray
      case "ANALOG": return "#f59e0b"; // Amber
      case "COMM": return "#10b981"; // Emerald
      case "INPUT": return "#a855f7"; // Purple
      case "OUTPUT": return "#3b82f6"; // Blue
      default: return "#0ea5e9"; // Sky
    }
  };

  const handlePinTouch = (pin: any) => {
    if (isMobile) {
      setHoveredPin(hoveredPin?.number === pin.number ? null : pin);
    }
  };

  // Render the interactive pinout SVG depending on pin count
  const renderPinoutSvg = () => {
    const totalPins = comp.pins.length;
    const halfPins = Math.ceil(totalPins / 2);
    
    // Width and height of chip body
    const chipWidth = 180;
    const chipHeight = Math.max(160, halfPins * 35 + 40);
    const svgWidth = 480;
    const svgHeight = chipHeight + 60;
    
    // Coordinates for the chip body
    const chipX = (svgWidth - chipWidth) / 2;
    const chipY = 30;

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="max-w-md mx-auto drop-shadow-xl">
        {/* Shadow / Glow for hovered pin */}
        {hoveredPin && (
          <rect
            x={chipX - 60}
            y={chipY}
            width={chipWidth + 120}
            height={chipHeight}
            fill="none"
            stroke={getPinSvgFill(hoveredPin.type)}
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-20 animate-pulse"
          />
        )}

        {/* Chip Body */}
        <rect
          x={chipX}
          y={chipY}
          width={chipWidth}
          height={chipHeight}
          rx="12"
          className="fill-zinc-950 dark:fill-[#0c0c0f] stroke-border"
          strokeWidth="3"
        />
        
        {/* Chip Notch (indicates pin 1 direction) */}
        <path
          d={`M ${chipX + chipWidth / 2 - 15} ${chipY} A 15 15 0 0 0 ${chipX + chipWidth / 2 + 15} ${chipY}`}
          className="fill-background stroke-border"
          strokeWidth="2"
        />

        {/* Text inside chip */}
        <text
          x={svgWidth / 2}
          y={chipY + 50}
          textAnchor="middle"
          className="fill-foreground"
          fontSize="13"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {comp.mpn.split("-")[0]}
        </text>
        <text
          x={svgWidth / 2}
          y={chipY + 70}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="9"
          fontFamily="sans-serif"
        >
          {comp.manufacturer}
        </text>
        <text
          x={svgWidth / 2}
          y={chipY + chipHeight - 25}
          className="fill-muted-foreground/60"
          fontSize="8"
          fontFamily="monospace"
        >
          {comp.packageType}
        </text>

        {/* Draw Pins */}
        {comp.pins.map((pin: any, index: number) => {
          const isLeft = index < halfPins;
          const pinIdx = isLeft ? index : index - halfPins;
          
          // Compute coordinates
          const pinW = 35;
          const pinH = 16;
          const pinYPos = chipY + 35 + pinIdx * 35;
          
          const pinXPos = isLeft 
            ? chipX - pinW 
            : chipX + chipWidth;
            
          const isSelected = hoveredPin && hoveredPin.number === pin.number;

          return (
            <g
              key={pin.number}
              onClick={() => handlePinTouch(pin)}
              onMouseEnter={() => { if (!isMobile) setHoveredPin(pin); }}
              onMouseLeave={() => { if (!isMobile) setHoveredPin(null); }}
              className="cursor-pointer group"
            >
              {/* Metal pin contact */}
              <rect
                x={pinXPos}
                y={pinYPos}
                width={pinW}
                height={pinH}
                rx="3"
                fill={isSelected ? getPinSvgFill(pin.type) : "var(--border)"}
                className="stroke-muted-foreground/45 transition-colors duration-200"
                strokeWidth="1"
              />
              
              {/* Pin identifier text */}
              <text
                x={isLeft ? pinXPos - 8 : pinXPos + pinW + 8}
                y={pinYPos + 12}
                textAnchor={isLeft ? "end" : "start"}
                className={`${isSelected ? "fill-foreground font-bold" : "fill-muted-foreground"}`}
                fontSize="10"
                fontFamily="monospace"
              >
                {pin.number}
              </text>

              {/* Pin Label on Chip Side */}
              <text
                x={isLeft ? chipX + 8 : chipX + chipWidth - 8}
                y={pinYPos + 12}
                textAnchor={isLeft ? "start" : "end"}
                fill={isSelected ? getPinSvgFill(pin.type) : "currentColor"}
                className={`font-mono text-[10px] font-bold ${isSelected ? "" : "text-foreground/90"}`}
              >
                {pin.name}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col relative min-h-screen bg-background text-foreground pb-20 md:pb-6">
      {/* Top Banner / Breadcrumbs */}
      <div className="bg-secondary/40 border-b border-border py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/search" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Explorer
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" /> Verified
            </span>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-secondary/15 to-transparent py-8 border-b border-border/40">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-blue-500 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded">
                {comp.category}
              </span>
              <span className="text-xs text-muted-foreground">
                Package: {comp.packageType}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">{comp.mpn}</h1>
            <p className="text-xs text-muted-foreground font-medium">Manufacturer: <span className="text-foreground/80">{comp.manufacturer}</span></p>
            <p className="text-sm text-muted-foreground leading-relaxed">{comp.description}</p>
          </div>

          {/* Action Buttons (Desktop Layout) */}
          <div className="hidden md:flex flex-wrap gap-2.5 shrink-0 pt-2 lg:pt-0">
            <button
              onClick={() => setIsAiOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-primary/10"
            >
              <Sparkles className="w-4 h-4" /> Ask AI Assistant
            </button>
            <button className="bg-muted border border-border hover:bg-secondary/40 text-foreground text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add to Project
            </button>
            <button className="bg-muted border border-border hover:bg-secondary/40 text-foreground text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" /> Add to BOM
            </button>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Actions for Mobile */}
      <div className="fixed bottom-[60px] left-0 right-0 z-40 md:hidden bg-background/90 backdrop-blur-md border-t border-border p-3 flex gap-2">
        <button
          onClick={() => setIsAiOpen(true)}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-primary/15"
        >
          <Sparkles className="w-4 h-4" /> Ask AI
        </button>
        <button className="bg-muted hover:bg-secondary/50 text-foreground border border-border p-3 rounded-xl flex items-center justify-center" aria-label="Add to Project">
          <Plus className="w-4 h-4" />
        </button>
        <button className="bg-muted hover:bg-secondary/50 text-foreground border border-border p-3 rounded-xl flex items-center justify-center" aria-label="Add to BOM">
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content & Tabs */}
      <div className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="border-b border-border mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setActiveTab("specs")}
              className={`text-xs font-semibold px-4 py-3 border-b-2 transition-all shrink-0 ${
                activeTab === "specs" 
                  ? "border-blue-500 text-blue-600 dark:text-white bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Specs & Ratings
            </button>
            <button
              onClick={() => setActiveTab("pinout")}
              className={`text-xs font-semibold px-4 py-3 border-b-2 transition-all shrink-0 ${
                activeTab === "pinout" 
                  ? "border-blue-500 text-blue-600 dark:text-white bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Interactive Pinout
            </button>
            <button
              onClick={() => setActiveTab("datasheet")}
              className={`text-xs font-semibold px-4 py-3 border-b-2 transition-all shrink-0 ${
                activeTab === "datasheet" 
                  ? "border-blue-500 text-blue-600 dark:text-white bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Official Datasheet
            </button>
            <button
              onClick={() => setActiveTab("alternatives")}
              className={`text-xs font-semibold px-4 py-3 border-b-2 transition-all shrink-0 ${
                activeTab === "alternatives" 
                  ? "border-blue-500 text-blue-600 dark:text-white bg-blue-500/5" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Alternatives Comparison
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* Specs Tab */}
          {activeTab === "specs" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {Object.entries(comp.specs).map(([sectionName, list]: any) => (
                <div key={sectionName} className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" /> {sectionName}
                  </h3>
                  
                  {/* Desktop Specifications Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border">
                          <th className="pb-2 font-semibold w-1/2">Parameter</th>
                          <th className="pb-2 font-semibold w-1/4">Value</th>
                          <th className="pb-2 font-semibold w-1/4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {list.map((spec: any, idx: number) => (
                          <tr key={idx} className="text-foreground/90 hover:bg-secondary/15 transition-colors">
                            <td className="py-2.5 font-medium">{spec.parameter}</td>
                            <td className="py-2.5 text-foreground font-semibold font-mono">{spec.value}</td>
                            <td className="py-2.5 text-muted-foreground text-[11px]">{spec.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Specifications Stack Cards */}
                  <div className="md:hidden space-y-3.5 divide-y divide-border/50 pt-1">
                    {list.map((spec: any, idx: number) => (
                      <div key={idx} className={`${idx > 0 ? "pt-3.5" : ""} space-y-1.5`}>
                        <div className="flex justify-between items-start text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          <span>{spec.parameter}</span>
                          <span className="font-mono text-foreground text-xs font-semibold">{spec.value}</span>
                        </div>
                        {spec.notes && (
                          <p className="text-[11px] text-muted-foreground italic leading-normal">{spec.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Pinout Tab */}
          {activeTab === "pinout" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              {/* Pinout Visual Canvas (SVG) */}
              <div className="lg:col-span-6 bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[350px] sm:min-h-[400px] shadow-sm">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-6 self-start">
                  Interactive Package Canvas
                </h3>
                
                <div className="w-full max-w-[280px] sm:max-w-md mx-auto">
                  {renderPinoutSvg()}
                </div>
                
                {/* Floating hovered pin panel */}
                {hoveredPin ? (
                  <div className="mt-6 w-full max-w-sm bg-background border border-border rounded-xl p-3 flex items-start gap-3 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${getPinColorClass(hoveredPin.type)}`}>
                      PIN {hoveredPin.number}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-foreground text-xs">{hoveredPin.name}</span>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">[{hoveredPin.type}]</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal">{hoveredPin.desc}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-center text-xs text-muted-foreground italic">
                    {isMobile ? "Tap any physical pin to select and view hardware mappings." : "Hover over any physical pin to view detailed hardware mappings."}
                  </div>
                )}
              </div>

              {/* Pin List */}
              <div className="lg:col-span-6 bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-bold text-foreground">Full Pin Mapping</h3>
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search pin name, type..."
                      value={pinSearchQuery}
                      onChange={(e) => setPinSearchQuery(e.target.value)}
                      className="bg-background border border-border focus:border-blue-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none w-full sm:w-48 focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Desktop Pin List Table */}
                <div className="hidden md:block flex-1 overflow-y-auto max-h-[350px] pr-2">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border sticky top-0 bg-card pb-2 z-10">
                        <th className="pb-2 font-semibold w-12">Pin</th>
                        <th className="pb-2 font-semibold w-20">Name</th>
                        <th className="pb-2 font-semibold w-24">Type</th>
                        <th className="pb-2 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredPins.map((pin: any) => (
                        <tr
                          key={pin.number}
                          onMouseEnter={() => setHoveredPin(pin)}
                          onMouseLeave={() => setHoveredPin(null)}
                          className={`hover:bg-secondary/15 transition-colors cursor-pointer ${
                            hoveredPin && hoveredPin.number === pin.number ? "bg-secondary/20" : ""
                          }`}
                        >
                          <td className="py-2.5 font-mono text-muted-foreground">{pin.number}</td>
                          <td className="py-2.5 font-bold text-foreground">{pin.name}</td>
                          <td className="py-2.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getPinColorClass(pin.type)}`}>
                              {pin.type}
                            </span>
                          </td>
                          <td className="py-2.5 text-muted-foreground text-[11px] leading-relaxed">{pin.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Pin List Touch Cards */}
                <div className="md:hidden flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-2.5">
                  {filteredPins.map((pin: any) => {
                    const isSelected = hoveredPin && hoveredPin.number === pin.number;
                    return (
                      <div
                        key={pin.number}
                        onClick={() => handlePinTouch(pin)}
                        className={`p-3 border rounded-xl flex flex-col gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-500/10 border-blue-500/50"
                            : "bg-background border-border hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">Pin {pin.number}</span>
                            <span className="font-bold text-sm text-foreground">{pin.name}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getPinColorClass(pin.type)}`}>
                            {pin.type}
                          </span>
                        </div>
                        {pin.desc && (
                          <p className="text-xs text-muted-foreground leading-normal">{pin.desc}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Datasheet Tab */}
          {activeTab === "datasheet" && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-foreground">Embedded PDF Datasheet</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={comp.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-muted hover:bg-secondary/40 text-foreground border border-border px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                </div>
              </div>

              {/* Desktop PDF Viewer frame */}
              <div className="hidden md:block relative w-full h-[650px] bg-background rounded-lg overflow-hidden border border-border flex flex-col items-center justify-center">
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(comp.pdfUrl)}&embedded=true`}
                  className="w-full h-full border-none"
                  title={`${comp.mpn} Datasheet`}
                />
                
                {/* Fallback info card at bottom */}
                <div className="absolute bottom-4 right-4 max-w-sm bg-card/85 backdrop-blur-md border border-border rounded-lg p-3 text-xs space-y-2 text-muted-foreground shadow-lg">
                  <p className="font-bold text-foreground flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-blue-500" /> Can&apos;t see the PDF viewer?
                  </p>
                  <p className="text-[11px] leading-normal">
                    Some browsers block embedded document viewers. You can access the datasheet directly at the official URL.
                  </p>
                  <a
                    href={comp.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open official PDF link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Mobile PDF Fallback Download Card */}
              <div className="md:hidden p-6 bg-background border border-border rounded-xl space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground text-sm">Datasheet PDF for {comp.mpn}</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-normal">
                    Mobile screens are too small to view embedded PDFs comfortably. Open or download the official manufacturer document.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <a
                    href={comp.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-primary/15"
                  >
                    <Download className="w-4 h-4" /> Download PDF Datasheet
                  </a>
                  <a
                    href={comp.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-muted hover:bg-secondary/40 text-foreground text-xs font-semibold py-2.5 rounded-lg border border-border transition-colors flex items-center justify-center gap-1.5"
                  >
                    Open in New Tab <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Alternatives Tab */}
          {activeTab === "alternatives" && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-6 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" /> AI Alternative Matching Matrix
                </h3>
                <p className="text-muted-foreground text-xs leading-normal">
                  We use vector cosine similarity (pgvector) on electrical parameters, package dimensions, and pin structures to find the closest drop-in replacements.
                </p>
              </div>

              {/* Desktop Comparison Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border pb-2">
                      <th className="pb-3 font-semibold">Specification</th>
                      <th className="pb-3 font-semibold text-foreground bg-blue-500/5 px-3 border border-blue-500/10">{comp.mpn} (Current)</th>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <th key={idx} className="pb-3 font-semibold px-3 text-foreground">{alt.mpn}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">Manufacturer</td>
                      <td className="py-3 text-foreground bg-blue-500/5 px-3 border border-blue-500/10 font-semibold">{comp.manufacturer}</td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 text-foreground/80 px-3">{alt.manufacturer}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">Package</td>
                      <td className="py-3 text-foreground bg-blue-500/5 px-3 border border-blue-500/10 font-mono font-semibold">{comp.packageType}</td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 text-foreground/80 px-3 font-mono">{alt.package}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">Program Memory</td>
                      <td className="py-3 text-foreground bg-blue-500/5 px-3 border border-blue-500/10 font-mono font-semibold">
                        {comp.id === "esp32-s3" ? "16 MB" : comp.id === "stm32f405" ? "1 MB" : "N/A"}
                      </td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 text-foreground/80 px-3 font-mono">{alt.flash}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">RAM Size</td>
                      <td className="py-3 text-foreground bg-blue-500/5 px-3 border border-blue-500/10 font-mono font-semibold">
                        {comp.id === "esp32-s3" ? "512KB + 8MB" : comp.id === "stm32f405" ? "192 KB" : "N/A"}
                      </td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 text-foreground/80 px-3 font-mono">{alt.ram}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">Unit Price</td>
                      <td className="py-3 text-blue-600 dark:text-blue-400 bg-blue-500/5 px-3 border border-blue-500/10 font-bold font-mono">
                        {comp.id === "esp32-s3" ? format(3.45) : comp.id === "stm32f405" ? format(9.85) : comp.id === "ne555" ? format(0.15) : format(0.48)}
                      </td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 text-foreground px-3 font-mono font-semibold">{format(alt.price)}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">Stock Qty</td>
                      <td className="py-3 text-foreground bg-blue-500/5 px-3 border border-blue-500/10 font-mono font-semibold">
                        {comp.id === "esp32-s3" ? "12,450" : comp.id === "stm32f405" ? "2,310" : comp.id === "ne555" ? "45,200" : "18,900"}
                      </td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 text-foreground/80 px-3 font-mono">{alt.stock}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">Similarity Match</td>
                      <td className="py-3 text-foreground bg-blue-500/5 px-3 border border-blue-500/10 font-bold text-center">—</td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 px-3">
                          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-950/30 border border-teal-500/20 dark:border-teal-900/30 px-2 py-0.5 rounded-full">
                            {alt.match}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-semibold text-muted-foreground">Compatibility Status</td>
                      <td className="py-3 text-muted-foreground bg-blue-500/5 px-3 border border-blue-500/10 italic text-[11px]">Reference</td>
                      {comp.alternatives.map((alt: any, idx: number) => (
                        <td key={idx} className="py-3 text-muted-foreground px-3 text-[11px] leading-relaxed">{alt.status}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile Alternatives Cards Stack */}
              <div className="md:hidden space-y-4">
                {comp.alternatives.map((alt: any, idx: number) => (
                  <div key={idx} className="p-4 bg-background border border-border rounded-xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <div>
                        <h4 className="font-bold text-sm text-foreground font-mono">{alt.mpn}</h4>
                        <p className="text-[10px] text-muted-foreground">{alt.manufacturer}</p>
                      </div>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-450 bg-teal-500/10 dark:bg-teal-950/30 border border-teal-500/20 dark:border-teal-900/35 px-2.5 py-0.5 rounded-full shrink-0">
                        {alt.match} Match
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs pt-1">
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Package</span>
                        <span className="text-foreground font-mono font-medium">{alt.package}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Price</span>
                        <span className="text-foreground font-mono font-bold">{format(alt.price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Flash / RAM</span>
                        <span className="text-foreground font-mono font-medium">{alt.flash} / {alt.ram}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Stock</span>
                        <span className="text-foreground font-mono font-medium">{alt.stock}</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-border/50">
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">Status / Difference</span>
                      <p className="text-[11px] text-muted-foreground italic leading-normal">{alt.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sliding AI Assistant Panel (Right Side Drawer) */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isAiOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/80 flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Component AI Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Context-Aware Chat</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-md transition-all"
            aria-label="Close panel"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {aiMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] space-y-1 ${
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                {msg.role === "user" ? "You" : "ElectroHub AI"}
              </span>
              <div
                className={`p-3 rounded-lg text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-secondary text-foreground border border-border rounded-tl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions / Prompt Starters */}
        <div className="p-3 border-t border-border bg-secondary/15 space-y-2">
          <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Quick Questions:</p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleQuickQuestion("What is the absolute maximum supply voltage?")}
              className="text-[10px] text-left text-muted-foreground hover:text-foreground bg-background hover:bg-secondary border border-border px-2.5 py-1.5 rounded transition-all flex items-center justify-between group"
            >
              <span>What is the absolute maximum supply voltage?</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-transform" />
            </button>
            <button
              onClick={() => handleQuickQuestion("What are the decoupling capacitor requirements?")}
              className="text-[10px] text-left text-muted-foreground hover:text-foreground bg-background hover:bg-secondary border border-border px-2.5 py-1.5 rounded transition-all flex items-center justify-between group"
            >
              <span>What are the decoupling capacitor requirements?</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
            </button>
            <button
              onClick={() => handleQuickQuestion("Are GPIO pins 5V tolerant?")}
              className="text-[10px] text-left text-muted-foreground hover:text-foreground bg-background hover:bg-secondary border border-border px-2.5 py-1.5 rounded transition-all flex items-center justify-between group"
            >
              <span>Are GPIO pins 5V tolerant?</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendChatMessage} className="p-4 border-t border-border bg-secondary/30 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Ask about ${comp.mpn}...`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-background border border-border focus:border-primary/50 rounded-lg px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/95 text-primary-foreground p-2 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-md shadow-primary/15"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Backdrop for AI drawer */}
      {isAiOpen && (
        <div
          onClick={() => setIsAiOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        />
      )}
    </div>
  );
}
