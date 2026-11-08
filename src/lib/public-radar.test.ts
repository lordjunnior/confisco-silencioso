import { describe, expect, it } from 'vitest';
import { accumulate, btcValueToday, gramPrice, parseSgs, purchasingPower } from './public-radar';

describe('Confisco Silencioso calculations', () => {
  it('compounds monthly inflation rather than adding percentages', () => {
    expect(accumulate([10, 10])).toBeCloseTo(1.21);
    expect(purchasingPower(121, 1.21)).toBeCloseTo(100);
  });

  it('converts a historical BRL amount into current Bitcoin value', () => {
    expect(btcValueToday(1000, 100_000, 200_000)).toBe(2000);
    expect(btcValueToday(1000, 0, 200_000)).toBe(0);
  });

  it('parses Banco Central decimal values', () => {
    expect(parseSgs([{ data: '01/01/2020', valor: '1,25' }, { data: '02/01/2020', valor: 'x' }])).toEqual([1.25]);
  });

  it('converts PAX Gold ounce price to gram price', () => {
    expect(gramPrice(3110.34768)).toBeCloseTo(100);
    expect(gramPrice(0)).toBe(0);
  });
});