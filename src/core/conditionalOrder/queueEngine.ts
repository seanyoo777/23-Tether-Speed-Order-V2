import { tagMockOnly } from '../contracts/mockOnly.ts'
import type { HedgeSide } from '../orderIntent/types.ts'
import type { OrderIntent } from '../orderIntent/types.ts'
import { registerTriggerAtClick, relockTriggerPrice, followMarketPrice } from './triggerLock.ts'
import type { ConditionalOrder, ConditionalSource } from './types.ts'

let seq = 0

export function createConditionalOrderQueue() {
  const orders = new Map<string, ConditionalOrder>()

  function register(input: {
    symbol: string
    clickPrice: number
    intent: OrderIntent
    hedgeSide: HedgeSide
    reduceOnly: boolean
    source?: ConditionalSource
  }): ConditionalOrder {
    const base = tagMockOnly({
      id: `cond-${++seq}`,
      symbol: input.symbol,
      triggerPrice: input.clickPrice,
      direction: 'both' as const,
      intent: input.intent,
      hedgeSide: input.hedgeSide,
      reduceOnly: input.reduceOnly,
      source: input.source ?? 'orderbook',
      locked: true,
      createdAt: Date.now(),
    })
    const order = registerTriggerAtClick(base, input.clickPrice)
    orders.set(order.id, order)
    return order
  }

  function updateTrigger(
    id: string,
    nextPrice: number,
    source: ConditionalSource,
  ): ConditionalOrder | undefined {
    const cur = orders.get(id)
    if (!cur) return undefined
    const next = relockTriggerPrice(cur, nextPrice, source)
    orders.set(id, next)
    return next
  }

  function onMarketTick(_symbol: string, _lastPrice: number): void {
    for (const o of orders.values()) {
      if (o.locked) {
        try {
          followMarketPrice(o, _lastPrice)
        } catch {
          /* expected — auto-follow forbidden */
        }
      }
    }
  }

  function list(symbol?: string): ConditionalOrder[] {
    const all = [...orders.values()]
    return symbol ? all.filter((o) => o.symbol === symbol) : all
  }

  function cancel(id: string): boolean {
    return orders.delete(id)
  }

  return { register, updateTrigger, onMarketTick, list, cancel }
}

export type ConditionalOrderQueue = ReturnType<typeof createConditionalOrderQueue>
