export function accumulate(monthlyPct: number[]) {
  return monthlyPct.reduce((factor, pct) => factor * (1 + pct / 100), 1);
}

export function purchasingPower(amount: number, factor: number) {
  return factor > 0 ? amount / factor : amount;
}

export function btcValueToday(amountBrl: number, btcBrlThen: number, btcBrlNow: number) {
  return btcBrlThen > 0 ? (amountBrl / btcBrlThen) * btcBrlNow : 0;
}

export function parseSgs(rows: { data: string; valor: string }[]) {
  return rows.map(row => Number(row.valor.replace(',', '.'))).filter(Number.isFinite);
}

export const TROY_OUNCE_G = 31.1034768;

export function gramPrice(paxgPerOunce: number) {
  return paxgPerOunce > 0 ? paxgPerOunce / TROY_OUNCE_G : 0;
}