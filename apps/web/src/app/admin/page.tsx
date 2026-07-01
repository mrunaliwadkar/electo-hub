"use client";

import { useState } from "react";
import { 
  Shield, Upload, Database, Cpu, Sparkles, RefreshCw, 
  CheckCircle, XCircle, Terminal, Eye, FileText, BarChart3, AlertCircle, X
} from "lucide-react";

// Mock data for recent ingestion logs
const INITIAL_LOGS = [
  {
    id: "log-1",
    mpn: "ESP32-S3-WROOM-1-N16R8",
    manufacturer: "Espressif Systems",
    status: "SUCCESS",
    duration: "4.2s",
    time: "2 minutes ago",
    pins: 16,
    specs: 10,
    json: {
      description: "Powerful Wi-Fi + Bluetooth LE MCU module...",
      pins: [
        { number: "1", name: "GND", type: "GROUND" },
        { number: "2", name: "3V3", type: "POWER" }
      ],
      absolute_maximums: { voltage_max: 3.6, temp_max: 125, current_max: 0.04 }
    }
  },
  {
    id: "log-2",
    mpn: "STM32F405RGT6",
    manufacturer: "STMicroelectronics",
    status: "SUCCESS",
    duration: "5.8s",
    time: "4 hours ago",
    pins: 64,
    specs: 12,
    json: {
      description: "High-performance ARM Cortex-M4 MCU...",
      pins: [
        { number: "1", name: "VBAT", type: "POWER" },
        { number: "2", name: "PC13", type: "BIDIRECT" }
      ],
      absolute_maximums: { voltage_max: 4.0, temp_max: 85, current_max: 0.15 }
    }
  },
  {
    id: "log-3",
    mpn: "DRV8833RTYR",
    manufacturer: "Texas Instruments",
    status: "SUCCESS",
    duration: "3.9s",
    time: "1 day ago",
    pins: 16,
    specs: 8,
    json: {
      description: "Dual H-Bridge Motor Driver...",
      pins: [
        { number: "1", name: "VM", type: "POWER" }
      ],
      absolute_maximums: { voltage_max: 11.8, temp_max: 150, current_max: 2.0 }
    }
  },
  {
    id: "log-4",
    mpn: "LM317T",
    manufacturer: "onsemi",
    status: "SUCCESS",
    duration: "2.5s",
    time: "3 days ago",
    pins: 3,
    specs: 6,
    json: {
      description: "Adjustable positive voltage regulator...",
      pins: [
        { number: "1", name: "ADJ", type: "INPUT" }
      ],
      absolute_maximums: { voltage_max: 40, temp_max: 125, current_max: 1.5 }
    }
  }
];

export default function AdminDashboard() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  
  // Ingestion Form State
  const [mpn, setMpn] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("Microcontrollers");
  const [pdfUrl, setPdfUrl] = useState("");
  
  // Ingestion Job Simulation State
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionStep, setIngestionStep] = useState(0);
  const [selectedLogJson, setSelectedLogJson] = useState<any>(null);

  const ingestionSteps = [
    "Uploading datasheet PDF to Cloudflare R2 Store...",
    "Sending document to Google Gemini 1.5 Pro Multimodal API...",
    "Analyzing layout & extracting Pinout Table...",
    "Structuring Absolute Maximum Ratings and Specs...",
    "Generating 384-dimension vector embedding (pgvector)...",
    "Syncing normalized fields with Typesense Search index...",
    "Finished! Component successfully written to Database."
  ];

  const triggerIngestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpn || !manufacturer) return;

    setIsIngesting(true);
    setIngestionStep(0);

    // Simulate multi-stage pipeline
    const interval = setInterval(() => {
      setIngestionStep(prev => {
        if (prev >= ingestionSteps.length - 1) {
          clearInterval(interval);
          
          // Add new log to history
          const newLog = {
            id: `log-${Date.now()}`,
            mpn: mpn.toUpperCase(),
            manufacturer,
            status: "SUCCESS",
            duration: `${(Math.random() * 3 + 3).toFixed(1)}s`,
            time: "Just now",
            pins: Math.floor(Math.random() * 20 + 8),
            specs: 8,
            json: {
              description: `AI-extracted description for ${mpn}...`,
              pins: [
                { number: "1", name: "VCC", type: "POWER" },
                { number: "2", name: "GND", type: "GROUND" }
              ],
              absolute_maximums: { voltage_max: 5.0, temp_max: 85, current_max: 0.5 }
            }
          };

          setLogs(prevLogs => [newLog, ...prevLogs]);
          setIsIngesting(false);
          
          // Reset form
          setMpn("");
          setManufacturer("");
          setPdfUrl("");
          return 0;
        }
        return prev + 1;
      });
    }, 1200);
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 bg-background text-foreground pb-20 md:pb-8">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-blue-500" /> Admin Portal
        </div>
        <h1 className="text-2xl md:text-5xl font-bold text-foreground tracking-tight">Admin Control Center</h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Manage the component library, upload manufacturer datasheets, trigger the AI extraction pipeline, and inspect vector ingestion logs.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Total Parts</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">50,234</div>
          <p className="text-[10px] text-muted-foreground/60">Sync with Typesense</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">AI Accuracy</span>
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">99.8%</div>
          <p className="text-[10px] text-muted-foreground/60">Based on 1.2M points</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pending Jobs</span>
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">12</div>
          <p className="text-[10px] text-muted-foreground/60">PDFs in queue</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground gap-1.5">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Storage Used</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">142.8 GB</div>
          <p className="text-[10px] text-muted-foreground/60">S3-Compatible PDFs</p>
        </div>
      </div>

      {/* Ingestion & Logs Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Ingestion Portal */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-foreground">Ingest New Component</h3>
              <p className="text-muted-foreground text-xs leading-normal">Trigger the Gemini 1.5 Pro multi-modal pipeline to parse, structure, and embed a new component.</p>
            </div>

            <form onSubmit={triggerIngestion} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Part Number (MPN)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., STM32F405RGT6"
                  value={mpn}
                  onChange={(e) => setMpn(e.target.value)}
                  className="w-full bg-background border border-border focus:border-blue-500/50 rounded-lg px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Manufacturer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., STMicroelectronics"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full bg-background border border-border focus:border-blue-500/50 rounded-lg px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2 text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="Microcontrollers">Microcontrollers</option>
                    <option value="Power Management">Power Management</option>
                    <option value="Amplifiers">Amplifiers</option>
                    <option value="Sensors">Sensors</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Datasheet PDF URL</label>
                  <input
                    type="text"
                    placeholder="e.g., https://st.com/..."
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="w-full bg-background border border-border focus:border-primary/50 rounded-lg px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isIngesting}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground text-xs font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/15"
              >
                {isIngesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingestion Running
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Trigger AI Extraction
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Extraction progress simulation */}
          {isIngesting && (
            <div className="mt-6 p-4 rounded-xl bg-background border border-border space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-primary animate-pulse" /> Processing Pipeline
                </span>
                <span className="text-[10px] text-muted-foreground">Step {ingestionStep + 1} of {ingestionSteps.length}</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${((ingestionStep + 1) / ingestionSteps.length) * 100}%` }}
                />
              </div>

              <p className="text-[11px] text-muted-foreground italic leading-normal">
                {ingestionSteps[ingestionStep]}
              </p>
            </div>
          )}
        </div>

        {/* AI Ingestion Logs */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">AI Extraction Ingestion Logs</h3>
              <p className="text-muted-foreground text-xs leading-normal">Monitor recent PDF analysis jobs, validation status, and extracted pin counts.</p>
            </div>

            {/* Desktop Log Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border pb-2">
                    <th className="pb-3 font-semibold">Component (MPN)</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                    <th className="pb-3 font-semibold text-center">Duration</th>
                    <th className="pb-3 font-semibold text-center">Pins / Specs</th>
                    <th className="pb-3 font-semibold text-right">Raw Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/15 transition-colors">
                      <td className="py-3 font-bold text-foreground font-mono">
                        <div className="truncate max-w-[150px] font-bold">{log.mpn}</div>
                        <div className="text-[9px] text-muted-foreground font-normal font-sans mt-0.5">{log.manufacturer} | {log.time}</div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-550/10 text-green-600 dark:text-green-400 border border-green-550/15">
                          <CheckCircle className="w-3 h-3" /> {log.status}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-muted-foreground">{log.duration}</td>
                      <td className="py-3 text-center text-foreground font-mono">
                        {log.pins} Pin / {log.specs} Spec
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelectedLogJson(log)}
                          className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-secondary/40 rounded-md transition-all inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Log Card List */}
            <div className="md:hidden space-y-3.5">
              {logs.map((log) => (
                <div key={log.id} className="bg-background border border-border rounded-xl p-3.5 space-y-3 shadow-sm">
                  <div className="flex justify-between items-start border-b border-border/50 pb-2.5 gap-2">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-foreground truncate max-w-[170px]">{log.mpn}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{log.manufacturer} | {log.time}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5" /> {log.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Duration</span>
                      <span className="text-foreground font-mono font-semibold">{log.duration}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Extracted Data</span>
                      <span className="text-foreground font-mono font-semibold">{log.pins} Pin / {log.specs} Spec</span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-border/50 flex justify-end">
                    <button
                      onClick={() => setSelectedLogJson(log)}
                      className="text-primary hover:text-primary/90 p-1.5 hover:bg-secondary/40 rounded-md transition-all inline-flex items-center gap-1 text-[11px] font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View JSON Spec
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* JSON Viewer Drawer/Modal */}
      {selectedLogJson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[450px] animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border bg-secondary/35 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground text-sm">Extracted JSON Spec</h3>
                <p className="text-[10px] text-muted-foreground font-mono">MPN: {selectedLogJson.mpn}</p>
              </div>
              <button
                onClick={() => setSelectedLogJson(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-md transition-all border border-border bg-background shadow-sm"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-background font-mono text-[11px] text-foreground/90 leading-normal border-t border-border">
              <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLogJson.json, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
