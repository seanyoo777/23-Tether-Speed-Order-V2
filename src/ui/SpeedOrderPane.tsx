import { useCallback, useEffect, useRef, useState } from 'react'
import { useWorkspaceOptional } from '../app/WorkspaceContext.tsx'
import { useTrading } from '../app/TradingContext.tsx'
import type { DockZone, PanelId } from '../workspace/types.ts'
import {
  getSymbolConfig,
  isProductEngineReady,
  productComingSoonMessage,
  useHedgeLegTrading,
} from '../types/productTypes.ts'
import { AssetSummaryBar } from './AssetSummaryBar.tsx'
import { BottomPositionDock } from './BottomPositionDock.tsx'
import { DiagnosticsPanel } from './DiagnosticsPanel.tsx'
import { OrderBookLadder, type TickDirection } from './OrderBookLadder.tsx'
import { ProductSymbolSelector } from './ProductSymbolSelector.tsx'
import { RightOrderPanel } from './RightOrderPanel.tsx'
import { SpeedQtyBar } from './SpeedQtyBar.tsx'
import { StatusBar } from './StatusBar.tsx'
import { Toast } from './Toast.tsx'
import { TradeTapePanel } from './TradeTapePanel.tsx'
import { WatchlistPanel } from './WatchlistPanel.tsx'
import {
  canRegisterBookMit,
  roundMitTriggerPrice,
} from '../integration/ladderMitBridge.ts'
import {
  DEFAULT_QTY,
  type CompactMode,
  type LadderClickMode,
} from './proTrader.ts'
import { QTY_PRESETS } from './tradingFeel.ts'
import { useProTradingHotkeys } from './useProTradingHotkeys.ts'
import { useTradingWorkflow } from './useTradingWorkflow.ts'
import { ProWorkflowBar } from './ProWorkflowBar.tsx'
import { OrderFlowHud } from './OrderFlowHud.tsx'
import { useMarketTape } from './useMarketTape.ts'
import { MitOrderPanel } from './MitOrderPanel.tsx'
import { PositionLinkagePanel } from './PositionLinkagePanel.tsx'
import { riskLineForPositions } from '../mitAdvanced/riskLine.ts'
import { DetachablePanel } from './workspace/DetachablePanel.tsx'

function inZone(
  ws: ReturnType<typeof useWorkspaceOptional>,
  panelId: PanelId,
  zone: DockZone,
): boolean {
  if (!ws) return true
  const p = ws.panel(panelId)
  return p.visible && !p.detached && !p.popup && p.placement.zone === zone
}

export function SpeedOrderPane({ popupOnly = false }: { popupOnly?: boolean }) {
  const ws = useWorkspaceOptional()
  const session = useTrading()
  const st = session.getState()
  const [toast, setToast] = useState<string | null>(null)
  const [tpTicks, setTpTicks] = useState(100)
  const [slTicks, setSlTicks] = useState(100)
  const [protectPercent, setProtectPercent] = useState<25 | 50 | 75 | 100>(100)
  const [showDiag, setShowDiag] = useState(false)
  const [tickDirection, setTickDirection] = useState<TickDirection>('flat')
  const [oneClick, setOneClick] = useState(true)
  const [closeOrderMode, setCloseOrderMode] = useState(false)
  const [clickMode, setClickMode] = useState<LadderClickMode>('single')
  const [pinnedCenter, setPinnedCenter] = useState<number | null>(null)
  const [compactMode, setCompactMode] = useState<CompactMode>('normal')
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

  useEffect(() => {
    if (prevPrice.current !== 0 && prevPrice.current !== lastPrice) {
      setTickDirection(
        lastPrice > prevPrice.current
          ? 'up'
          : lastPrice < prevPrice.current
            ? 'down'
            : 'flat',
      )
      const t = window.setTimeout(() => setTickDirection('flat'), 200)
      prevPrice.current = lastPrice
      return () => window.clearTimeout(t)
    }
    prevPrice.current = lastPrice
  }, [lastPrice, st.version])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => {
    if (st.version === prevVersion.current) return
    prevVersion.current = st.version
    const tr = session.getLastTrigger()
    if (!tr) return
    const label =
      tr.kind === 'PROTECTION_TP'
        ? 'TP'
        : tr.kind === 'PROTECTION_SL'
          ? 'SL'
          : tr.kind
    showToast(`${label} TRIGGER @ ${tr.price}`)
    setTriggerFlashPrice(tr.price)
    const t = window.setTimeout(() => {
      setTriggerFlashPrice(null)
      session.clearLastTrigger()
    }, 600)
    return () => window.clearTimeout(t)
  }, [st.version, session, showToast])

  const closeToast = useCallback(() => setToast(null), [])

  const wf = useTradingWorkflow(session, showToast)

  const handlePinToggle = useCallback(
    (pinned: boolean) => {
      if (pinned) setPinnedCenter(lastPrice)
      else setPinnedCenter(null)
      session.setLadderPinned(pinned)
    },
    [session, lastPrice],
  )

  useProTradingHotkeys({
    enabled: ready && !popupOnly,
    onBuyMode: () => session.setLadderDirection('buy'),
    onSellMode: () => session.setLadderDirection('sell'),
    onQtyPreset: (i) => session.setSharedOrderQty(QTY_PRESETS[i]),
    onToastClose: closeToast,
    onDiagToggle: () => setShowDiag((v) => !v),
    onCompactMode: setCompactMode,
    onLadderBuyAtMid: wf.onLadderBuyAtMid,
    onLadderSellAtMid: wf.onLadderSellAtMid,
    onReverse: () => wf.onReverse(),
    onScaleIn: () => wf.onScaleIn(),
    onScaleOut: () => wf.onScaleOut(undefined, 50),
    onCloseSelected: (pct) => wf.onScaleOut(undefined, pct),
    onFlattenAll: wf.onFlattenAll,
  })

  const unrealized = session.getUnrealizedTotal()
  const realized = session.getRealizedTotal()
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

  if (popupOnly) {
    return (
      <div className="hts-root popup-pane">
        <DetachablePanel panelId="ladder" dockZone="center">
          {ladder}
        </DetachablePanel>
        <Toast message={toast} onDismiss={closeToast} />
      </div>
    )
  }

  return (
    <div
      className={[
        'hts-root',
        compactMode === 'ultra' ? 'ultra-compact' : '',
        ws ? `ws-layout-${ws.snapshot.layoutPreset}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="hts-top">
        <span className="title">23 · Speed Order</span>
        <span className="mock-badge">MOCK</span>
        <span className="kbd-hint">Q/A B/V R +/- X/P F9</span>
        <ProWorkflowBar
          onFlattenAll={wf.onFlattenAll}
          onDetachDock={
            ws ? () => ws.detachPanel('dock') : undefined
          }
        />
        <OrderFlowHud session={session} version={st.version} />
        <ProductSymbolSelector
          product={st.productType}
          symbol={st.symbol}
          lastPrice={lastPrice}
          ladderDirection={st.ladderDirection}
          hedgeMode={st.hedgeMode}
          onProduct={(p) => {
            session.setProduct(p)
            closeToast()
          }}
          onSymbol={wf.onSymbol}
        />
      </header>

      {!ready && (
        <div className="banner-warn">{productComingSoonMessage(st.productType)}</div>
      )}

      <div className="hts-body">
        {inZone(ws, 'tape', 'left') && (
          <aside className="col-left">
            <WatchlistPanel
              product={st.productType}
              selectedSymbol={st.symbol}
              getLastPrice={(sym) => session.getLastPrice(sym)}
              onSelectSymbol={wf.onSymbol}
              priceVersion={st.version}
            />
            {!hedgeExchange && (
              <DetachablePanel panelId="tape" dockZone="left">
                <TradeTapePanel
                  rows={marketTape}
                  compact={wf.compactTape}
                  aggressiveSide={tapeAggressiveSide}
                />
              </DetachablePanel>
            )}
            <SpeedQtyBar
              disabled={!ready}
              qty={st.sharedOrderQty}
              onQty={(q) => session.setSharedOrderQty(Number(q.toFixed(4)))}
              onReset={() => session.setSharedOrderQty(DEFAULT_QTY)}
            />
          </aside>
        )}

        {inZone(ws, 'ladder', 'center') && (
          <main className="col-center">
            <DetachablePanel panelId="ladder" dockZone="center">
              {ladder}
            </DetachablePanel>
          </main>
        )}

        {(inZone(ws, 'order', 'right') ||
          inZone(ws, 'mit', 'right') ||
          inZone(ws, 'linkage', 'right')) && (
          <aside className="col-right">
            {inZone(ws, 'order', 'right') && (
              <DetachablePanel panelId="order" dockZone="right">
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
                    const kind =
                      st.orderEntryKind === 'market' ? '시장가' : '지정가'
                    showToast(
                      r.ok
                        ? `${kind} 매수 @ ${st.orderEntryKind === 'market' ? lastPrice : st.limitEntryPrice}`
                        : (r as { message: string }).message,
                    )
                  }}
                  onPanelSell={() => {
                    const r = session.placePanelOrder('sell')
                    const kind =
                      st.orderEntryKind === 'market' ? '시장가' : '지정가'
                    showToast(
                      r.ok
                        ? `${kind} 매도 @ ${st.orderEntryKind === 'market' ? lastPrice : st.limitEntryPrice}`
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
                    showToast(
                      r.ok ? `TP ${r.tpPrice} / SL ${r.slPrice}` : r.message,
                    )
                  }}
                  onRegisterMit={(side, trigger) => {
                    session.registerMit(trigger, side, 'MIT')
                    showToast(`MIT ${side} @ ${trigger}`)
                  }}
                  hedgeMode={st.hedgeMode}
                  onHedgeMode={(on) => session.setHedgeMode(on)}
                />
              </DetachablePanel>
            )}
            {inZone(ws, 'mit', 'right') && (
              <DetachablePanel panelId="mit" dockZone="right">
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
            )}
            {inZone(ws, 'linkage', 'right') && (
              <DetachablePanel panelId="linkage" dockZone="right">
                <PositionLinkagePanel
                  positions={legs}
                  orders={session._engines.orders.list()}
                  selectedId={st.selectedPositionId}
                  onSelect={(id) => wf.onSelectPosition(id)}
                />
              </DetachablePanel>
            )}
          </aside>
        )}

        {inZone(ws, 'tape', 'bottom') && (
          <section className="col-bottom-tape">
            <DetachablePanel panelId="tape" dockZone="bottom">
              <TradeTapePanel
                rows={marketTape}
                compact={wf.compactTape}
                aggressiveSide={
                  tickDirection === 'up'
                    ? 'buy'
                    : tickDirection === 'down'
                      ? 'sell'
                      : 'neutral'
                }
              />
            </DetachablePanel>
          </section>
        )}
      </div>

      <footer className="hts-foot">
        <AssetSummaryBar
          totalEquity={100_000 + unrealized}
          dayRealized={realized}
          positionEval={unrealized}
          lossCutMargin={50_000}
        />
        {inZone(ws, 'dock', 'bottom') && (
          <DetachablePanel panelId="dock" dockZone="bottom">
            <BottomPositionDock
              disabled={!ready}
              legs={legs}
              pending={pending}
              audits={audits}
              markPrice={lastPrice}
              selectedId={st.selectedPositionId}
              onSelect={(id) => wf.onSelectPosition(id)}
              onClose={(id, pct) => {
                const r = session.closePosition(id, pct)
                showToast(r.ok ? `청산 ${pct}%` : r.message)
              }}
              onReverse={(id) => wf.onReverse(id)}
              onScaleIn={(id) => wf.onScaleIn(id)}
              onScaleOut={(id, pct) => wf.onScaleOut(id, pct)}
              onCancelOrder={(id) => {
                if (session.cancelOrder(id)) showToast('주문 취소')
              }}
              onCancelAll={() => {
                const n = session.cancelAllOrders(st.symbol)
                showToast(`전체취소 ${n}건`)
              }}
            />
          </DetachablePanel>
        )}
        {inZone(ws, 'status', 'bottom') && (
          <DetachablePanel panelId="status" dockZone="bottom">
            <StatusBar tickCount={st.version} symbol={st.symbol} />
          </DetachablePanel>
        )}
      </footer>

      {showDiag && (
        <div className="diag-float">
          <button
            type="button"
            className="diag-close"
            onClick={() => setShowDiag(false)}
            aria-label="닫기"
          >
            ×
          </button>
          <DiagnosticsPanel
            compact
            product={st.productType}
            symbol={st.symbol}
            lastPrice={lastPrice}
            tick={getSymbolConfig(st.symbol, st.productType)?.tick ?? 0.5}
            sharedOrderQty={st.sharedOrderQty}
            ladderDirection={st.ladderDirection}
            openPositions={legs.length}
            pendingOrders={pending.length}
            pendingMitStop={session.getPendingMitStop().length}
            mitStopOrders={session.getPendingMitStop()}
            onManualTick={(price) => {
              session.manualTick(st.symbol, price)
              showToast(`시세 → ${price}`)
            }}
            lastAudit={session.getAuditLast()?.action}
          />
        </div>
      )}

      <Toast message={toast} onDismiss={closeToast} />
    </div>
  )
}
