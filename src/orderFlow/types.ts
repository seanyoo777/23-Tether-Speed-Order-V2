import type {
  LadderOrderColumn,
  LiquidityRole,
  PositionSide,
} from '../types/tradingTypes.ts'

export type { LiquidityRole }

export type LatencyMode = 'instant' | 'normal' | 'slow' | 'volatile'

export type FlowVisualTag =
  | 'none'
  | 'partial'
  | 'sweep'
  | 'vacuum'
  | 'stop_hunt'
  | 'fake_breakout'
  | 'liq_cascade'
  | 'cancel_race'
  | 'high_vol'

export type FillSlice = {
  qty: number
  fillPrice: number
  liquidityRole: LiquidityRole
  slippageTicks: number
  delayMs: number
  queuePriority: number
}

export type LadderFillPlan = {
  symbol: string
  column: LadderOrderColumn
  side: PositionSide
  limitPrice: number
  totalQty: number
  slices: FillSlice[]
  visualTag: FlowVisualTag
}

export type FlowVisualState = {
  tag: FlowVisualTag
  message: string
  liquidityRole: LiquidityRole | null
  slippageTicks: number
  partialPct: number
  until: number
}

export type OrderFlowPrefs = {
  enabled: boolean
  latencyMode: LatencyMode
}
