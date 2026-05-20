export type DepthVisualMode = 'normal' | 'volatile' | 'ultra-dom'

export type AggressiveSide = 'buy' | 'sell' | 'neutral'

export type LadderRowInput = {
  index: number
  price: number
  isCurrent: boolean
}

export type RowDepthVisual = {
  price: number
  index: number
  askQty: number
  bidQty: number
  askPressure: number
  bidPressure: number
  askCumPct: number
  bidCumPct: number
  askIceberg: boolean
  bidIceberg: boolean
  askWall: boolean
  bidWall: boolean
  volumePulse: number
}

export type DepthBookVisual = {
  mode: DepthVisualMode
  spread: number
  spreadCompressed: boolean
  spreadFlash: boolean
  velocity: number
  aggressiveSide: AggressiveSide
  panicMode: boolean
  rows: Map<number, RowDepthVisual>
  byPrice: (price: number, tick: number) => RowDepthVisual | undefined
}
