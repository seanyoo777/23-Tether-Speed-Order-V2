import { tagMockOnly } from '../contracts/mockOnly.ts'
import type { OrderIntent } from '../orderIntent/types.ts'
import type { CoreMarketType } from '../symbolSpec/types.ts'
import type { HedgePositionBook, PositionLeg } from './types.ts'
import { productKey } from './types.ts'

export function createLegStore() {
  const books = new Map<string, HedgePositionBook>()

  function getBook(marketType: CoreMarketType, symbol: string): HedgePositionBook {
    const key = productKey(marketType, symbol)
    let book = books.get(key)
    if (!book) {
      book = tagMockOnly({
        productKey: key,
        symbol,
        longLeg: undefined,
        shortLeg: undefined,
      })
      books.set(key, book)
    }
    return book
  }

  function upsertLeg(
    marketType: CoreMarketType,
    symbol: string,
    side: 'LONG' | 'SHORT',
    patch: Partial<PositionLeg> & Pick<PositionLeg, 'qty' | 'avgPrice'>,
  ): PositionLeg {
    const book = getBook(marketType, symbol)
    const legId = patch.legId ?? `${book.productKey}:${side}`
    const leg = tagMockOnly({
      legId,
      symbol,
      marketType,
      side,
      qty: patch.qty,
      avgPrice: patch.avgPrice,
      unrealizedPnl: patch.unrealizedPnl ?? 0,
      tpPrice: patch.tpPrice,
      slPrice: patch.slPrice,
      reduceOnly: patch.reduceOnly ?? false,
      closeIntent: patch.closeIntent,
    })
    if (side === 'LONG') book.longLeg = leg
    else book.shortLeg = leg
    return leg
  }

  function applyCloseIntent(
    marketType: CoreMarketType,
    symbol: string,
    side: 'LONG' | 'SHORT',
    intent: OrderIntent,
    closeQty: number,
  ): HedgePositionBook {
    const book = getBook(marketType, symbol)
    const leg = side === 'LONG' ? book.longLeg : book.shortLeg
    if (!leg) return book
    const nextQty = Math.max(0, leg.qty - closeQty)
    const next = tagMockOnly({
      ...leg,
      qty: nextQty,
      reduceOnly: true,
      closeIntent: intent,
    })
    if (side === 'LONG') book.longLeg = nextQty > 0 ? next : undefined
    else book.shortLeg = nextQty > 0 ? next : undefined
    return book
  }

  function list(): HedgePositionBook[] {
    return [...books.values()]
  }

  /** Guard: netPosition shortcut forbidden */
  function getNetQty(_marketType: CoreMarketType, _symbol: string): never {
    throw new Error('netPosition is forbidden — use longLeg and shortLeg separately')
  }

  return { getBook, upsertLeg, applyCloseIntent, list, getNetQty }
}

export type LegStore = ReturnType<typeof createLegStore>
