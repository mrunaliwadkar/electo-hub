import { describe, it, expect } from 'vitest';
import { normalizeValue } from './normalization';

describe('Unit Normalization Engine', () => {
  describe('Capacitance', () => {
    it('should parse standard units', () => {
      expect(normalizeValue('10nF', 'capacitance')).toEqual({
        value: 10e-9,
        unit: 'F',
        display: '10 nF',
      });
      expect(normalizeValue('0.01uF', 'capacitance')).toEqual({
        value: 1e-8,
        unit: 'F',
        display: '10 nF',
      });
      expect(normalizeValue('10000pF', 'capacitance')).toEqual({
        value: 1e-8,
        unit: 'F',
        display: '10 nF',
      });
    });

    it('should parse spaces and case variations', () => {
      expect(normalizeValue('10 uF', 'capacitance')).toEqual({
        value: 1e-5,
        unit: 'F',
        display: '10 uF',
      });
      expect(normalizeValue('10 µF', 'capacitance')).toEqual({
        value: 1e-5,
        unit: 'F',
        display: '10 uF',
      });
      expect(normalizeValue('10 microfarad', 'capacitance')).toEqual({
        value: 1e-5,
        unit: 'F',
        display: '10 uF',
      });
    });

    it('should parse middle-multiplier notation', () => {
      expect(normalizeValue('2n2', 'capacitance')).toEqual({
        value: 2.2e-9,
        unit: 'F',
        display: '2.2 nF',
      });
      expect(normalizeValue('4u7', 'capacitance')).toEqual({
        value: 4.7e-6,
        unit: 'F',
        display: '4.7 uF',
      });
    });
  });

  describe('Resistance', () => {
    it('should parse standard units', () => {
      expect(normalizeValue('10M', 'resistance')).toEqual({
        value: 10e6,
        unit: 'Ω',
        display: '10 MΩ',
      });
      expect(normalizeValue('4.7k', 'resistance')).toEqual({
        value: 4700,
        unit: 'Ω',
        display: '4.7 kΩ',
      });
      expect(normalizeValue('100 milliohm', 'resistance')).toEqual({
        value: 0.1,
        unit: 'Ω',
        display: '100 mΩ',
      });
    });

    it('should distinguish case for milli and mega', () => {
      expect(normalizeValue('10m', 'resistance')).toEqual({
        value: 0.01,
        unit: 'Ω',
        display: '10 mΩ',
      });
      expect(normalizeValue('10M', 'resistance')).toEqual({
        value: 10e6,
        unit: 'Ω',
        display: '10 MΩ',
      });
    });

    it('should parse middle-multiplier notation', () => {
      expect(normalizeValue('4k7', 'resistance')).toEqual({
        value: 4700,
        unit: 'Ω',
        display: '4.7 kΩ',
      });
      expect(normalizeValue('0R1', 'resistance')).toEqual({
        value: 0.1,
        unit: 'Ω',
        display: '100 mΩ',
      });
      expect(normalizeValue('R22', 'resistance')).toEqual({
        value: 0.22,
        unit: 'Ω',
        display: '220 mΩ',
      });
      expect(normalizeValue('1M2', 'resistance')).toEqual({
        value: 1.2e6,
        unit: 'Ω',
        display: '1.2 MΩ',
      });
    });
  });

  describe('Voltage', () => {
    it('should parse voltage values', () => {
      expect(normalizeValue('5V', 'voltage')).toEqual({
        value: 5,
        unit: 'V',
        display: '5 V',
      });
      expect(normalizeValue('3.3V', 'voltage')).toEqual({
        value: 3.3,
        unit: 'V',
        display: '3.3 V',
      });
      expect(normalizeValue('500mV', 'voltage')).toEqual({
        value: 0.5,
        unit: 'V',
        display: '500 mV',
      });
      expect(normalizeValue('12VDC', 'voltage')).toEqual({
        value: 12,
        unit: 'V',
        display: '12 V',
      });
      expect(normalizeValue('3v3', 'voltage')).toEqual({
        value: 3.3,
        unit: 'V',
        display: '3.3 V',
      });
    });
  });

  describe('Current', () => {
    it('should parse current values', () => {
      expect(normalizeValue('1.2A', 'current')).toEqual({
        value: 1.2,
        unit: 'A',
        display: '1.2 A',
      });
      expect(normalizeValue('500mA', 'current')).toEqual({
        value: 0.5,
        unit: 'A',
        display: '500 mA',
      });
      expect(normalizeValue('10uA', 'current')).toEqual({
        value: 10e-6,
        unit: 'A',
        display: '10 uA',
      });
    });
  });

  describe('Inductance', () => {
    it('should parse inductance values', () => {
      expect(normalizeValue('10uH', 'inductance')).toEqual({
        value: 10e-6,
        unit: 'H',
        display: '10 uH',
      });
      expect(normalizeValue('1mH', 'inductance')).toEqual({
        value: 1e-3,
        unit: 'H',
        display: '1 mH',
      });
      expect(normalizeValue('4u7', 'inductance')).toEqual({
        value: 4.7e-6,
        unit: 'H',
        display: '4.7 uH',
      });
    });
  });

  describe('Power', () => {
    it('should parse standard units', () => {
      expect(normalizeValue('5W', 'power')).toEqual({
        value: 5,
        unit: 'W',
        display: '5 W',
      });
      expect(normalizeValue('100 mW', 'power')).toEqual({
        value: 0.1,
        unit: 'W',
        display: '100 mW',
      });
      expect(normalizeValue('10 uW', 'power')).toEqual({
        value: 10e-6,
        unit: 'W',
        display: '10 uW',
      });
    });

    it('should parse fractional values', () => {
      expect(normalizeValue('1/4 W', 'power')).toEqual({
        value: 0.25,
        unit: 'W',
        display: '250 mW',
      });
      expect(normalizeValue('1/8W', 'power')).toEqual({
        value: 0.125,
        unit: 'W',
        display: '125 mW',
      });
      expect(normalizeValue('1/2 W', 'power')).toEqual({
        value: 0.5,
        unit: 'W',
        display: '500 mW',
      });
    });
  });

  describe('Frequency', () => {
    it('should parse frequency values', () => {
      expect(normalizeValue('16MHz', 'frequency')).toEqual({
        value: 16e6,
        unit: 'Hz',
        display: '16 MHz',
      });
      expect(normalizeValue('32.768 kHz', 'frequency')).toEqual({
        value: 32768,
        unit: 'Hz',
        display: '32.768 kHz',
      });
      expect(normalizeValue('1.2 GHz', 'frequency')).toEqual({
        value: 1.2e9,
        unit: 'Hz',
        display: '1.2 GHz',
      });
      expect(normalizeValue('100 Hz', 'frequency')).toEqual({
        value: 100,
        unit: 'Hz',
        display: '100 Hz',
      });
    });
  });

  describe('Edge Cases & Invalid inputs', () => {
    it('should return null for invalid strings', () => {
      expect(normalizeValue('abc', 'capacitance')).toBeNull();
      expect(normalizeValue('10xyz', 'resistance')).toBeNull();
      expect(normalizeValue('', 'voltage')).toBeNull();
      expect(normalizeValue(null, 'current')).toBeNull();
      expect(normalizeValue(undefined, 'inductance')).toBeNull();
    });

    it('should handle numeric inputs directly', () => {
      expect(normalizeValue(10, 'resistance')).toEqual({
        value: 10,
        unit: 'Ω',
        display: '10 Ω',
      });
      expect(normalizeValue(1e-8, 'capacitance')).toEqual({
        value: 1e-8,
        unit: 'F',
        display: '10 nF',
      });
    });
  });
});
