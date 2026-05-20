import type { OrderIntent } from './types.ts'

/**
 * Maps UI ladder column click to intent in hedge vs one-way mode.
 * Hedge: order-right → OPEN_LONG only; order-left → OPEN_SHORT only (not close).
 */
export function ladderClickToIntent(
  hedgeMode: boolean,
  column: 'order-left' | 'order-right',
  closeMode: boolean,
): OrderIntent {
  if (closeMode) {
    return column === 'order-right' ? 'CLOSE_LONG' : 'CLOSE_SHORT'
  }
  if (hedgeMode) {
    return column === 'order-right' ? 'OPEN_LONG' : 'OPEN_SHORT'
  }
  return column === 'order-right' ? 'OPEN_LONG' : 'OPEN_SHORT'
}

/** One-way sell on book is open short OR close long depending on position — not in core prep default path. */
export function oneWaySellIsNotAlwaysClose(): true {
  return true
}
