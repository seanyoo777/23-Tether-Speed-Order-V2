import { getSymbolConfig } from '../types/productTypes.ts'
import { ladderColumnToSide } from '../types/tradingTypes.ts'
import type {
  FillSlice,
  FlowVisualTag,
  LadderFillPlan,
  LatencyMode,
} from './types.ts'
import type { LadderOrderColumn } from '../types/tradingTypes.ts'

function hash01(seed: number): number {
  const x = Math.sin(seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function baseLatencyMs(mode: LatencyMode): number {
  switch (mode) {
    case 'instant':
      return 0
    case 'slow':
      return 180
    case 'volatile':
      return 90
    default:
      return 45
  }
}

function slippageTicks(mode: LatencyMode, seed: number, isTaker: boolean): number {
  if (!isTaker) return 0
  const base = mode === 'volatile' ? 3 : mode === 'slow' ? 2 : 1
  return base + Math.floor(hash01(seed) * 2)
}

function pickVisualTag(mode: LatencyMode, seed: number): FlowVisualTag {
  const r = hash01(seed + 41)
  if (mode === 'volatile') {
    if (r > 0.92) return 'liq_cascade'
    if (r > 0.82) return 'high_vol'
    if (r > 0.72) return 'stop_hunt'
    if (r > 0.62) return 'fake_breakout'
    if (r > 0.52) return 'vacuum'
    if (r > 0.42) return 'sweep'
    return 'partial'
  }
  if (r > 0.88) return 'sweep'
  if (r > 0.78) return 'vacuum'
  if (r > 0.68) return 'stop_hunt'
  return 'none'
}

export function planLadderFill(input: {
  symbol: string
  column: LadderOrderColumn
  limitPrice: number
  totalQty: number
  lastPrice: number
  latencyMode: LatencyMode
  flowSeed: number
}): LadderFillPlan {
  const cfg = getSymbolConfig(input.symbol)
  const tick = cfg?.tick ?? 0.5
  const side = ladderColumnToSide(input.column)
  const tag = pickVisualTag(input.latencyMode, input.flowSeed)

  const isAggressive =
    (side === 'LONG' && input.limitPrice >= input.lastPrice - tick * 0.51) ||
    (side === 'SHORT' && input.limitPrice <= input.lastPrice + tick * 0.51)

  const role = isAggressive ? 'taker' : 'maker'
  const slip = slippageTicks(input.latencyMode, input.flowSeed, isAggressive)
  const sign = side === 'LONG' ? 1 : -1
  const slipPrice =
    input.limitPrice + sign * slip * tick

  const sliceCount =
    input.latencyMode === 'instant'
      ? 1
      : tag === 'partial' || tag === 'high_vol' || input.latencyMode === 'volatile'
        ? 3
        : hash01(input.flowSeed) > 0.65
          ? 2
          : 1

  const slices: FillSlice[] = []
  let remaining = input.totalQty
  const baseDelay = baseLatencyMs(input.latencyMode)

  for (let i = 0; i < sliceCount; i++) {
    const isLast = i === sliceCount - 1
    const portion = isLast
      ? remaining
      : Number((input.totalQty / sliceCount).toFixed(4))
    remaining -= portion
    if (portion <= 0) continue

    slices.push({
      qty: portion,
      fillPrice: slipPrice,
      liquidityRole: i === 0 ? role : 'taker',
      slippageTicks: i === 0 ? slip : slip + i,
      delayMs: baseDelay + i * (input.latencyMode === 'volatile' ? 35 : 55),
      queuePriority: 1000 + i * 10 + Math.floor(hash01(input.flowSeed + i) * 5),
    })
  }

  return {
    symbol: input.symbol,
    column: input.column,
    side,
    limitPrice: input.limitPrice,
    totalQty: input.totalQty,
    slices,
    visualTag: sliceCount > 1 && tag === 'none' ? 'partial' : tag,
  }
}

export function visualTagLabel(tag: FlowVisualTag): string {
  const labels: Record<FlowVisualTag, string> = {
    none: '',
    partial: 'PARTIAL FILL',
    sweep: 'MARKET SWEEP',
    vacuum: 'LIQUIDITY VACUUM',
    stop_hunt: 'STOP HUNT',
    fake_breakout: 'FAKE BREAKOUT',
    liq_cascade: 'LIQ CASCADE',
    cancel_race: 'CANCEL RACE',
    high_vol: 'HIGH VOL EXEC',
  }
  return labels[tag]
}
