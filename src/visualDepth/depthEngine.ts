import { mockDepthQty } from '../ui/mockDepth.ts'
import type {
  AggressiveSide,
  DepthBookVisual,
  DepthVisualMode,
  LadderRowInput,
  RowDepthVisual,
} from './types.ts'

function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function symSeed(symbol: string): number {
  return [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0)
}

export function isIcebergMock(
  symbol: string,
  price: number,
  side: 'ask' | 'bid',
  qty: number,
): boolean {
  if (qty < 0.12) return false
  const seed = symSeed(symbol) + Math.round(price * 100) + (side === 'ask' ? 3 : 9)
  return hash01(seed) > 0.88
}

export function computeVelocity(
  lastPrice: number,
  version: number,
  tick: number,
): number {
  const v = (hash01(version * 17 + Math.round(lastPrice)) * 0.8 + 0.2) * 120
  return Math.round(v + (tick < 1 ? 40 : 10))
}

export function buildDepthBookVisual(input: {
  symbol: string
  lastPrice: number
  tick: number
  rows: readonly LadderRowInput[]
  /** Array index of current row in `rows` (from findIndex). */
  midIndex: number
  tickDirection: 'up' | 'down' | 'flat'
  version: number
  mode: DepthVisualMode
}): DepthBookVisual {
  const { symbol, lastPrice, tick, rows, midIndex, tickDirection, version, mode } =
    input

  const midRow = rows[midIndex]
  const midRowIndex = midRow?.index ?? midIndex

  const rowData: {
    row: LadderRowInput
    dist: number
    askQty: number
    bidQty: number
  }[] = []

  let maxAsk = 0
  let maxBid = 0
  let bestAsk = Infinity
  let bestBid = -Infinity

  for (const row of rows) {
    const aboveMid = row.index < midRowIndex
    const belowMid = row.index > midRowIndex
    const dist = Math.abs(row.index - midRowIndex)
    const askQty = aboveMid
      ? mockDepthQty(symbol, row.price, dist, lastPrice, 'ask')
      : 0
    const bidQty = belowMid
      ? mockDepthQty(symbol, row.price, dist, lastPrice, 'bid')
      : 0
    if (askQty > 0) {
      maxAsk = Math.max(maxAsk, askQty)
      bestAsk = Math.min(bestAsk, row.price)
    }
    if (bidQty > 0) {
      maxBid = Math.max(maxBid, bidQty)
      bestBid = Math.max(bestBid, row.price)
    }
    rowData.push({ row, dist, askQty, bidQty })
  }

  const spread =
    bestAsk !== Infinity && bestBid !== -Infinity
      ? Math.max(tick, bestAsk - bestBid)
      : tick
  const spreadCompressed = spread <= tick * 2.5
  const spreadFlash = spreadCompressed && hash01(version + symSeed(symbol)) > 0.55

  let askCum = 0
  let bidCum = 0
  const askCums: number[] = []
  const bidCums: number[] = []

  for (let i = 0; i < rowData.length; i++) {
    askCum += rowData[i]!.askQty
    askCums.push(askCum)
  }
  for (let i = rowData.length - 1; i >= 0; i--) {
    bidCum += rowData[i]!.bidQty
    bidCums.unshift(bidCum)
  }

  const maxAskCum = askCum || 1
  const maxBidCum = bidCum || 1
  const wallThreshold = mode === 'ultra-dom' ? 0.28 : 0.38

  const aggressiveSide: AggressiveSide =
    tickDirection === 'up'
      ? 'buy'
      : tickDirection === 'down'
        ? 'sell'
        : 'neutral'

  const velocity = computeVelocity(lastPrice, version, tick)
  const panicMode = mode === 'volatile' || velocity > 140

  const map = new Map<number, RowDepthVisual>()

  for (let i = 0; i < rowData.length; i++) {
    const { row, askQty, bidQty } = rowData[i]!
    const askPressure = maxAsk > 0 ? askQty / maxAsk : 0
    const bidPressure = maxBid > 0 ? bidQty / maxBid : 0
    const pulseSeed = version + row.index * 7 + Math.round(row.price)
    const volumePulse = 0.35 + hash01(pulseSeed) * 0.65

    const visual: RowDepthVisual = {
      price: row.price,
      index: row.index,
      askQty,
      bidQty,
      askPressure,
      bidPressure,
      askCumPct: (askCums[i]! / maxAskCum) * 100,
      bidCumPct: (bidCums[i]! / maxBidCum) * 100,
      askIceberg: isIcebergMock(symbol, row.price, 'ask', askQty),
      bidIceberg: isIcebergMock(symbol, row.price, 'bid', bidQty),
      askWall: maxAsk > 0 && askQty >= maxAsk * wallThreshold,
      bidWall: maxBid > 0 && bidQty >= maxBid * wallThreshold,
      volumePulse,
    }
    map.set(row.index, visual)
  }

  const byPrice = (price: number, t: number) => {
    for (const v of map.values()) {
      if (Math.abs(v.price - price) <= t * 0.51) return v
    }
    return undefined
  }

  return {
    mode,
    spread,
    spreadCompressed,
    spreadFlash,
    velocity,
    aggressiveSide,
    panicMode,
    rows: map,
    byPrice,
  }
}
