"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Folder, Plus, FileText, Trash2, Edit2, 
  Settings, ShoppingBag, ExternalLink, RefreshCw, Save, Check 
} from "lucide-react";
import { useCurrency } from "@/lib/currency";

// Mock data for user projects
const INITIAL_PROJECTS = [
  {
    id: "proj-1",
    name: "Smart Agriculture Node",
    description: "An ESP32-S3 based sensor node that monitors soil moisture, ambient temperature, and uploads data over Wi-Fi/BLE.",
    updatedAt: "2 hours ago",
    notes: "TODO:\n1. Verify GPIO pin allocation for I2C (currently using GPIO21 and GPIO22).\n2. Calculate thermal dissipation on the LDO regulator. Needs at least 150mm² copper pour.\n3. Verify if ADS1115 ADC input needs low-pass filtering.",
    components: [
      { id: "esp32-s3", mpn: "ESP32-S3-WROOM-1-N16R8", manufacturer: "Espressif Systems", quantity: 1, unitPrice: 3.45, notes: "Main controller. Operating at 3.3V" },
      { id: "ads1115", mpn: "ADS1115IRUGT", manufacturer: "Texas Instruments", quantity: 1, unitPrice: 2.10, notes: "16-bit ADC for precision soil moisture sensor analog reading" },
      { id: "mfn-cap-10uf", mpn: "CL21A106KOQNNNE", manufacturer: "Samsung Electro-Mechanics", quantity: 5, unitPrice: 0.02, notes: "Decoupling caps for ESP32 and ADC" },
      { id: "mfn-res-10k", mpn: "RC0805FR-0710KL", manufacturer: "Yageo", quantity: 10, unitPrice: 0.01, notes: "Pull-up resistors for I2C and Reset lines" },
    ]
  },
  {
    id: "proj-2",
    name: "Mini Quadcopter ESC",
    description: "Four-channel brushless electronic speed controller using STM32F405 and half-bridge gate drivers.",
    updatedAt: "3 days ago",
    notes: "Notes:\n- Gate driver requires 12V supply. Ensure buck regulator is rated for at least 1A peak.\n- STM32F405 PWM pins mapped to TIM1 Channels 1-4.",
    components: [
      { id: "stm32f405", mpn: "STM32F405RGT6", manufacturer: "STMicroelectronics", quantity: 1, unitPrice: 9.85, notes: "Core flight control MCU" },
      { id: "tps563200", mpn: "TPS563200DDCR", manufacturer: "Texas Instruments", quantity: 1, unitPrice: 0.72, notes: "Step down to 5V for receivers and sensors" },
      { id: "mfn-res-10k", mpn: "RC0805FR-0710KL", manufacturer: "Yageo", quantity: 8, unitPrice: 0.01, notes: "Gate pull-downs and logic pulls" },
    ]
  },
  {
    id: "proj-3",
    name: "USB-C Bench Power Supply",
    description: "Adjustable power supply running on USB-C Power Delivery, stepping down to 1.2V - 20V output.",
    updatedAt: "1 week ago",
    notes: "Ensure PD controller IC is negotiation-stable at 20V 5A profile.",
    components: [
      { id: "lm317", mpn: "LM317T", manufacturer: "onsemi", quantity: 2, unitPrice: 0.48, notes: "Linear regulator stage for ultra-low noise output" },
      { id: "tps563200", mpn: "TPS563200DDCR", manufacturer: "Texas Instruments", quantity: 2, unitPrice: 0.72, notes: "Pre-regulator switching stage to minimize thermal load on LM317" },
    ]
  }
];

export default function ProjectWorkspace() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState("proj-1");
  const [activeTab, setActiveTab] = useState<"parts" | "notes" | "bom">("parts");
  const [isSaved, setIsSaved] = useState(false);
  const { format } = useCurrency();

  // Get current project
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Handle Note Save
  const handleNoteChange = (text: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return { ...p, notes: text };
      }
      return p;
    }));
  };

  // Handle Qty Change
  const handleQtyChange = (compMpn: string, qty: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          components: p.components.map(c => 
            c.mpn === compMpn ? { ...c, quantity: Math.max(1, qty) } : c
          )
        };
      }
      return p;
    }));
  };

  // Remove Component
  const removeComponent = (compMpn: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          components: p.components.filter(c => c.mpn !== compMpn)
        };
      }
      return p;
    }));
  };

  // Create New Project
  const createNewProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProj = {
      id: newId,
      name: `New Project #${projects.length + 1}`,
      description: "A blank project workspace. Add components and start designing.",
      updatedAt: "Just now",
      notes: "Enter your hardware design notes here...",
      components: []
    };
    setProjects(prev => [...prev, newProj]);
    setSelectedProjectId(newId);
  };

  // Save changes feedback
  const saveProject = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Calculate project totals
  const projectTotalCost = useMemo(() => {
    return currentProject.components.reduce((acc, c) => acc + (c.quantity * c.unitPrice), 0);
  }, [currentProject]);

  return (
    <div className="flex-1 container mx-auto px-4 py-6 md:py-8 flex flex-col lg:flex-row gap-6 md:gap-8 bg-background text-foreground pb-20 md:pb-8">
      {/* Left Sidebar - Projects List */}
      <aside className="w-full lg:w-72 shrink-0 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
            <Folder className="w-4.5 h-4.5 text-muted-foreground" /> Workspaces
          </h2>
          <button
            onClick={createNewProject}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-border rounded-lg transition-all flex items-center justify-center shadow-sm"
            title="Create New Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Sidebar Layout */}
        <div className="hidden lg:flex flex-col gap-1.5">
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => {
                setSelectedProjectId(proj.id);
                setActiveTab("parts");
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 shadow-sm ${
                selectedProjectId === proj.id
                  ? "bg-card border-primary/30 text-foreground ring-1 ring-primary/20"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <span className="font-bold text-xs tracking-tight line-clamp-1">{proj.name}</span>
              <span className="text-[11px] text-muted-foreground line-clamp-1 leading-normal">{proj.description}</span>
              <span className="text-[9px] text-muted-foreground/60 mt-1 self-start">Updated {proj.updatedAt}</span>
            </button>
          ))}
        </div>

        {/* Mobile Horizontal scroll layout */}
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-1">
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => {
                setSelectedProjectId(proj.id);
                setActiveTab("parts");
              }}
              className={`shrink-0 text-left px-4 py-3 rounded-xl border transition-all ${
                selectedProjectId === proj.id
                  ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="font-bold text-xs font-mono">{proj.name}</div>
            </button>
          ))}
          <button
            onClick={createNewProject}
            className="shrink-0 bg-muted hover:bg-secondary/40 text-foreground border border-border p-3 rounded-xl flex items-center justify-center font-bold"
            title="Create New Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Right Pane - Project Details */}
      <main className="flex-1 bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col justify-between min-h-[480px] sm:min-h-[500px] shadow-sm">
        <div className="space-y-5 md:space-y-6">
          {/* Project Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-5 border-b border-border">
            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{currentProject.name}</h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{currentProject.description}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
              <button
                onClick={saveProject}
                className="bg-muted hover:bg-secondary/40 border border-border text-foreground text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm font-semibold"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Workspace
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="workspace-tabs border-b border-border/60">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => setActiveTab("parts")}
                className={`text-xs font-semibold px-4 py-2.5 border-b-2 transition-all shrink-0 ${
                  activeTab === "parts" 
                    ? "border-primary text-primary dark:text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Components ({currentProject.components.length})
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`text-xs font-semibold px-4 py-2.5 border-b-2 transition-all shrink-0 ${
                  activeTab === "notes" 
                    ? "border-primary text-primary dark:text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Design Notes
              </button>
              <button
                onClick={() => setActiveTab("bom")}
                className={`text-xs font-semibold px-4 py-2.5 border-b-2 transition-all shrink-0 ${
                  activeTab === "bom" 
                    ? "border-primary text-primary dark:text-foreground" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                BOM Summary
              </button>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="space-y-4">
            {/* Parts Tab */}
            {activeTab === "parts" && (
              <div className="space-y-4">
                {currentProject.components.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl bg-background space-y-3 shadow-sm">
                    <p className="text-xs text-muted-foreground">No components in this project yet.</p>
                    <Link
                      href="/search"
                      className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3.5 py-2 rounded-lg transition-colors font-semibold shadow-md shadow-primary/15"
                    >
                      Browse Components
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Desktop Reference BOM Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border pb-2">
                            <th className="pb-3 font-semibold">Component</th>
                            <th className="pb-3 font-semibold">Manufacturer</th>
                            <th className="pb-3 font-semibold w-24">Qty</th>
                            <th className="pb-3 font-semibold">Unit Price</th>
                            <th className="pb-3 font-semibold">Notes</th>
                            <th className="pb-3 font-semibold w-16 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {currentProject.components.map((comp) => (
                            <tr key={comp.mpn} className="hover:bg-secondary/15 transition-colors">
                              <td className="py-3.5 font-bold text-foreground font-mono">
                                {comp.id ? (
                                  <Link href={`/components/${comp.id}`} className="hover:text-primary hover:underline flex items-center gap-1">
                                    {comp.mpn} <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                  </Link>
                                ) : (
                                  comp.mpn
                                )}
                              </td>
                              <td className="py-3.5 text-muted-foreground">{comp.manufacturer}</td>
                              <td className="py-3.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={comp.quantity}
                                  onChange={(e) => handleQtyChange(comp.mpn, parseInt(e.target.value) || 1)}
                                  className="w-16 bg-background border border-border focus:border-primary/50 rounded-md px-2 py-1 text-center font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/20"
                                />
                              </td>
                              <td className="py-3.5 font-mono text-foreground font-semibold">{format(comp.unitPrice)}</td>
                              <td className="py-3.5 text-muted-foreground text-[11px] max-w-[200px] truncate" title={comp.notes}>
                                {comp.notes}
                              </td>
                              <td className="py-3.5 text-right">
                                <button
                                  onClick={() => removeComponent(comp.mpn)}
                                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Components Card List */}
                    <div className="md:hidden space-y-3.5">
                      {currentProject.components.map((comp) => (
                        <div key={comp.mpn} className="bg-background border border-border rounded-xl p-3.5 space-y-3.5 shadow-sm">
                          <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-2.5">
                            <div>
                              <span className="font-mono text-xs font-bold text-foreground">
                                {comp.id ? (
                                  <Link href={`/components/${comp.id}`} className="hover:text-primary hover:underline inline-flex items-center gap-1">
                                    {comp.mpn} <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                  </Link>
                                ) : (
                                  comp.mpn
                                )}
                              </span>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{comp.manufacturer}</p>
                            </div>
                            <button
                              onClick={() => removeComponent(comp.mpn)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all shrink-0"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-semibold">Quantity:</span>
                            <div className="flex items-center gap-1.5 bg-muted border border-border rounded-lg p-1">
                              <button
                                onClick={() => handleQtyChange(comp.mpn, comp.quantity - 1)}
                                className="w-7 h-7 rounded-md bg-background hover:bg-secondary/40 flex items-center justify-center font-bold text-foreground transition-all active:scale-90"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={comp.quantity}
                                onChange={(e) => handleQtyChange(comp.mpn, parseInt(e.target.value) || 1)}
                                className="w-10 bg-transparent text-center font-mono text-xs text-foreground focus:outline-none"
                              />
                              <button
                                onClick={() => handleQtyChange(comp.mpn, comp.quantity + 1)}
                                className="w-7 h-7 rounded-md bg-background hover:bg-secondary/40 flex items-center justify-center font-bold text-foreground transition-all active:scale-90"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-muted-foreground font-semibold">Unit Price:</span>
                            <span className="font-mono text-foreground font-semibold">{format(comp.unitPrice)}</span>
                          </div>

                          {comp.notes && (
                            <div className="pt-2.5 border-t border-border/50">
                              <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider mb-0.5">Component Notes</span>
                              <p className="text-[11px] text-muted-foreground italic leading-normal">{comp.notes}</p>
                            </div>
                          )}
                          
                          <div className="pt-2.5 border-t border-border/50 flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-semibold">Line Total:</span>
                            <span className="font-mono text-foreground font-bold">{format(comp.quantity * comp.unitPrice)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground">Project Design Logs</h3>
                  <span className="text-[10px] text-muted-foreground/60 italic">Saves locally</span>
                </div>
                <textarea
                  value={currentProject.notes}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Capture schematic pins, regulator thermal copper pour calculations, and test conditions..."
                  className="w-full min-h-[250px] bg-background border border-border focus:border-primary/40 rounded-xl p-4 text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none leading-relaxed shadow-inner"
                />
              </div>
            )}

            {/* BOM Tab */}
            {activeTab === "bom" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background border border-border rounded-xl p-5 space-y-2 shadow-sm">
                    <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">BOM Overview</h3>
                    <div className="text-2xl font-bold text-foreground">{format(projectTotalCost)}</div>
                    <p className="text-[11px] text-muted-foreground">Calculated across {currentProject.components.length} components.</p>
                  </div>
                  
                  <div className="bg-background border border-border rounded-xl p-5 space-y-2 shadow-sm">
                    <h3 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Distributor Status</h3>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        DIGIKEY: 100% Stock
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15">
                        MOUSER: 1 Part Out-of-Stock
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-xs">Run Deep Sourcing Optimization</h4>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      Instantly split this BOM across DigiKey, Mouser, and LCSC to minimize shipping costs and inventory lead times.
                    </p>
                  </div>
                  <Link
                    href="/bom"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 shadow-md shadow-primary/15"
                  >
                    Open BOM Optimizer <ShoppingBag className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Area inside Dashboard */}
        {currentProject.components.length > 0 && activeTab === "parts" && (
          <div className="pt-5 mt-5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-muted-foreground text-xs">
              Project Total Value: <span className="text-foreground font-bold font-mono">{format(projectTotalCost)}</span>
            </div>
            <Link
              href="/bom"
              className="bg-muted border border-border hover:bg-secondary/40 text-foreground text-xs px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 self-end sm:self-auto shadow-sm font-semibold"
            >
              Optimize Sourcing <ShoppingBag className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
