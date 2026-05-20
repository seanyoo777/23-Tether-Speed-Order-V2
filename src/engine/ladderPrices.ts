import type { SymbolConfig } from '../types/productTypes.ts'

const LADDER_ROWS = 31
const HALF = 15

export type LadderRow = {
  price: number
  isCurrent: boolean
  index: number
}

export function buildLadderRows(
  lastPrice: number,
  cfg: SymbolConfig,
  pinned: boolean,
  pinnedCenter?: number,
): LadderRow[] {
  const center = pinned && pinnedCenter !== undefined ? pinnedCenter : lastPrice
  const tick = cfg.tick
  const mid = Math.round(center / tick) * tick
  const rows: LadderRow[] = []
  for (let i = HALF; i >= 1; i--) {
    rows.push({
      price: roundPrice(mid + i * tick, tick),
      isCurrent: false,
      index: HALF - i,
    })
  }
  rows.push({ price: mid, isCurrent: true, index: HALF })
  for (let i = 1; i <= HALF; i++) {
    rows.push({
      price: roundPrice(mid - i * tick, tick),
      isCurrent: false,
      index: HALF + i,
    })
  }
  if (rows.length !== LADDER_ROWS) {
    while (rows.length < LADDER_ROWS) {
      rows.push({ price: mid, isCurrent: false, index: rows.length })
    }
    while (rows.length > LADDER_ROWS) rows.pop()
  }
  return rows
}

function roundPrice(price: number, tick: number): number {
  const decimals = tick >= 1 ? 2 : tick >= 0.1 ? 2 : 4
  return Number(price.toFixed(decimals))
}
