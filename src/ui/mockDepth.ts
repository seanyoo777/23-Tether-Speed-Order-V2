/** Deterministic mock bid/ask depth — UI only, no engine. */

function hash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function mockDepthQty(
  symbol: string,
  price: number,
  rowIndex: number,
  lastPrice: number,
  side: 'ask' | 'bid',
): number {
  const symSeed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0)
  const seed =
    symSeed * 17 +
    Math.round(price * 1000) +
    rowIndex * 31 +
    Math.round(lastPrice * 10) +
    (side === 'ask' ? 7 : 13)
  const r = hash(seed)
  const base = 0.08 + r * 0.42
  const taper = 1 - Math.min(rowIndex, 15) * 0.028
  return Number((base * taper).toFixed(3))
}
