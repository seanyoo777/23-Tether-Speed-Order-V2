import { describe, expect, it } from 'vitest'
import { createTradingSession } from '../engine/tradingSession.ts'
import {
  inferProtectionKindAtPrice,
  pendingProtectionLabels,
} from '../engine/protectionBook.ts'
import { COIN_SYMBOL_CONFIG } from '../types/productTypes.ts'

const PRICE = COIN_SYMBOL_CONFIG.BTCUSDT.basePrice

describe('protectionBook', () => {
  it('SHORT: below avg = TP, above = SL', () => {
    expect(inferProtectionKindAtPrice('SHORT', PRICE, PRICE - 10)).toBe(
      'PROTECTION_TP',
    )
    expect(inferProtectionKindAtPrice('SHORT', PRICE, PRICE + 10)).toBe(
      'PROTECTION_SL',
    )
  })

  it('LONG: above avg = TP, below = SL', () => {
    expect(inferProtectionKindAtPrice('LONG', PRICE, PRICE + 10)).toBe(
      'PROTECTION_TP',
    )
    expect(inferProtectionKindAtPrice('LONG', PRICE, PRICE - 10)).toBe(
      'PROTECTION_SL',
    )
  })

  it('registerProtectionAtBook shows TP/SL on pending', () => {
    const s = createTradingSession()
    s.setHedgeMode(true)
    s.placeHedgeExchangeOrder('sell', PRICE)
    const pos = s.getPositions().find((p) => p.side === 'SHORT')!
    s.setSelectedPositionId(pos.positionId)
    const tp = s.registerProtectionAtBook(pos.positionId, PRICE - 20)
    const sl = s.registerProtectionAtBook(pos.positionId, PRICE + 20)
    expect(tp.ok && tp.kind).toBe('PROTECTION_TP')
    expect(sl.ok && sl.kind).toBe('PROTECTION_SL')
    const pending = s
      .getPendingOrders()
      .filter((o) => o.positionId === pos.positionId)
    expect(pending).toHaveLength(2)
  })

  it('symbol change keeps TP/SL on position (not cancelled)', () => {
    const s = createTradingSession()
    s.setHedgeMode(true)
    s.placeHedgeExchangeOrder('sell', PRICE)
    const pos = s.getPositions().find((p) => p.symbol === 'BTCUSDT')!
    s.setSelectedPositionId(pos.positionId)
    s.registerProtectionAtBook(pos.positionId, PRICE - 20)
    s.registerProtectionAtBook(pos.positionId, PRICE + 20)
    s.setSymbol('ETHUSDT')
    s.setSelectedPositionId(null)
    const still = s
      .getPendingOrders()
      .filter((o) => o.positionId === pos.positionId && o.status === 'pending')
    expect(still).toHaveLength(2)
    expect(pendingProtectionLabels(s.getPendingOrders(), pos.positionId)).toBe(
      'TP·SL',
    )
  })

  it('OCO: one protection trigger cancels sibling', () => {
    const s = createTradingSession()
    s.setLadderDirection('buy')
    s.placeLadderOrder('order-right', PRICE)
    const pos = s.getPositions()[0]!
    s.registerProtectionAtBook(pos.positionId, PRICE + 50)
    s.registerProtectionAtBook(pos.positionId, PRICE - 50)
    expect(
      s.getPendingOrders().filter((o) => o.positionId === pos.positionId)
        .length,
    ).toBe(2)
    s.manualTick('BTCUSDT', PRICE + 50)
    expect(
      s.getPendingOrders().filter(
        (o) => o.positionId === pos.positionId && o.status === 'pending',
      ).length,
    ).toBe(0)
  })
})
