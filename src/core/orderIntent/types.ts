/** Explicit order meaning — never overload sell as close in hedge mode. */
export type OrderIntent =
  | 'OPEN_LONG'
  | 'OPEN_SHORT'
  | 'CLOSE_LONG'
  | 'CLOSE_SHORT'
  | 'MIT_OPEN_LONG'
  | 'MIT_OPEN_SHORT'
  | 'MIT_CLOSE_LONG'
  | 'MIT_CLOSE_SHORT'
  | 'STOP_LOSS_LONG'
  | 'STOP_LOSS_SHORT'
  | 'TAKE_PROFIT_LONG'
  | 'TAKE_PROFIT_SHORT'

export type HedgeSide = 'LONG' | 'SHORT'

export type OrderIntentMeta = {
  intent: OrderIntent
  reduceOnly: boolean
  hedgeSide: HedgeSide
  /** Hedge mode: buy column maps to LONG open, not close */
  isOpen: boolean
}
