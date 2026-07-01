# ROOT_CAUSE_ANALYSIS.md

## Symptom
Selecting "Light Mode" or loading the page with Light Mode active resulted in a full-site crash returning `500 Internal Server Error` on page loads and subsequent navigation.

---

## Root Cause

### 1. Casing Conflict & Named Export Mismatch
*   **Exact File**: `apps/web/src/components/ThemeToggle.tsx` (obsolete capital-cased file) vs. `apps/web/src/components/theme-toggle.tsx` (new lowercase-cased file).
*   **Exact Line**: Inside `apps/web/src/app/layout.tsx`:
    ```tsx
    import { ThemeToggle } from "@/components/theme-toggle";
    ```
*   **Exact Error**: 
    On Windows and other case-insensitive systems, Webpack/Next.js resolves `@/components/theme-toggle` (lowercase) to the file `ThemeToggle.tsx` (capitalized) because it is alphabetically or structurally indexed in the resolution path. 
    However, `ThemeToggle.tsx` has a default export (`export default function ThemeToggle`) and **no named export** `{ ThemeToggle }`. 
    This caused the imported `ThemeToggle` to be `undefined`.
    Rendering `undefined` in layout.tsx during Server Side Rendering (SSR) threw a React runtime error:
    `Error: Element type is invalid: expected a string (for built-in components) or a class/function but got: undefined.`
    This crash bubbles up as a standard `500 Internal Server Error` to the client.

### 2. Missing Explicit `.light` Specificity Mapping
*   **Exact File**: `apps/web/src/app/globals.css`
*   **Exact Line**: 6
*   **Exact Error**: 
    `globals.css` mapped light variables only to the generic `:root` selector. If next-themes sets the explicit HTML class `class="light"` or fails to remove dark theme classes cleanly, styles might resolve incorrectly without an explicit class selector.

---

## Fixes Applied

1.  **Resolved Casing Conflict**:
    *   **Action**: Completely deleted the duplicate obsolete capitalized file `apps/web/src/components/ThemeToggle.tsx`.
    *   **Result**: Resolved Next.js compilation paths to cleanly and uniquely point to the lowercase `theme-toggle.tsx`.
2.  **Explicit Light Mode Selector**:
    *   **Action**: Updated `apps/web/src/app/globals.css` line 6 to bind light variables to `:root, .light` instead of only `:root`.
3.  **Removed System Theme Selector**:
    *   **Action**: Updated `theme-toggle.tsx` to remove the System button, keeping only Light and Dark. Adjusted component loading skeletal size.
    *   **Action**: Updated `layout.tsx` ThemeProvider to default to `dark` and set `enableSystem={false}`.
