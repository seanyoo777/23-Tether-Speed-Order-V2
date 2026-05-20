import type { MockOnlyTagged } from '../contracts/mockOnly.ts'
import type { OrderIntent } from '../orderIntent/types.ts'
import type { HedgeSide } from '../orderIntent/types.ts'

export type ConditionalSource = 'orderbook' | 'manual'

export type ConditionalDirection = 'up' | 'down' | 'both'

export type ConditionalOrder = {
  id: string
  symbol: string
  triggerPrice: number
  direction: ConditionalDirection
  intent: OrderIntent
  hedgeSide: HedgeSide
  reduceOnly: boolean
  source: ConditionalSource
  locked: boolean
  createdAt: number
} & MockOnlyTagged
