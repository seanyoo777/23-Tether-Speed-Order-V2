import type { ProductType } from '../types/productTypes.ts'
import {
  DEFAULT_SHARED_ORDER_QTY,
  defaultSymbolForProduct,
  getSymbolConfig,
  isProductEngineReady,
  supportsHedgeMode,
  useHedgeLegTrading,
} from '../types/productTypes.ts'
import { allEngineTickerSymbols } from '../integration/symbolConfigBridge.ts'
import type {
  ClosePercent,
  CoinOrderEntryKind,
  LadderDirection,
  LadderOrderColumn,
} from '../types/tradingTypes.ts'
import { createAuditEngine } from './auditEngine.ts'
import { createHedgeEngine } from './hedgeEngine.ts'
import { createMockTicker } from './mockTicker.ts'
import {
  evaluateMitStopOnTick,
  registerMitOrder,
} from './mitStopEngine.ts'
import { createOrderExecution } from './orderExecution.ts'
import { createOrderStore } from './orderStore.ts'
import { sumRealized, sumUnrealized } from './pnlEngine.ts'
import { createPositionStore } from './positionStore.ts'
import {
  evaluateProtectionOnTick,
  registerProtectionForPosition,
} from './protectionEngine.ts'
import {
  cancelPendingProtectionForPosition,
  inferProtectionKindAtPrice,
} from './protectionBook.ts'
import {
  cancelCoinMitByEngineOrder,
  registerCoinMitOnBook,
  relockCoinMitByEngineOrder,
} from '../integration/coinMitBridge.ts'
import {
  describeCoinLadderIntent,
  logCoinIntentPreview,
} from '../integration/coreBridge.ts'
import { isProductBridgeReady } from '../integration/symbolConfigBridge.ts'
import { roundMitTriggerPrice } from '../integration/ladderMitBridge.ts'
import { resolveQueuedStatus } from '../mitAdvanced/queuedStatus.ts'
import { createSessionOrderFlow } from '../orderFlow/sessionOrderFlow.ts'
import type { FlowVisualState, OrderFlowPrefs } from '../orderFlow/types.ts'
import type { StoredOrder } from '../types/tradingTypes.ts'

export type TriggerEvent = {
  orderId: string
  kind: StoredOrder['kind']
  price: number
  side: StoredOrder['side']
}

export type TradingSessionState = {
  productType: ProductType
  symbol: string
  sharedOrderQty: number
  ladderDirection: LadderDirection
  selectedPositionId: string | null
  ladderPinned: boolean
  /** Coin only: OFF = one-way (default), ON = dual LONG+SHORT legs */
  hedgeMode: boolean
  /** 우측 주문창 시장가 / 지정가 */
  orderEntryKind: CoinOrderEntryKind
  /** 지정가 패널·호가 연동 가격 */
  limitEntryPrice: number
  version: number
}

export type CreateTradingSessionOptions = {
  /** Tab-bound session: ticker + processTick only for this symbol. */
  bindSymbol?: string
}

export function createTradingSession(opts?: CreateTradingSessionOptions) {
  const bindSymbol = opts?.bindSymbol
  const positions = createPositionStore()
  const orders = createOrderStore()
  const audit = createAuditEngine()
  const hedge = createHedgeEngine({ positions })
  const execution = createOrderExecution({
    hedge,
    positions,
    orders,
    audit,
    getUseHedgeLegs: () =>
      useHedgeLegTrading(state.productType, state.hedgeMode),
  })
  const ticker = createMockTicker(
    bindSymbol ? [bindSymbol] : allEngineTickerSymbols(),
    { autoTick: false },
  )

  let lastTrigger: TriggerEvent | null = null
  let prevTickPrice = 0

  let state: TradingSessionState = {
    productType: 'COIN_FUTURES',
    symbol: 'BTCUSDT',
    sharedOrderQty: DEFAULT_SHARED_ORDER_QTY,
    ladderDirection: 'buy',
    selectedPositionId: null,
    ladderPinned: false,
    hedgeMode: false,
    orderEntryKind: 'market',
    limitEntryPrice: getSymbolConfig('BTCUSDT')?.basePrice ?? 97_420,
    version: 0,
  }

  const listeners = new Set<() => void>()

  const bump = () => {
    state = { ...state, version: state.version + 1 }
    for (const fn of listeners) fn()
  }

  const orderFlow = createSessionOrderFlow({
    getSymbol: () => state.symbol,
    getProductType: () => state.productType,
    useHedgeLegs: () =>
      useHedgeLegTrading(state.productType, state.hedgeMode),
    getLadderDirection: () => state.ladderDirection,
    getSharedQty: () => state.sharedOrderQty,
    getLastPrice: () => ticker.getLastPrice(state.symbol),
    getFlowSeed: () => state.version,
    execution,
    orders,
    audit,
    hedge,
    bump,
    instantFlush: typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test',
  })

  const processTick = (symbol: string, lastPrice: number) => {
    if (bindSymbol && symbol !== bindSymbol) return
    if (symbol !== state.symbol) return
    if (!isProductEngineReady(state.productType)) return
    const cfg = getSymbolConfig(symbol)
    if (!cfg) return
    const ref = cfg.basePrice
    const prev = prevTickPrice > 0 ? prevTickPrice : ref
    prevTickPrice = lastPrice

    for (const o of orders.listPendingMitStop(symbol)) {
      const st = resolveQueuedStatus(o, lastPrice, prev, cfg.tick)
      if (st === 'WAITING' || st === 'ARMED') {
        orders.setQueuedStatus(o.id, st)
      }
    }

    const mitHits = evaluateMitStopOnTick(
      orders,
      symbol,
      lastPrice,
      prev,
      cfg.tick,
    )
    for (const hit of mitHits) {
      orders.setQueuedStatus(hit.orderId, 'TRIGGERED')
      lastTrigger = {
        orderId: hit.orderId,
        kind: hit.kind,
        price: lastPrice,
        side: hit.side,
      }
      execution.fillMitStopOrder(hit.orderId, lastPrice)
      audit.append('mit_stop.trigger', `${hit.kind} @ ${lastPrice}`)
    }

    const protIds = evaluateProtectionOnTick(
      orders,
      positions.list(),
      symbol,
      lastPrice,
      cfg.tick,
    )
    for (const id of protIds) {
      const o = orders.list().find((x) => x.id === id)
      if (!o?.positionId) continue
      const pos = positions.get(o.positionId)
      if (!pos) continue
      orders.setQueuedStatus(id, 'TRIGGERED')
      lastTrigger = {
        orderId: id,
        kind: o.kind,
        price: lastPrice,
        side: o.side,
      }
      const closeQty = Math.min(o.qty, pos.qty)
      hedge.closeQty(o.positionId, closeQty, lastPrice)
      orders.markFilled(id)
      // OCO: 익절·손절 중 하나 체결 시 같은 포지션의 나머지 보호주문 전부 취소
      orders.cancelByPositionId(o.positionId)
      audit.append('protection.trigger', `${o.kind} ${closeQty} @ ${lastPrice}`)
    }
    bump()
  }

  ticker.subscribe((symbol, price) => processTick(symbol, price))

  return {
    getState: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },

    setProduct(productType: ProductType) {
      const symbol = isProductEngineReady(productType)
        ? defaultSymbolForProduct(productType)
        : state.symbol
      state = {
        ...state,
        productType,
        symbol,
        hedgeMode: supportsHedgeMode(productType) ? state.hedgeMode : false,
      }
      bump()
    },

    setHedgeMode(on: boolean) {
      if (!supportsHedgeMode(state.productType)) return
      state = { ...state, hedgeMode: on }
      audit.append('hedge.mode', on ? 'ON' : 'OFF')
      bump()
    },

    setSymbol(symbol: string) {
      const cfg = getSymbolConfig(symbol, state.productType)
      state = {
        ...state,
        symbol,
        limitEntryPrice: cfg?.basePrice ?? state.limitEntryPrice,
      }
      bump()
    },

    setOrderEntryKind(kind: CoinOrderEntryKind) {
      state = { ...state, orderEntryKind: kind }
      bump()
    },

    setLimitEntryPrice(price: number) {
      if (!Number.isFinite(price) || price <= 0) return
      state = { ...state, limitEntryPrice: price }
      bump()
    },

    setSharedOrderQty(qty: number) {
      state = { ...state, sharedOrderQty: qty }
      bump()
    },

    setLadderDirection(dir: LadderDirection) {
      state = { ...state, ladderDirection: dir }
      bump()
    },

    setSelectedPositionId(id: string | null) {
      state = { ...state, selectedPositionId: id }
      bump()
    },

    setLadderPinned(pinned: boolean) {
      state = { ...state, ladderPinned: pinned }
      bump()
    },

    getLastPrice(symbol: string = state.symbol) {
      return ticker.getLastPrice(symbol)
    },

    manualTick(symbol: string, price: number) {
      ticker.manualTick(symbol, price)
    },

    startTicker() {
      ticker.start()
    },

    stopTicker() {
      ticker.stop()
    },

    placePanelOrder(side: 'buy' | 'sell') {
      if (!isProductEngineReady(state.productType)) {
        return { ok: false as const, message: '준비중인 상품입니다.' }
      }
      const last = ticker.getLastPrice(state.symbol)
      const fillPrice =
        state.orderEntryKind === 'market' ? last : state.limitEntryPrice
      const r = execution.fillPanelOrder({
        productType: state.productType,
        symbol: state.symbol,
        side,
        entryKind: state.orderEntryKind,
        price: fillPrice,
        qty: state.sharedOrderQty,
      })
      if (r.ok) {
        state = { ...state, ladderDirection: side === 'buy' ? 'buy' : 'sell' }
        bump()
      }
      return r
    },

    placeLadderOrder(column: LadderOrderColumn, price: number) {
      if (!isProductEngineReady(state.productType)) {
        return { ok: false as const, message: '준비중인 상품입니다.' }
      }
      if (!useHedgeLegTrading(state.productType, state.hedgeMode)) {
        state = {
          ...state,
          ladderDirection: column === 'order-right' ? 'buy' : 'sell',
          limitEntryPrice: price,
          orderEntryKind: 'limit',
        }
        bump()
      }
      if (useHedgeLegTrading(state.productType, state.hedgeMode)) {
        const side = column === 'order-right' ? 'buy' : 'sell'
        return this.placeHedgeExchangeOrder(side, price)
      }
      if (isProductBridgeReady(state.productType, state.symbol)) {
        const intent = describeCoinLadderIntent(false, column, false)
        audit.append(
          'core.intent.ladder',
          `${logCoinIntentPreview(intent)} @ ${price}`,
        )
      }
      return orderFlow.placeLadder(column, price)
    },

    placeHedgeExchangeOrder(side: 'buy' | 'sell', price: number) {
      if (!useHedgeLegTrading(state.productType, state.hedgeMode)) {
        return {
          ok: false as const,
          message: '헷지 모드에서만 사용합니다.',
        }
      }
      const r = execution.fillHedgeExchange({
        productType: state.productType,
        symbol: state.symbol,
        side,
        price,
        qty: state.sharedOrderQty,
      })
      bump()
      return {
        ok: true as const,
        positionId: r.positionId,
        action: r.action,
      }
    },

    closeHedgeLegOnBook(
      side: 'LONG' | 'SHORT',
      price: number,
      qty?: number,
    ) {
      if (!useHedgeLegTrading(state.productType, state.hedgeMode)) {
        return {
          ok: false as const,
          message: '헷지 모드에서만 사용합니다.',
        }
      }
      const leg = positions
        .list()
        .find(
          (p) =>
            p.symbol === state.symbol && p.side === side && p.qty > 1e-12,
        )
      if (!leg) {
        return { ok: false as const, message: '청산할 포지션이 없습니다.' }
      }
      const closeQty = Math.min(qty ?? leg.qty, leg.qty)
      const partial = hedge.closeQty(leg.positionId, closeQty, price)
      if (!partial.ok) return partial
      const legAfter = positions.get(leg.positionId)
      if (!legAfter || legAfter.qty <= 1e-12) {
        orders.cancelByPositionId(leg.positionId)
      }
      audit.append('hedge.close.book', `${side} ${closeQty} @ ${price}`)
      bump()
      return { ok: true as const, positionId: leg.positionId }
    },

    /** Hedge 4-button — coin + hedgeMode ON only */
    hedgeOpenLeg(side: 'LONG' | 'SHORT') {
      if (!supportsHedgeMode(state.productType)) {
        return {
          ok: false as const,
          message: '헷지 주문은 코인선물만 지원합니다.',
        }
      }
      if (!state.hedgeMode) {
        return {
          ok: false as const,
          message: '헷지 모드를 켠 뒤 사용하세요.',
        }
      }
      if (!isProductEngineReady(state.productType)) {
        return { ok: false as const, message: '준비중인 상품입니다.' }
      }
      const leg = hedge.openLeg({
        productType: state.productType,
        symbol: state.symbol,
        side,
        qty: state.sharedOrderQty,
        fillPrice: ticker.getLastPrice(state.symbol),
      })
      const ord = orders.add({
        productType: state.productType,
        symbol: state.symbol,
        side,
        kind: 'LIMIT',
        triggerPrice: ticker.getLastPrice(state.symbol),
        qty: state.sharedOrderQty,
      })
      orders.markFilled(ord.id)
      audit.append('hedge.open', `${side} ${state.sharedOrderQty}`)
      bump()
      return { ok: true as const, positionId: leg.positionId }
    },

    hedgeCloseLeg(side: 'LONG' | 'SHORT', percent: ClosePercent = 100) {
      if (!useHedgeLegTrading(state.productType, state.hedgeMode)) {
        return {
          ok: false as const,
          message: '헷지 모드를 켠 뒤 사용하세요.',
        }
      }
      const leg = positions
        .list()
        .find(
          (p) =>
            p.symbol === state.symbol && p.side === side && p.qty > 1e-12,
        )
      if (!leg) {
        return { ok: false as const, message: '청산할 포지션이 없습니다.' }
      }
      return this.closePosition(leg.positionId, percent)
    },

    registerMit(
      triggerPrice: number,
      side: 'LONG' | 'SHORT',
      kind: 'MIT' | 'STOP',
      positionId?: string,
    ) {
      const rounded =
        (kind === 'MIT' || kind === 'STOP') &&
        isProductBridgeReady(state.productType, state.symbol)
          ? roundMitTriggerPrice(
              state.productType,
              state.symbol,
              triggerPrice,
            )
          : triggerPrice
      const id = registerMitOrder(orders, {
        productType: state.productType,
        symbol: state.symbol,
        side,
        triggerPrice: rounded,
        qty: state.sharedOrderQty,
        kind,
        positionId,
      })
      if (
        (kind === 'MIT' || kind === 'STOP') &&
        isProductBridgeReady(state.productType, state.symbol)
      ) {
        const intent = positionId
          ? side === 'LONG'
            ? 'MIT_CLOSE_LONG'
            : 'MIT_CLOSE_SHORT'
          : side === 'LONG'
            ? 'MIT_OPEN_LONG'
            : 'MIT_OPEN_SHORT'
        const core = registerCoinMitOnBook({
          product: state.productType,
          symbol: state.symbol,
          clickPrice: rounded,
          intent,
          engineOrderId: id,
        })
        if (core.ok) {
          audit.append('core.mit.lock', `id=${core.orderId} @ ${core.lockedPrice}`)
        }
      }
      audit.append('mit_stop.register', `${kind} ${side} @ ${rounded}`)
      bump()
      return id
    },

    updateOrderTrigger(orderId: string, triggerPrice: number): boolean {
      const order = orders.list().find((o) => o.id === orderId)
      let price = triggerPrice
      if (
        (order?.kind === 'MIT' || order?.kind === 'STOP') &&
        isProductBridgeReady(state.productType, state.symbol)
      ) {
        price = roundMitTriggerPrice(
          state.productType,
          state.symbol,
          triggerPrice,
        )
        relockCoinMitByEngineOrder({
          product: state.productType,
          symbol: state.symbol,
          engineOrderId: orderId,
          nextPrice: price,
        })
      }
      if (!orders.updateTriggerPrice(orderId, price)) return false
      audit.append('mit_stop.move', `${orderId} → ${price}`)
      bump()
      return true
    },

    getLastTrigger(): TriggerEvent | null {
      return lastTrigger
    },

    clearLastTrigger(): void {
      lastTrigger = null
    },

    listMitAdvanced(symbol: string = state.symbol) {
      return orders.listMitAdvanced(symbol)
    },

    cancelOrder(id: string) {
      const order = orders.list().find((o) => o.id === id)
      if (
        (order?.kind === 'MIT' || order?.kind === 'STOP') &&
        isProductBridgeReady(state.productType, order.symbol)
      ) {
        cancelCoinMitByEngineOrder(order.symbol, id)
      }
      const ok = orderFlow.cancelWithRace(id)
      if (ok) audit.append('order.cancel', id)
      return ok
    },

    getOrderFlowVisual(): FlowVisualState {
      return orderFlow.getVisual()
    },

    clearOrderFlowVisual(): void {
      orderFlow.clearVisual()
    },

    getOrderFlowPrefs(): OrderFlowPrefs {
      return orderFlow.getPrefs()
    },

    setOrderFlowPrefs(prefs: OrderFlowPrefs): void {
      orderFlow.setPrefs(prefs)
    },

    cancelAllOrders(symbol?: string) {
      const n = orders.cancelAllPending(symbol)
      audit.append('order.cancel_all', symbol ?? 'ALL')
      bump()
      return n
    },

    cancelAllStop(symbol?: string) {
      const n = orders.cancelAllPending(symbol, ['MIT', 'STOP'])
      audit.append('stop.cancel_all', symbol ?? 'ALL')
      bump()
      return n
    },

    closePosition(positionId: string, percent: ClosePercent, fillPrice?: number) {
      const leg = positions.get(positionId)
      if (!leg) return { ok: false as const, message: '포지션을 찾을 수 없습니다.' }
      if (leg.symbol !== state.symbol) {
        return {
          ok: false as const,
          message: `심볼 불일치: 포지션 ${leg.symbol} / 탭 ${state.symbol}`,
        }
      }
      const price = fillPrice ?? ticker.getLastPrice(leg.symbol)
      const result = execution.closePosition(positionId, percent, price)
      if (result.ok) {
        const legAfter = positions.get(positionId)
        if (!legAfter || legAfter.qty <= 1e-12) {
          orders.cancelByPositionId(positionId)
        }
        bump()
      }
      return result
    },

    scaleIn(positionId: string, qty?: number) {
      const leg = positions.get(positionId)
      if (!leg) return { ok: false as const, message: '포지션을 찾을 수 없습니다.' }
      if (leg.symbol !== state.symbol) {
        return {
          ok: false as const,
          message: `심볼 불일치: 포지션 ${leg.symbol} / 탭 ${state.symbol}`,
        }
      }
      const addQty = qty ?? state.sharedOrderQty
      if (addQty <= 0) {
        return { ok: false as const, message: '수량이 올바르지 않습니다.' }
      }
      const price = ticker.getLastPrice(leg.symbol)
      const next = hedge.addToLeg(positionId, addQty, price)
      if (!next) return { ok: false as const, message: '추가 진입 실패' }
      audit.append('position.scale_in', `${addQty} @ ${price}`)
      bump()
      return { ok: true as const, position: next }
    },

    reversePosition(positionId: string) {
      const leg = positions.get(positionId)
      if (!leg) return { ok: false as const, message: '포지션을 찾을 수 없습니다.' }
      if (leg.symbol !== state.symbol) {
        return {
          ok: false as const,
          message: `심볼 불일치: 포지션 ${leg.symbol} / 탭 ${state.symbol}`,
        }
      }
      const price = ticker.getLastPrice(leg.symbol)
      const qty = leg.qty
      const opposite = leg.side === 'LONG' ? 'SHORT' : 'LONG'
      const closeResult = execution.closePosition(positionId, 100, price)
      if (!closeResult.ok) return closeResult
      orders.cancelByPositionId(positionId)
      const column = opposite === 'LONG' ? 'order-right' : 'order-left'
      const openResult = execution.fillLadderLimit({
        productType: state.productType,
        symbol: state.symbol,
        ladderDirection: opposite === 'LONG' ? 'buy' : 'sell',
        column,
        price,
        qty,
      })
      if (!openResult.ok) {
        audit.append('position.reverse_fail', openResult.message)
        bump()
        return openResult
      }
      audit.append('position.reverse', `${leg.side}→${opposite} ${qty} @ ${price}`)
      bump()
      return { ok: true as const, positionId: openResult.positionId }
    },

    flattenAll() {
      const symbol = state.symbol
      const legs = positions
        .list()
        .filter((p) => p.symbol === symbol && p.qty > 0)
      let closed = 0
      for (const leg of legs) {
        const price = ticker.getLastPrice(leg.symbol)
        const r = execution.closePosition(leg.positionId, 100, price)
        if (r.ok) {
          orders.cancelByPositionId(leg.positionId)
          closed++
        }
      }
      audit.append('position.flatten_all', `${symbol} ×${closed}`)
      bump()
      return { ok: true as const, closed }
    },

    registerAutoProtection(tpTicks: number, slTicks: number, percent: ClosePercent) {
      const posId = state.selectedPositionId
      if (!posId) return { ok: false as const, message: '포지션을 선택하세요.' }
      const pos = positions.get(posId)
      if (!pos) return { ok: false as const, message: '포지션을 찾을 수 없습니다.' }
      if (pos.symbol !== state.symbol) {
        return {
          ok: false as const,
          message: `심볼 불일치: 포지션 ${pos.symbol} / 탭 ${state.symbol}`,
        }
      }
      const cfg = getSymbolConfig(pos.symbol)
      if (!cfg) return { ok: false as const, message: '심볼 설정 없음' }
      const r = registerProtectionForPosition(
        execution,
        pos,
        cfg.tick,
        tpTicks,
        slTicks,
        percent,
      )
      audit.append('protection.register', posId)
      bump()
      return { ok: true as const, ...r }
    },

    /** 호가 TP/SL 열 클릭 — 선택 포지션에 TP 또는 SL 1건 (평단 기준 위·아래 자동 판별) */
    registerProtectionAtBook(positionId: string, clickPrice: number) {
      const pos = positions.get(positionId)
      if (!pos) return { ok: false as const, message: '포지션을 찾을 수 없습니다.' }
      if (pos.symbol !== state.symbol) {
        state = { ...state, symbol: pos.symbol }
      }
      const kind = inferProtectionKindAtPrice(pos.side, pos.avgPrice, clickPrice)
      cancelPendingProtectionForPosition(orders, positionId, kind)
      const orderId = execution.registerProtection({
        productType: pos.productType,
        symbol: pos.symbol,
        side: pos.side,
        kind,
        triggerPrice: clickPrice,
        qty: pos.qty,
        positionId: pos.positionId,
      })
      audit.append('protection.book', `${kind} @ ${clickPrice}`)
      bump()
      return {
        ok: true as const,
        kind,
        triggerPrice: clickPrice,
        orderId,
      }
    },

    getPositions: () => positions.list(),
    getOrders: () => orders.list(),
    getPendingOrders: () => orders.listPending(),
    getPendingMitStop: () => orders.listPendingMitStop(),
    getAuditLast: () => audit.last(),
    getUnrealizedTotal: () =>
      sumUnrealized(positions.list(), ticker.getLastPrice(state.symbol)),
    getRealizedTotal: () => sumRealized(positions.list()),

    /** For tests */
    _engines: { positions, orders, audit, hedge, execution, ticker, orderFlow },
  }
}

export type TradingSession = ReturnType<typeof createTradingSession>
