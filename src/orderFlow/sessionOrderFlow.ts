import type { ProductType } from '../types/productTypes.ts'
import type { LadderDirection, LadderOrderColumn } from '../types/tradingTypes.ts'
import { validateLadderDirection } from '../engine/hedgeEngine.ts'
import type { OrderExecution } from '../engine/orderExecution.ts'
import type { OrderStore } from '../engine/orderStore.ts'
import type { AuditEngine } from '../engine/auditEngine.ts'
import type { HedgeEngine } from '../engine/hedgeEngine.ts'
import { loadOrderFlowPrefs } from './flowPrefs.ts'
import { planLadderFill, visualTagLabel } from './flowEngine.ts'
import type { FlowVisualState, FlowVisualTag, LiquidityRole, OrderFlowPrefs } from './types.ts'

export type SessionOrderFlowDeps = {
  getSymbol: () => string
  useHedgeLegs: () => boolean
  getProductType: () => ProductType
  getLadderDirection: () => LadderDirection
  getSharedQty: () => number
  getLastPrice: () => number
  getFlowSeed: () => number
  execution: OrderExecution
  orders: OrderStore
  audit: AuditEngine
  hedge: HedgeEngine
  bump: () => void
  /** Vitest / instant flush — no setTimeout */
  instantFlush?: boolean
}

export function createSessionOrderFlow(deps: SessionOrderFlowDeps) {
  let prefs: OrderFlowPrefs = loadOrderFlowPrefs()
  let visual: FlowVisualState = {
    tag: 'none',
    message: '',
    liquidityRole: null,
    slippageTicks: 0,
    partialPct: 0,
    until: 0,
  }
  let pendingTimers: ReturnType<typeof setTimeout>[] = []
  let flowSeq = 0

  const clearTimers = () => {
    for (const t of pendingTimers) clearTimeout(t)
    pendingTimers = []
  }

  const setVisual = (
    tag: FlowVisualTag,
    message: string,
    role: LiquidityRole | null,
    slip: number,
    partialPct: number,
  ) => {
    visual = {
      tag,
      message,
      liquidityRole: role,
      slippageTicks: slip,
      partialPct,
      until: Date.now() + 2400,
    }
  }

  return {
    getPrefs: () => prefs,
    setPrefs(next: OrderFlowPrefs) {
      prefs = next
    },
    getVisual: () => visual,
    clearVisual() {
      visual = { ...visual, tag: 'none', message: '', until: 0 }
    },
    dispose: clearTimers,

    placeLadder(
      column: LadderOrderColumn,
      limitPrice: number,
    ):
      | { ok: true; positionId?: string; pending?: boolean }
      | { ok: false; message: string } {
      const symbol = deps.getSymbol()
      const dir = validateLadderDirection(deps.getLadderDirection(), column)
      if (!dir.ok) return dir

      if (!prefs.enabled || !deps.useHedgeLegs()) {
        const r = deps.execution.fillLadderLimit({
          productType: deps.getProductType(),
          symbol,
          ladderDirection: deps.getLadderDirection(),
          column,
          price: limitPrice,
          qty: deps.getSharedQty(),
        })
        if (r.ok) deps.bump()
        return r
      }

      const plan = planLadderFill({
        symbol,
        column,
        limitPrice,
        totalQty: deps.getSharedQty(),
        lastPrice: deps.getLastPrice(),
        latencyMode: prefs.latencyMode,
        flowSeed: deps.getFlowSeed() + flowSeq++,
      })

      const pendingOrd = deps.orders.add({
        productType: deps.getProductType(),
        symbol,
        side: plan.side,
        kind: 'LIMIT',
        triggerPrice: limitPrice,
        qty: plan.totalQty,
        queuePriority: plan.slices[0]?.queuePriority ?? 1000,
        flowTag: plan.visualTag,
      })

      const runInstant =
        prefs.latencyMode === 'instant' || deps.instantFlush === true

      let positionId: string | undefined
      let filledQty = 0

      const runSlice = (i: number) => {
        const slice = plan.slices[i]
        if (!slice) return

        if (!positionId) {
          const leg = deps.hedge.openLeg({
            productType: deps.getProductType(),
            symbol,
            side: plan.side,
            qty: slice.qty,
            fillPrice: slice.fillPrice,
          })
          positionId = leg.positionId
        } else {
          deps.hedge.addToLeg(positionId, slice.qty, slice.fillPrice)
        }

        filledQty += slice.qty
        const ord = deps.orders.get(pendingOrd.id)
        if (ord) {
          ord.liquidityRole = slice.liquidityRole
          ord.slippageTicks = slice.slippageTicks
          ord.filledQty = filledQty
          if (filledQty >= ord.qty - 1e-8) {
            deps.orders.markFilled(pendingOrd.id)
          } else {
            ord.queuedStatus = 'PARTIAL'
          }
        }

        const pct = Math.round((filledQty / plan.totalQty) * 100)
        setVisual(
          plan.visualTag,
          `${visualTagLabel(plan.visualTag)} ${slice.liquidityRole.toUpperCase()} ${pct}%`,
          slice.liquidityRole,
          slice.slippageTicks,
          pct,
        )
        deps.audit.append(
          'flow.fill',
          `${slice.liquidityRole} ${slice.qty} @ ${slice.fillPrice} slip${slice.slippageTicks}`,
        )
        deps.bump()
      }

      if (runInstant) {
        for (let i = 0; i < plan.slices.length; i++) runSlice(i)
        return { ok: true as const, positionId }
      }

      plan.slices.forEach((_slice, i) => {
        const delay = plan.slices[i]!.delayMs
        const t = setTimeout(() => runSlice(i), delay)
        pendingTimers.push(t)
      })

      deps.bump()
      return { ok: true as const, pending: true }
    },

    cancelWithRace(orderId: string): boolean {
      const o = deps.orders.get(orderId)
      if (!o || o.status !== 'pending') {
        const ok = deps.orders.cancel(orderId)
        if (ok) deps.bump()
        return ok
      }

      const partial = (o.filledQty ?? 0) > 0 && (o.filledQty ?? 0) < o.qty
      if (partial) {
        setVisual('cancel_race', 'CANCEL RACE — partial already filled', null, 0, 0)
        deps.audit.append('flow.cancel_race', orderId)
        o.flowTag = 'cancel_race'
        deps.orders.markFilled(orderId)
        deps.bump()
        return false
      }

      const ok = deps.orders.cancel(orderId)
      if (ok) deps.bump()
      return ok
    },
  }
}
