/**
 * ElectroHub Unit Normalization Engine
 * 
 * Standardizes electrical parameters (capacitance, resistance, voltage, current, inductance, power, frequency)
 * from arbitrary engineering value strings into standard numeric values (SI base units)
 * and clean, normalized display strings.
 */

export interface NormalizedValue {
  value: number;       // Base numeric value in SI units (Farads, Ohms, Volts, Amperes, Henrys, Watts, Hertz)
  unit: string;        // Base unit symbol (F, Ω, V, A, H, W, Hz)
  display: string;     // Standardized display string (e.g., "10 nF", "4.7 kΩ", "0.25 W", "16 MHz")
}

// Case-insensitive multipliers
const MULTIPLIERS_CASE_INSENSITIVE: Record<string, number> = {
  // Pico
  'p': 1e-12, 'pf': 1e-12, 'pico': 1e-12, 'picofarad': 1e-12, 'picofarads': 1e-12,
  // Nano
  'n': 1e-9, 'nf': 1e-9, 'nano': 1e-9, 'nanofarad': 1e-9, 'nanofarads': 1e-9,
  // Micro
  'u': 1e-6, 'uf': 1e-6, 'micro': 1e-6, 'microfarad': 1e-6, 'microfarads': 1e-6, 'uw': 1e-6, 'microwatts': 1e-6, 'microwatt': 1e-6,
  // Milli
  'm': 1e-3, 'milli': 1e-3, 'milliohm': 1e-3, 'milliohms': 1e-3, 'milliamp': 1e-3, 'milliamps': 1e-3, 
  'millihenry': 1e-3, 'millihenrys': 1e-3, 'millivolt': 1e-3, 'millivolts': 1e-3, 'mw': 1e-3, 'milliwatts': 1e-3, 'milliwatt': 1e-3,
  // Kilo
  'k': 1e3, 'kΩ': 1e3, 'kohm': 1e3, 'kohms': 1e3, 'kilo': 1e3, 'kiloohm': 1e3, 'kiloohms': 1e3, 'khz': 1e3, 'kilohertz': 1e3,
  // Mega
  'mega': 1e6, 'megaohm': 1e6, 'megaohms': 1e6, 'meg': 1e6, 'megohm': 1e6, 'megohms': 1e6, 'mhz': 1e6, 'megahertz': 1e6,
  // Giga
  'g': 1e9, 'giga': 1e9, 'gigaohm': 1e9, 'gigaohms': 1e9, 'ghz': 1e9, 'gigahertz': 1e9,
};

// Middle-multiplier characters mapping
const MIDDLE_MULTIPLIERS: Record<string, number> = {
  'p': 1e-12, 'P': 1e-12,
  'n': 1e-9,  'N': 1e-9,
  'u': 1e-6,  'U': 1e-6,
  'm': 1e-3,  'M': 1e6, // Case-sensitive! 'm' is milli (1e-3), 'M' is Mega (1e6)
  'r': 1,     'R': 1,
  'k': 1e3,   'K': 1e3,
  'g': 1e9,   'G': 1e9,
  'v': 1,     'V': 1,
  'a': 1,     'A': 1,
  'h': 1,     'H': 1,
  'w': 1,     'W': 1,
  'z': 1,     'Z': 1,
};

/**
 * Cleans up floating point arithmetic inaccuracies (e.g. 10 * 1e-6 = 0.000009999999999999999)
 * by rounding to 12 significant digits.
 */
export function cleanFloat(num: number): number {
  return parseFloat(num.toPrecision(12));
}

/**
 * Format number to avoid floating point precision issues and strip trailing .0
 */
export function formatNumber(num: number): string {
  // Round to at most 4 decimal places to prevent floating point anomalies
  const rounded = Math.round(num * 10000) / 10000;
  return rounded.toString();
}

/**
 * Generates a standardized display string based on the SI value and the unit type
 */
export function formatDisplay(
  val: number,
  type: 'capacitance' | 'resistance' | 'voltage' | 'current' | 'inductance' | 'power' | 'frequency'
): string {
  if (val === 0) {
    const symbols = { capacitance: 'F', resistance: 'Ω', voltage: 'V', current: 'A', inductance: 'H', power: 'W', frequency: 'Hz' };
    return `0 ${symbols[type]}`;
  }

  const absVal = Math.abs(val);

  switch (type) {
    case 'capacitance':
      if (absVal >= 1) return `${formatNumber(val)} F`;
      if (absVal >= 1e-6) return `${formatNumber(val * 1e6)} uF`;
      if (absVal >= 1e-9) return `${formatNumber(val * 1e9)} nF`;
      return `${formatNumber(val * 1e12)} pF`;

    case 'resistance':
      if (absVal >= 1e6) return `${formatNumber(val / 1e6)} MΩ`;
      if (absVal >= 1e3) return `${formatNumber(val / 1e3)} kΩ`;
      if (absVal >= 1) return `${formatNumber(val)} Ω`;
      return `${formatNumber(val * 1e3)} mΩ`;

    case 'voltage':
      if (absVal >= 1) return `${formatNumber(val)} V`;
      return `${formatNumber(val * 1e3)} mV`;

    case 'current':
      if (absVal >= 1) return `${formatNumber(val)} A`;
      if (absVal >= 1e-3) return `${formatNumber(val * 1e3)} mA`;
      if (absVal >= 1e-6) return `${formatNumber(val * 1e6)} uA`;
      return `${formatNumber(val * 1e9)} nA`;

    case 'inductance':
      if (absVal >= 1) return `${formatNumber(val)} H`;
      if (absVal >= 1e-3) return `${formatNumber(val * 1e3)} mH`;
      if (absVal >= 1e-6) return `${formatNumber(val * 1e6)} uH`;
      return `${formatNumber(val * 1e9)} nH`;

    case 'power':
      if (absVal >= 1) return `${formatNumber(val)} W`;
      if (absVal >= 1e-3) return `${formatNumber(val * 1e3)} mW`;
      return `${formatNumber(val * 1e6)} uW`;

    case 'frequency':
      if (absVal >= 1e9) return `${formatNumber(val / 1e9)} GHz`;
      if (absVal >= 1e6) return `${formatNumber(val / 1e6)} MHz`;
      if (absVal >= 1e3) return `${formatNumber(val / 1e3)} kHz`;
      return `${formatNumber(val)} Hz`;

    default:
      return `${val}`;
  }
}

/**
 * Normalizes an engineering value string into standard SI value and display string.
 * Returns null if the string cannot be parsed.
 */
export function normalizeValue(
  input: string | number | null | undefined,
  unitType: 'capacitance' | 'resistance' | 'voltage' | 'current' | 'inductance' | 'power' | 'frequency'
): NormalizedValue | null {
  if (input === null || input === undefined) return null;

  // Map unit types to their base symbols
  let baseUnit = '';
  if (unitType === 'capacitance') baseUnit = 'F';
  else if (unitType === 'resistance') baseUnit = 'Ω';
  else if (unitType === 'voltage') baseUnit = 'V';
  else if (unitType === 'current') baseUnit = 'A';
  else if (unitType === 'inductance') baseUnit = 'H';
  else if (unitType === 'power') baseUnit = 'W';
  else if (unitType === 'frequency') baseUnit = 'Hz';

  // If input is already a number, just format and return it
  if (typeof input === 'number') {
    return {
      value: cleanFloat(input),
      unit: baseUnit,
      display: formatDisplay(cleanFloat(input), unitType)
    };
  }

  let cleanInput = input.trim();
  if (!cleanInput) return null;

  // Replace common Greek letters for micro (μ, µ) with standard 'u'
  cleanInput = cleanInput.replace(/[μµ]/g, 'u');

  // 1. Strip the trailing unit if present (case-insensitive)
  let strippedInput = cleanInput;
  if (unitType === 'resistance') {
    strippedInput = cleanInput.replace(/(ohms?|Ω)$/i, '').trim();
    if (strippedInput.match(/\d[rR]$/)) {
      strippedInput = strippedInput.slice(0, -1).trim();
    }
  } else if (unitType === 'capacitance') {
    strippedInput = cleanInput.replace(/(farads?|f)$/i, '').trim();
  } else if (unitType === 'voltage') {
    strippedInput = cleanInput.replace(/(volts?|v|vdc|vac)$/i, '').trim();
  } else if (unitType === 'current') {
    strippedInput = cleanInput.replace(/(amperes?|amps?|a)$/i, '').trim();
  } else if (unitType === 'inductance') {
    strippedInput = cleanInput.replace(/(henrys?|h)$/i, '').trim();
  } else if (unitType === 'power') {
    strippedInput = cleanInput.replace(/(watts?|w)$/i, '').trim();
  } else if (unitType === 'frequency') {
    strippedInput = cleanInput.replace(/(hertz|hz)$/i, '').trim();
  }

  // 2. Check for fractional notation (e.g. "1/4 W", "1/8W", "1/2")
  const fractionRegex = /^(\d+)\/(\d+)\s*([a-zA-Z]*)$/;
  const fractionMatch = strippedInput.replace(/\s+/g, ' ').match(fractionRegex);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    const suffix = fractionMatch[3];
    if (den !== 0) {
      const rawNum = num / den;
      let multiplier = 1;
      if (suffix) {
        // Case-sensitive check first for 'm' and 'M'
        if (suffix === 'm') multiplier = 1e-3;
        else if (suffix === 'M') multiplier = 1e6;
        else {
          const lowerSuffix = suffix.toLowerCase();
          const mult = MULTIPLIERS_CASE_INSENSITIVE[lowerSuffix];
          if (mult !== undefined) multiplier = mult;
        }
      }
      const baseValue = cleanFloat(rawNum * multiplier);
      return {
        value: baseValue,
        unit: baseUnit,
        display: formatDisplay(baseValue, unitType),
      };
    }
  }

  // 3. Check for middle-multiplier notation in the stripped input
  // e.g. "4k7", "0R1", "2n2", "3v3", "R22", "4u7"
  const middleMultRegex = /^(\d*)([rRkKmMuUnNpPvVaAhHwWzZ])(\d+)$/;
  const middleMatch = strippedInput.replace(/\s+/g, '').match(middleMultRegex);

  if (middleMatch) {
    const wholeStr = middleMatch[1];
    const multChar = middleMatch[2];
    const fracStr = middleMatch[3];

    const whole = wholeStr ? parseInt(wholeStr, 10) : 0;
    const fraction = parseInt(fracStr, 10);
    const divisor = Math.pow(10, fracStr.length);

    const multiplier = MIDDLE_MULTIPLIERS[multChar];
    if (multiplier !== undefined) {
      const baseValue = cleanFloat((whole + fraction / divisor) * multiplier);
      return {
        value: baseValue,
        unit: baseUnit,
        display: formatDisplay(baseValue, unitType),
      };
    }
  }

  // 4. Standard notation: <number> <suffix>
  // e.g. "10n", "0.01", "100 milli"
  const standardRegex = /^([0-9.-]+)\s*([a-zA-Z]*)$/;
  const standardMatch = strippedInput.match(standardRegex);

  if (standardMatch) {
    const numStr = standardMatch[1];
    const suffix = standardMatch[2];

    const rawNum = parseFloat(numStr);
    if (isNaN(rawNum)) return null;

    let multiplier = 1;
    if (suffix) {
      // Case-sensitive check first for 'm' (milli) and 'M' (Mega)
      if (suffix === 'm') {
        multiplier = 1e-3;
      } else if (suffix === 'M') {
        multiplier = 1e6;
      } else {
        // Case-insensitive check
        const lowerSuffix = suffix.toLowerCase();
        const mult = MULTIPLIERS_CASE_INSENSITIVE[lowerSuffix];
        if (mult !== undefined) {
          multiplier = mult;
        } else {
          // Unrecognized suffix
          return null;
        }
      }
    }

    const baseValue = cleanFloat(rawNum * multiplier);
    return {
      value: baseValue,
      unit: baseUnit,
      display: formatDisplay(baseValue, unitType),
    };
  }

  return null;
}
