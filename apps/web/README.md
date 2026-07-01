# ElectroHub Web Frontend

The polished, dark-themed frontend for **ElectroHub**—the Electronics Component & Circuit Intelligence Platform. Built using **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Radix UI Primitives (via shadcn/ui)**.

---

## 1. UI Design System

ElectroHub features a premium, dark-mode-first design language inspired by Vercel and Linear, emphasizing high information density, sleek borders, and subtle glowing accent highlights.

### 1.1 Color Tokens
The color variables are defined in `src/app/globals.css` and mapped in `tailwind.config.ts`:

*   **Background (`--background`)**: `#030303` (deep black for high contrast).
*   **Card Background (`--card`)**: `#0e0e11` (slightly lighter charcoal-black to elevate card components).
*   **Borders (`--border`)**: `#1f1f23` (muted gray for clean, thin dividers).
*   **Primary Accent (`--primary`)**: `#3b82f6` (Vibrant electric blue for primary buttons and focus states).
*   **Teal Accent (`--cyber-teal`)**: `#00dfd8` (Cyberpunk-inspired cyan for highlights, status badges, and active pins).
*   **Muted Text (`--muted-foreground`)**: `#a1a1aa` (Zinc-400 for high readability on dark backgrounds).

### 1.2 Typography
We utilize the modern **Geist** font family from Next.js 15:
*   `font-sans` (`Geist`): Primary typeface for headings, body text, and interfaces.
*   `font-mono` (`Geist Mono`): Used for Manufacturer Part Numbers (MPNs), pin numbers, specifications, prices, and JSON logs.

### 1.3 Depth & Glows
*   **Ambient Glows**: Configured using radial-gradient overlays. For instance, the top landing page has a blurred blue-radial-gradient background:
    ```css
    bg-gradient-to-b from-blue-500/10 via-transparent to-transparent blur-[120px]
    ```
*   **Box Shadow Glows**: Custom utility classes like `shadow-glow-blue` provide subtle outer glows on active states or cards.

---

## 2. Component Architecture & Pages

The application is structured around 7 core pages, each implementing interactive, production-ready interfaces.

### 2.1 Landing Page (`/`)
*   **Hero**: Displays a glowing radial logo, platform value propositions, and a centered search bar.
*   **Search Routing**: Submitting the search bar routes the user to `/search?q=QUERY`.
*   **Featured Categories**: Quick-navigation cards for Microcontrollers, Power, Amplifiers, and Sensors.
*   **Featured Parts**: Direct cards for commonly searched ICs (ESP32-S3, STM32F405, NE555, LM317).

### 2.2 Component Explorer (`/search`)
*   **Parametric Filters (Left Sidebar)**: Allow filtering by Category, Manufacturer, Package Type, Stock Availability, and Operating Voltage Range.
*   **Results Grid (Right Pane)**: Displays matching component cards with stock levels, minimum price, and distributor badges.
*   **Fuzzy Search & Sorting**: Real-time filtering with options to sort by price or stock quantity.

### 2.3 Component Detail Page (`/components/[id]`)
*   **Header**: Shows part category, lifecycle status (e.g. `ACTIVE`), manufacturer, and quick-add buttons.
*   **Specs Tab**: Displays Absolute Maximum Ratings and Electrical Characteristics side-by-side in structured tables.
*   **Interactive Pinout Tab**:
    *   Renders a custom **SVG-based Chip Package**.
    *   Pins are color-coded by function: **Red** (Power), **Gray** (Ground), **Amber** (Analog), **Green** (Communication), **Purple** (Input), **Blue** (Output).
    *   Hovering over a pin triggers a glowing state and populates a detailed metadata tooltip.
    *   Includes a searchable pin mapping table.
*   **Datasheet Tab**: Embeds the official PDF using a secure iframe with a fallback download link.
*   **Alternatives Tab**: Renders a side-by-side comparison matrix of pgvector-recommended alternatives, comparing flash, RAM, price, stock, and a similarity score.
*   **AI Assistant Panel**: A sliding panel from the right, providing context-aware Q&A about the datasheet, pinouts, or decoupling capacitor requirements.

### 2.4 Circuit Library (`/circuits`)
*   **Layout**: Card grid of verified sub-circuits (e.g., Buck Regulator, ESP32 Boot, H-Bridge Driver).
*   **Detail Accordion**: Expands to show:
    *   A custom **SVG schematic diagram** with color-coded signal rails.
    *   A functional explanation of the topology.
    *   A Bill of Materials (BOM) table linking directly to the component detail pages.

### 2.5 Project Workspace (`/projects`)
*   **Split-Pane Layout**: Left pane displays active user projects; right pane displays the active workspace.
*   **Workspace Tabs**:
    *   *Components*: Edit component quantities and notes. Cost totals are updated dynamically.
    *   *Design Notes*: A markdown-like scratchpad for pinout allocations and logging.
    *   *BOM Summary*: High-level cost breakdown and distributor stock warning flags.

### 2.6 BOM Optimizer (`/bom`)
*   **Uploader**: Drag-and-drop zone with a mock-upload feature and "Load Sample BOM" trigger.
*   **Spreadsheet Grid**: Editable grid displaying part pricing across DigiKey, Mouser, and LCSC.
*   **Optimization Engine**: Evaluates unit prices and splits the BOM across distributors to minimize total cost (balancing shipping fees).
*   **Distributor Split**: Progress bars illustrating the budget split and estimated savings.

### 2.7 Admin Dashboard (`/admin`)
*   **Stats**: Key metrics on indexed parts, AI extraction accuracy, and storage usage.
*   **Ingestion Portal**: Form to upload a datasheet PDF and trigger the AI worker.
*   **Extraction Logs**: Displays recent ingestion jobs. Clicking "View JSON" opens a modal showing the raw structured JSON generated by Gemini.

---

## 3. State Management

The frontend utilizes a hybrid state management strategy designed for speed, SEO, and shareability:

1.  **URL Query Parameters**:
    *   Used for search queries (`q`) and categories in the Component Explorer. This ensures search pages are fully bookmarkable, shareable, and indexable by search engine crawlers.
2.  **React Local/Memoized State**:
    *   `useState` is used for UI states (active tabs, open drawers, hover focus).
    *   `useMemo` is heavily leveraged to perform client-side filtering, sorting, and cost calculations (such as summing quantity * price across distributors) to guarantee sub-1ms render updates.
3.  **Simulated Pipeline Events**:
    *   In the Admin Ingestion and BOM Optimizer pages, timed intervals simulate async serverless execution (such as uploading files, running LLM extraction, and recalculating splits) to provide a fluid user experience.

---

## 4. Accessibility & Responsiveness

*   **WCAG Compliance**: Contrast ratios satisfy WCAG AA standards using off-whites (`#fafafa`) on deep blacks. Elements use focus rings for keyboard navigation.
*   **Responsive Layouts**:
    *   Flexbox and CSS Grids collapse sidebars into top elements on mobile devices.
    *   Data-heavy tables in the BOM Optimizer, Explorer, and Details pages use horizontal overflow containers (`overflow-x-auto`) to prevent viewport breakage on mobile screens.
    *   Interactive SVG canvases scale proportionally using `viewBox` attributes.
