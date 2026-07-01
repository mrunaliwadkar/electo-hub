import { describe, it, expect } from 'vitest';
import { parseSExpr } from '../kicad-importer';
import { TokenBucket, retryWithBackoff } from '../manufacturer-importer';

describe('KiCad S-Expression Parser', () => {
  it('should parse simple flat s-expressions', () => {
    const input = '(symbol "Resistor" (in_bom yes))';
    const result = parseSExpr(input);
    
    expect(result).toEqual([
      ['symbol', 'Resistor', ['in_bom', 'yes']]
    ]);
  });

  it('should parse nested s-expressions', () => {
    const input = '(kicad_symbol_lib (version 20211014) (symbol "CAP" (pin passive (number "1"))))';
    const result = parseSExpr(input);

    expect(result).toEqual([
      [
        'kicad_symbol_lib',
        ['version', '20211014'],
        [
          'symbol',
          'CAP',
          ['pin', 'passive', ['number', '1']]
        ]
      ]
    ]);
  });

  it('should parse strings with escape characters', () => {
    const input = '(property "Description" "Precision \\"Op Amp\\" IC")';
    const result = parseSExpr(input);

    expect(result).toEqual([
      ['property', 'Description', 'Precision "Op Amp" IC']
    ]);
  });

  it('should ignore whitespace and handle multiple roots', () => {
    const input = '  (a b) \n (c d)  ';
    const result = parseSExpr(input);

    expect(result).toEqual([
      ['a', 'b'],
      ['c', 'd']
    ]);
  });
});

describe('Token Bucket Rate Limiter', () => {
  it('should consume tokens and enforce delay if empty', async () => {
    // 2 tokens max, 1 token per 50ms refill
    const bucket = new TokenBucket(2, 1 / 50);
    
    const start = Date.now();
    
    // First 2 consumes should be immediate
    await bucket.consume();
    await bucket.consume();
    const mid = Date.now();
    expect(mid - start).toBeLessThan(15); // under 15ms (immediate)

    // Third consume should wait for refill
    await bucket.consume();
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(45); // must wait at least ~50ms
  });
});

describe('Retry Handling with Exponential Backoff', () => {
  it('should execute successfully on the first try', async () => {
    let callCount = 0;
    const task = async () => {
      callCount++;
      return 'success';
    };

    const result = await retryWithBackoff(task, 3, 10);
    expect(result).toBe('success');
    expect(callCount).toBe(1);
  });

  it('should retry on failures and succeed eventually', async () => {
    let callCount = 0;
    const task = async () => {
      callCount++;
      if (callCount < 3) {
        throw new Error('temporary failure');
      }
      return 'recovered';
    };

    const result = await retryWithBackoff(task, 3, 5);
    expect(result).toBe('recovered');
    expect(callCount).toBe(3);
  });

  it('should throw error if max retries are exceeded', async () => {
    let callCount = 0;
    const task = async () => {
      callCount++;
      throw new Error('fatal error');
    };

    await expect(retryWithBackoff(task, 2, 5)).rejects.toThrow('fatal error');
    expect(callCount).toBe(3); // Initial try + 2 retries
  });
});
