import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspace } from '../../app/WorkspaceContext.tsx'
import { useTrading } from '../../app/TradingContext.tsx'
import type { PanelId } from '../../workspace/types.ts'
import {
  isProductEngineReady,
  useHedgeLegTrading,
} from '../../types/productTypes.ts'
import { BottomPositionDock } from '../BottomPositionDock.tsx'
import { OrderBookLadder, type TickDirection } from '../OrderBookLadder.tsx'
import { RightOrderPanel } from '../RightOrderPanel.tsx'
import { StatusBar } from '../StatusBar.tsx'
import { Toast } from '../Toast.tsx'
import { TradeTapePanel } from '../TradeTapePanel.tsx'
import { WatchlistPanel } from '../WatchlistPanel.tsx'
import {
  canRegisterBookMit,
  roundMitTriggerPrice,
} from '../../integration/ladderMitBridge.ts'
import { MitOrderPanel } from '../MitOrderPanel.tsx'
import { PositionLinkagePanel } from '../PositionLinkagePanel.tsx'
import { riskLineForPositions } from '../../mitAdvanced/riskLine.ts'
import { DetachablePanel } from '../workspace/DetachablePanel.tsx'
import { Theme2ChartPanel } from './Theme2ChartPanel.tsx'
import type { LadderClickMode } from '../proTrader.ts'
import { useMarketTape } from '../useMarketTape.ts'
import { useProTradingHotkeys } from '../useProTradingHotkeys.ts'
import { useTradingWorkflow } from '../useTradingWorkflow.ts'
import { ProWorkflowBar } from '../ProWorkflowBar.tsx'
import { QTY_PRESETS } from '../tradingFeel.ts'

const CHART_IDS: PanelId[] = ['chart1', 'chart2', 'chart3']
const CHART_LABELS = ['1m', '5m', '15m']

export function Theme2FloatPane() {
  const ws = useWorkspace()
  const session = useTrading()
  const st = session.getState()
  const [toast, setToast] = useState<string | null>(null)
  const [tpTicks, setTpTicks] = useState(100)
  const [slTicks, setSlTicks] = useState(100)
  const [protectPercent, setProtectPercent] = useState<25 | 50 | 75 | 100>(100)
  const [tickDirection, setTickDirection] = useState<TickDirection>('flat')
  const [oneClick, setOneClick] = useState(true)
  const [closeOrderMode, setCloseOrderMode] = useState(false)
  const [clickMode, setClickMode] = useState<LadderClickMode>('single')
  const [pinnedCenter, setPinnedCenter] = useState<number | null>(null)
  const [triggerFlashPrice, setTriggerFlashPrice] = useState<number | null>(null)
  const prevPrice = useRef(0)
  const prevVersion = useRef(0)

  const ready = isProductEngineReady(st.productType)
  const lastPrice = session.getLastPrice(st.symbol)
  const legs = session.getPositions()
  const pending = session.getPendingOrders()
  const selected = legs.find((l) => l.positionId === st.selectedPositionId) ?? null
  const audits = session._engines.audit.list()
  const marketTape = useMarketTape(lastPrice, st.symbol, st.version, audits)
  const riskLine = riskLineForPositions(legs, st.symbol, lastPrice)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  const wf = useTradingWorkflow(session, showToast)

  useProTradingHotkeys({
    enabled: ready,
    onBuyMode: () => session.setLadderDirection('buy'),
    onSellMode: () => session.setLadderDirection('sell'),
    onQtyPreset: (i) => session.setSharedOrderQty(QTY_PRESETS[i]),
    onToastClose: () => setToast(null),
    onLadderBuyAtMid: wf.onLadderBuyAtMid,
    onLadderSellAtMid: wf.onLadderSellAtMid,
    onReverse: () => wf.onReverse(),
    onScaleIn: () => wf.onScaleIn(),
    onScaleOut: () => wf.onScaleOut(undefined, 50),
    onCloseSelected: (pct) => wf.onScaleOut(undefined, pct),
    onFlattenAll: wf.onFlattenAll,
  })

  useEffect(() => {
    if (st.version === prevVersion.current) return
    prevVersion.current = st.version
    const tr = session.getLastTrigger()
    if (!tr) return
    showToast(`${tr.kind} TRIGGER @ ${tr.price}`)
    setTriggerFlashPrice(tr.price)
    const t = window.setTimeout(() => {
      setTriggerFlashPrice(null)
      session.clearLastTrigger()
    }, 600)
    return () => window.clearTimeout(t)
  }, [st.version, session, showToast])

  useEffect(() => {
    if (prevPrice.current !== 0 && prevPrice.current !== lastPrice) {
      setTickDirection(
        lastPrice > prevPrice.current ? 'up' : lastPrice < prevPrice.current ? 'down' : 'flat',
      )
      const t = window.setTimeout(() => setTickDirection('flat'), 200)
      prevPrice.current = lastPrice
      return () => window.clearTimeout(t)
    }
    prevPrice.current = lastPrice
  }, [lastPrice, st.version])

  const handlePinToggle = useCallback(
    (pinned: boolean) => {
      if (pinned) setPinnedCenter(lastPrice)
      else setPinnedCenter(null)
      session.setLadderPinned(pinned)
    },
    [session, lastPrice],
  )

  const hedgeExchange = useHedgeLegTrading(st.productType, st.hedgeMode)
  const tapeAggressiveSide =
    tickDirection === 'up'
      ? 'buy'
      : tickDirection === 'down'
        ? 'sell'
        : 'neutral'

  const ladder = (
    <OrderBookLadder
      product={st.productType}
      symbol={st.symbol}
      lastPrice={lastPrice}
      ladderDirection={st.ladderDirection}
      ladderPinned={st.ladderPinned}
      pinnedCenter={pinnedCenter}
      tickDirection={tickDirection}
      clickMode={clickMode}
      oneClick={oneClick}
      pendingOrders={pending}
      positions={legs}
      riskLinePrice={riskLine}
      triggerFlashPrice={triggerFlashPrice}
      onMarkerMove={(id, price) => {
        if (session.updateOrderTrigger(id, price)) showToast(`이동 → ${price}`)
      }}
      onMarkerCancel={(id) => {
        if (session.cancelOrder(id)) showToast('마커 취소')
      }}
      onPositionDragClose={wf.onPositionDragClose}
      onPinToggle={handlePinToggle}
      onOneClickToggle={() => setOneClick((v) => !v)}
      onClickModeToggle={() =>
        setClickMode((m) => (m === 'single' ? 'double' : 'single'))
      }
      onRecenter={() => {
        setPinnedCenter(null)
        session.setLadderPinned(false)
      }}
      hedgeExchangeMode={hedgeExchange}
      closeOrderMode={closeOrderMode}
      sharedOrderQty={st.sharedOrderQty}
      onCloseOrderModeToggle={() => setCloseOrderMode((v) => !v)}
      onOrderClick={(col, price) => session.placeLadderOrder(col, price)}
      onLadderCloseLeg={(side, price, qty) => {
        const r = session.closeHedgeLegOnBook(side, price, qty)
        return r.ok
          ? { ok: true as const }
          : { ok: false as const, message: r.message }
      }}
      mitOnBookEnabled={canRegisterBookMit(st.productType, st.symbol)}
      selectedPositionId={st.selectedPositionId}
      onRegisterProtectionAtBook={(positionId, price) => {
        const r = session.registerProtectionAtBook(positionId, price)
        if (r.ok) {
          const label = r.kind === 'PROTECTION_TP' ? 'TP' : 'SL'
          showToast(`${label} @ ${r.triggerPrice}`)
        }
        return r
      }}
      onRegisterMitAtPrice={(side, price) => {
        const p = roundMitTriggerPrice(st.productType, st.symbol, price)
        session.registerMit(p, side, 'MIT')
        showToast(`MIT ${side} @ ${p} (호가 고정)`)
      }}
      onBlocked={(msg) => showToast(msg)}
      onFill={(price) => showToast(`체결 @ ${price}`)}
      sessionVersion={st.version}
      marketTapeFooter={
        hedgeExchange ? (
          <TradeTapePanel
            rows={marketTape}
            variant="pro-table"
            aggressiveSide={tapeAggressiveSide}
          />
        ) : undefined
      }
    />
  )

  const renderPanel = (id: PanelId) => {
    if (!ws.panel(id).visible) return null
    switch (id) {
      case 'chart1':
      case 'chart2':
      case 'chart3': {
        const idx = CHART_IDS.indexOf(id)
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            <Theme2ChartPanel
              label={CHART_LABELS[idx] ?? id}
              symbol={st.symbol}
              lastPrice={lastPrice}
            />
          </DetachablePanel>
        )
      }
      case 'tape':
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            <div className="tape-watch-stack">
              <WatchlistPanel
                product={st.productType}
                selectedSymbol={st.symbol}
                getLastPrice={(sym) => session.getLastPrice(sym)}
                onSelectSymbol={wf.onSymbol}
                priceVersion={st.version}
              />
              {!hedgeExchange && (
                <TradeTapePanel
                  rows={marketTape}
                  compact={wf.compactTape}
                  aggressiveSide={tapeAggressiveSide}
                />
              )}
            </div>
          </DetachablePanel>
        )
      case 'ladder':
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            {ladder}
          </DetachablePanel>
        )
      case 'order':
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            <RightOrderPanel
              disabled={!ready}
              productType={st.productType}
              symbol={st.symbol}
              ladderDirection={st.ladderDirection}
              sharedOrderQty={st.sharedOrderQty}
              selectedPosition={selected}
              pendingOrders={pending}
              tpTicks={tpTicks}
              slTicks={slTicks}
              protectPercent={protectPercent}
              orderEntryKind={st.orderEntryKind}
              limitEntryPrice={st.limitEntryPrice}
              lastPrice={lastPrice}
              onOrderEntryKind={(k) => session.setOrderEntryKind(k)}
              onLimitEntryPrice={(p) => session.setLimitEntryPrice(p)}
              onSharedOrderQty={(q) => session.setSharedOrderQty(q)}
              onPanelBuy={() => {
                const r = session.placePanelOrder('buy')
                const kind = st.orderEntryKind === 'market' ? '시장가' : '지정가'
                showToast(
                  r.ok
                    ? `${kind} 매수`
                    : (r as { message: string }).message,
                )
              }}
              onPanelSell={() => {
                const r = session.placePanelOrder('sell')
                const kind = st.orderEntryKind === 'market' ? '시장가' : '지정가'
                showToast(
                  r.ok
                    ? `${kind} 매도`
                    : (r as { message: string }).message,
                )
              }}
              onTpTicks={setTpTicks}
              onSlTicks={setSlTicks}
              onProtectPercent={setProtectPercent}
              onRegisterProtection={() => {
                const r = session.registerAutoProtection(
                  tpTicks,
                  slTicks,
                  protectPercent,
                )
                showToast(r.ok ? `TP ${r.tpPrice} / SL ${r.slPrice}` : r.message)
              }}
              onRegisterMit={(side, trigger) => {
                session.registerMit(trigger, side, 'MIT')
                showToast(`MIT ${side} @ ${trigger}`)
              }}
              hedgeMode={st.hedgeMode}
              onHedgeMode={(on) => session.setHedgeMode(on)}
            />
          </DetachablePanel>
        )
      case 'mit':
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            <MitOrderPanel
              symbol={st.symbol}
              lastPrice={lastPrice}
              orders={pending}
              selectedPositionId={st.selectedPositionId}
              onCancel={(id) => {
                if (session.cancelOrder(id)) showToast('MIT/STOP 취소')
              }}
            />
          </DetachablePanel>
        )
      case 'linkage':
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            <PositionLinkagePanel
              positions={legs}
              orders={session._engines.orders.list()}
              selectedId={st.selectedPositionId}
              onSelect={(pid) => wf.onSelectPosition(pid)}
            />
          </DetachablePanel>
        )
      case 'dock':
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            <BottomPositionDock
              disabled={!ready}
              legs={legs}
              pending={pending}
              audits={audits}
              markPrice={lastPrice}
              selectedId={st.selectedPositionId}
              onSelect={(pid) => wf.onSelectPosition(pid)}
              onClose={(pid, pct) => {
                const r = session.closePosition(pid, pct)
                showToast(r.ok ? `청산 ${pct}%` : r.message)
              }}
              onReverse={(id) => wf.onReverse(id)}
              onScaleIn={(id) => wf.onScaleIn(id)}
              onScaleOut={(id, pct) => wf.onScaleOut(id, pct)}
              onCancelOrder={(oid) => {
                if (session.cancelOrder(oid)) showToast('주문 취소')
              }}
              onCancelAll={() => {
                const n = session.cancelAllOrders(st.symbol)
                showToast(`전체취소 ${n}건`)
              }}
            />
          </DetachablePanel>
        )
      case 'status':
        return (
          <DetachablePanel key={id} panelId={id} dockZone="float">
            <StatusBar tickCount={st.version} symbol={st.symbol} />
          </DetachablePanel>
        )
      default:
        return null
    }
  }

  const panelOrder: PanelId[] = [
    'chart1',
    'chart2',
    'chart3',
    'ladder',
    'tape',
    'order',
    'mit',
    'linkage',
    'dock',
    'status',
  ]

  return (
    <div className="theme2-float-surface">
      <ProWorkflowBar
        onFlattenAll={wf.onFlattenAll}
        onDetachDock={() => ws.detachPanel('dock')}
      />
      <div className="theme2-float-backdrop" aria-hidden />
      {panelOrder.map((id) => renderPanel(id))}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
