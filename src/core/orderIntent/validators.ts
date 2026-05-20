import type { SymbolSpec } from '../symbolSpec/types.ts'
import type { HedgeSide, OrderIntent, OrderIntentMeta } from './types.ts'

export const ALL_ORDER_INTENTS: readonly OrderIntent[] = [
  'OPEN_LONG',
  'OPEN_SHORT',
  'CLOSE_LONG',
  'CLOSE_SHORT',
  'MIT_OPEN_LONG',
  'MIT_OPEN_SHORT',
  'MIT_CLOSE_LONG',
  'MIT_CLOSE_SHORT',
  'STOP_LOSS_LONG',
  'STOP_LOSS_SHORT',
  'TAKE_PROFIT_LONG',
  'TAKE_PROFIT_SHORT',
] as const

export function isCloseIntent(intent: OrderIntent): boolean {
  return (
    intent.startsWith('CLOSE_') ||
    intent.startsWith('MIT_CLOSE_') ||
    intent.startsWith('STOP_LOSS_') ||
    intent.startsWith('TAKE_PROFIT_')
  )
}

export function isMitIntent(intent: OrderIntent): boolean {
  return intent.startsWith('MIT_')
}

export function isOpenIntent(intent: OrderIntent): boolean {
  return intent.startsWith('OPEN_') || intent.startsWith('MIT_OPEN_')
}

export function hedgeSideFromIntent(intent: OrderIntent): HedgeSide {
  return intent.endsWith('_LONG') || intent.includes('_LONG') ? 'LONG' : 'SHORT'
}

export function describeIntent(intent: OrderIntent): OrderIntentMeta {
  const hedgeSide = hedgeSideFromIntent(intent)
  const reduceOnly = isCloseIntent(intent)
  const isOpen = isOpenIntent(intent)
  return { intent, reduceOnly, hedgeSide, isOpen }
}

/** Hedge: sell is NOT close — only CLOSE_* intents reduce legs. */
export function assertHedgeIntentSeparation(
  intent: OrderIntent,
  hedgeMode: boolean,
): void {
  if (!hedgeMode) return
  if (intent === 'OPEN_LONG' || intent === 'OPEN_SHORT') return
  if (isCloseIntent(intent)) return
  if (isMitIntent(intent) || intent.startsWith('STOP_') || intent.startsWith('TAKE_')) return
  throw new Error(`Invalid hedge intent: ${intent}`)
}

export function filterIntentsForSpec(
  intents: readonly OrderIntent[],
  spec: SymbolSpec,
): OrderIntent[] {
  return intents.filter((intent) => {
    if (!spec.shortEnabled && intent.includes('SHORT')) {
      if (intent.startsWith('OPEN_SHORT') || intent.startsWith('MIT_OPEN_SHORT')) return false
    }
    if (!spec.mitEnabled && isMitIntent(intent)) return false
    if (!spec.stopEnabled && (intent.startsWith('STOP_') || intent.startsWith('TAKE_'))) {
      return false
    }
    if (!spec.hedgeEnabled && isCloseIntent(intent) && intent.startsWith('MIT_CLOSE')) {
      return false
    }
    return true
  })
}
