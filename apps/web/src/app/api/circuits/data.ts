export interface Circuit {
  id: string;
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  schematicUrl: string;
  components: { mpn: string; name: string; quantity: number }[];
}

export const CIRCUITS_DATA: Circuit[] = [
  {
    id: "ne555-astable",
    name: "NE555 Astable Multivibrator",
    description: "A classic circuit that produces a continuous square wave pulse. Ideal for LED flashers, tone generators, and clock signals.",
    difficulty: "Beginner",
    schematicUrl: "https://assets.electrohub.com/schematics/ne555-astable.svg",
    components: [
      { mpn: "NE555P", name: "Timer IC", quantity: 1 },
      { mpn: "10uF", name: "Electrolytic Capacitor", quantity: 1 },
      { mpn: "100nF", name: "Ceramic Bypass Capacitor", quantity: 1 },
      { mpn: "1k", name: "Resistor (R1)", quantity: 1 },
      { mpn: "10k", name: "Resistor (R2)", quantity: 1 },
      { mpn: "LED-RED-5MM", name: "Indicator LED", quantity: 1 },
      { mpn: "330R", name: "Current Limiting Resistor", quantity: 1 },
    ],
  },
  {
    id: "lm317-regulator",
    name: "LM317 Adjustable Voltage Regulator",
    description: "An adjustable linear regulator circuit that can provide a stable output voltage from 1.2V to 37V at up to 1.5A.",
    difficulty: "Beginner",
    schematicUrl: "https://assets.electrohub.com/schematics/lm317-regulator.svg",
    components: [
      { mpn: "LM317T", name: "Linear Regulator", quantity: 1 },
      { mpn: "0.1uF", name: "Input Ceramic Capacitor", quantity: 1 },
      { mpn: "1uF", name: "Output Electrolytic Capacitor", quantity: 1 },
      { mpn: "240R", name: "Feedback Resistor", quantity: 1 },
      { mpn: "5k-POT", name: "Potentiometer (Adjust)", quantity: 1 },
      { mpn: "1N4007", name: "Protection Diode", quantity: 2 },
    ],
  },
  {
    id: "h-bridge-motor-driver",
    name: "H-Bridge DC Motor Driver",
    description: "A discrete H-bridge circuit utilizing N-channel and P-channel MOSFETs to control the direction and speed of a DC motor.",
    difficulty: "Intermediate",
    schematicUrl: "https://assets.electrohub.com/schematics/h-bridge-motor-driver.svg",
    components: [
      { mpn: "IRF540N", name: "N-Channel MOSFET", quantity: 2 },
      { mpn: "IRF9540N", name: "P-Channel MOSFET", quantity: 2 },
      { mpn: "2N2222A", name: "NPN BJT Transistor", quantity: 2 },
      { mpn: "1N4007", name: "Flyback Diode", quantity: 4 },
      { mpn: "10k", name: "Gate Pull-up Resistor", quantity: 4 },
      { mpn: "1k", name: "Base Current Resistor", quantity: 2 },
    ],
  },
  {
    id: "esp32-sensor-node",
    name: "ESP32 IoT Sensor Node",
    description: "An internet-connected sensor node that reads temperature and humidity from a DHT22 sensor and publishes it via MQTT.",
    difficulty: "Intermediate",
    schematicUrl: "https://assets.electrohub.com/schematics/esp32-sensor-node.svg",
    components: [
      { mpn: "ESP32-WROOM-32D", name: "WiFi/BLE Module", quantity: 1 },
      { mpn: "DHT22", name: "Temp/Humidity Sensor", quantity: 1 },
      { mpn: "AP2112K-3.3TRG1", name: "3.3V LDO Regulator", quantity: 1 },
      { mpn: "10uF", name: "Filter Capacitor", quantity: 2 },
      { mpn: "10k", name: "DHT22 Pull-up Resistor", quantity: 1 },
      { mpn: "CH340C", name: "USB-to-UART Bridge", quantity: 1 },
    ],
  },
  {
    id: "switching-buck-converter",
    name: "Synchronous Buck Converter",
    description: "A high-efficiency step-down DC-DC converter circuit operating at 500kHz, designed to convert 12V to 5V at up to 3A.",
    difficulty: "Advanced",
    schematicUrl: "https://assets.electrohub.com/schematics/switching-buck-converter.svg",
    components: [
      { mpn: "LM5116MH/NOPB", name: "Buck Controller", quantity: 1 },
      { mpn: "BSC0902NS", name: "N-Channel MOSFET", quantity: 2 },
      { mpn: "IHLP5050FDERR47M01", name: "Power Inductor 0.47uH", quantity: 1 },
      { mpn: "22uF", name: "Input Ceramic Capacitor", quantity: 4 },
      { mpn: "100uF", name: "Output Polymer Capacitor", quantity: 2 },
      { mpn: "10k", name: "Feedback Resistor (Top)", quantity: 1 },
      { mpn: "2.21k", name: "Feedback Resistor (Bottom)", quantity: 1 },
    ],
  },
];
