import { describe, it, expect } from 'vitest';
import { normalizeValue } from '../../packages/search/normalization';

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
      expect(normalizeValue('2.2  nF', 'capacitance')).toEqual({
        value: 2.2e-9,
        unit: 'F',
        display: '2.2 nF',
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
      expect(normalizeValue('68p', 'capacitance')).toEqual({
        value: 68e-12,
        unit: 'F',
        display: '68 pF',
      });
    });

    it('should handle extreme values', () => {
      expect(normalizeValue('1F', 'capacitance')).toEqual({
        value: 1,
        unit: 'F',
        display: '1 F',
      });
      expect(normalizeValue('0.1pF', 'capacitance')).toEqual({
        value: 1e-13,
        unit: 'F',
        display: '0.1 pF',
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

    it('should handle trailing R notation', () => {
      expect(normalizeValue('10R', 'resistance')).toEqual({
        value: 10,
        unit: 'Ω',
        display: '10 Ω',
      });
      expect(normalizeValue('0.5R', 'resistance')).toEqual({
        value: 0.5,
        unit: 'Ω',
        display: '500 mΩ',
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
