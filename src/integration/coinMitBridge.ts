/**
 * Engine MIT order id ↔ core conditional queue sync (mock only).
 */
import { createConditionalOrderQueue } from '../core/conditionalOrder/queueEngine.ts'
import type { OrderIntent } from '../core/orderIntent/types.ts'
import { describeIntent, isMitIntent } from '../core/orderIntent/validators.ts'
import { isProductBridgeReady } from './symbolConfigBridge.ts'
import { roundMitTriggerPrice } from './ladderMitBridge.ts'
import type { ProductType } from '../types/productTypes.ts'

const queues = new Map<string, ReturnType<typeof createConditionalOrderQueue>>()
/** engine orderStore id → core queue row id */
const engineToCore = new Map<string, string>()

function queueForSymbol(symbol: string) {
  let q = queues.get(symbol)
  if (!q) {
    q = createConditionalOrderQueue()
    queues.set(symbol, q)
  }
  return q
}

export function linkEngineMitOrder(engineOrderId: string, coreOrderId: string): void {
  engineToCore.set(engineOrderId, coreOrderId)
}

export function unlinkEngineMitOrder(engineOrderId: string): void {
  engineToCore.delete(engineOrderId)
}

export function registerCoinMitOnBook(params: {
  product: ProductType
  symbol: string
  clickPrice: number
  intent: OrderIntent
  engineOrderId?: string
}): { ok: true; orderId: string; lockedPrice: number } | { ok: false; message: string } {
  if (!isProductBridgeReady(params.product, params.symbol)) {
    return { ok: false, message: '코인 코어 브리지 미준비' }
  }
  const meta = describeIntent(params.intent)
  if (!isMitIntent(params.intent)) {
    return { ok: false, message: 'MIT intent 아님' }
  }
  const locked = roundMitTriggerPrice(
    params.product,
    params.symbol,
    params.clickPrice,
  )
  const row = queueForSymbol(params.symbol).register({
    symbol: params.symbol,
    clickPrice: locked,
    intent: params.intent,
    hedgeSide: meta.hedgeSide,
    reduceOnly: meta.reduceOnly,
  })
  if (params.engineOrderId) {
    linkEngineMitOrder(params.engineOrderId, row.id)
  }
  return { ok: true, orderId: row.id, lockedPrice: row.triggerPrice }
}

export function relockCoinMitByEngineOrder(params: {
  product: ProductType
  symbol: string
  engineOrderId: string
  nextPrice: number
}): boolean {
  if (!isProductBridgeReady(params.product, params.symbol)) return false
  const coreId = engineToCore.get(params.engineOrderId)
  if (!coreId) return false
  const locked = roundMitTriggerPrice(
    params.product,
    params.symbol,
    params.nextPrice,
  )
  const updated = queueForSymbol(params.symbol).updateTrigger(
    coreId,
    locked,
    'manual',
  )
  return updated !== undefined && updated.triggerPrice === locked
}

export function cancelCoinMitByEngineOrder(
  symbol: string,
  engineOrderId: string,
): boolean {
  const coreId = engineToCore.get(engineOrderId)
  if (!coreId) return false
  const ok = queueForSymbol(symbol).cancel(coreId)
  if (ok) unlinkEngineMitOrder(engineOrderId)
  return ok
}

export function getCoreMitTriggerForEngine(
  symbol: string,
  engineOrderId: string,
): number | undefined {
  const coreId = engineToCore.get(engineOrderId)
  if (!coreId) return undefined
  return queueForSymbol(symbol)
    .list(symbol)
    .find((o) => o.id === coreId)?.triggerPrice
}

export function listCoinMitQueue(symbol: string) {
  return queueForSymbol(symbol).list(symbol)
}

export function clearCoinMitQueuesForTests(): void {
  queues.clear()
  engineToCore.clear()
}
