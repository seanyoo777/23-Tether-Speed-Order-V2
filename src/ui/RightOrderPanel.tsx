import { getSymbolConfig } from '../types/productTypes.ts'
import { supportsHedgeMode, useHedgeLegTrading } from '../types/productTypes.ts'
import { protectionPrices } from '../engine/pnlEngine.ts'
import { CoinOrderPanel } from './CoinOrderPanel.tsx'
import {
  pendingMitStopForPosition,
  pendingProtectionLabels,
} from '../engine/protectionBook.ts'
import type { CoinOrderEntryKind, LadderDirection } from '../types/tradingTypes.ts'
import type { Position, StoredOrder } from '../types/tradingTypes.ts'
import type { ProductType } from '../types/productTypes.ts'

type Props = {
  disabled: boolean
  productType: ProductType
  symbol: string
  ladderDirection: LadderDirection
  sharedOrderQty: number
  selectedPosition: Position | null
  pendingOrders?: readonly StoredOrder[]
  tpTicks: number
  slTicks: number
  protectPercent: 25 | 50 | 75 | 100
  orderEntryKind: CoinOrderEntryKind
  limitEntryPrice: number
  lastPrice: number
  onOrderEntryKind: (k: CoinOrderEntryKind) => void
  onLimitEntryPrice: (p: number) => void
  onSharedOrderQty: (q: number) => void
  onPanelBuy: () => void
  onPanelSell: () => void
  onTpTicks: (n: number) => void
  onSlTicks: (n: number) => void
  onProtectPercent: (p: 25 | 50 | 75 | 100) => void
  onRegisterProtection: () => void
  onRegisterMit: (side: 'LONG' | 'SHORT', trigger: number) => void
  hedgeMode: boolean
  onHedgeMode: (on: boolean) => void
}

export function RightOrderPanel({
  disabled,
  productType,
  symbol,
  ladderDirection,
  sharedOrderQty,
  selectedPosition,
  pendingOrders = [],
  tpTicks,
  slTicks,
  protectPercent,
  orderEntryKind,
  limitEntryPrice,
  lastPrice,
  onOrderEntryKind,
  onLimitEntryPrice,
  onSharedOrderQty,
  onPanelBuy,
  onPanelSell,
  onTpTicks,
  onSlTicks,
  onProtectPercent,
  onRegisterProtection,
  onRegisterMit,
  hedgeMode,
  onHedgeMode,
}: Props) {
  const cfg = getSymbolConfig(symbol)
  const hedgeExchange = useHedgeLegTrading(productType, hedgeMode)
  const prot =
    selectedPosition && cfg
      ? protectionPrices(
          selectedPosition.side,
          selectedPosition.avgPrice,
          cfg.tick,
          tpTicks,
          slTicks,
        )
      : null

  const last = lastPrice || cfg?.basePrice || 0
  const tick = cfg?.tick ?? 0.5
  return (
    <aside className="right-stack">
      {hedgeExchange ? (
        <div className="mode-badge hedge-exchange-badge">HEDGE · 거래소 방식</div>
      ) : (
        <div
          className={`mode-badge ${ladderDirection === 'buy' ? 'buy-mode' : 'sell-mode'}`}
          title="호가 클릭 시 방향 자동 전환 (Q/A·B/V 단축키)"
        >
          {ladderDirection === 'buy' ? 'BUY' : 'SELL'} · 호가 지정가
        </div>
      )}

      {supportsHedgeMode(productType) ? (
        <section className="hedge-mode-card card">
          <label className="hedge-mode-toggle">
            <input
              type="checkbox"
              checked={hedgeMode}
              disabled={disabled}
              onChange={(e) => onHedgeMode(e.target.checked)}
            />
            <span>헷지 모드</span>
            <span className="muted">
              {hedgeMode
                ? '매수·매도 거래소 규칙 · 호가 청산'
                : '원웨이 (반대 체결 시 청산·전환)'}
            </span>
          </label>
        </section>
      ) : null}

      <CoinOrderPanel
        disabled={disabled}
        entryKind={orderEntryKind}
        onEntryKind={onOrderEntryKind}
        limitPrice={limitEntryPrice}
        onLimitPrice={onLimitEntryPrice}
        lastPrice={last}
        tick={tick}
        sharedOrderQty={sharedOrderQty}
        onSharedOrderQty={onSharedOrderQty}
        onBuy={onPanelBuy}
        onSell={onPanelSell}
        variant={hedgeExchange ? 'hedge' : 'one-way'}
      />

      <section className="mit-card card">
        <h2>MIT · STOP</h2>
        <div className="mit-row">
          <button
            type="button"
            className="btn-buy"
            disabled={disabled}
            onClick={() => onRegisterMit('LONG', last + (cfg?.tick ?? 1) * 2)}
          >
            MIT 매수
          </button>
          <button
            type="button"
            className="btn-sell"
            disabled={disabled}
            onClick={() => onRegisterMit('SHORT', last - (cfg?.tick ?? 1) * 2)}
          >
            MIT 매도
          </button>
        </div>
      </section>

      <section className="tpsl-card card">
        <h2>자동익절/손절</h2>
        {selectedPosition ? (
          <>
            {(() => {
              const protTag = pendingProtectionLabels(
                pendingOrders,
                selectedPosition.positionId,
              )
              const mitN = pendingMitStopForPosition(
                pendingOrders,
                selectedPosition.positionId,
              )
              if (!protTag && mitN === 0) return null
              return (
                <p className="linked-orders-hint">
                  걸린 주문:{' '}
                  {[protTag, mitN > 0 ? `조건 ${mitN}건` : '']
                    .filter(Boolean)
                    .join(' · ')}
                  <span className="muted"> (종목·포지션 바꿔도 유지)</span>
                </p>
              )
            })()}
            <p className="pos-hero tabular">
              <span className={selectedPosition.side === 'LONG' ? 'long' : 'short'}>
                {selectedPosition.side}
              </span>
              <span>
                평단 <strong>{selectedPosition.avgPrice}</strong>
              </span>
              <span>
                수량 <strong>{selectedPosition.qty}</strong>
              </span>
            </p>
            <label className="field-compact">
              익절틱
              <input
                type="number"
                value={tpTicks}
                onChange={(e) => onTpTicks(Number(e.target.value))}
              />
              {prot && <em className="tabular">익절 {prot.tpPrice}</em>}
            </label>
            <label className="field-compact">
              손절틱
              <input
                type="number"
                value={slTicks}
                onChange={(e) => onSlTicks(Number(e.target.value))}
              />
              {prot && <em className="tabular">손절 {prot.slPrice}</em>}
            </label>
            <div className="pct-row">
              {([25, 50, 75, 100] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={protectPercent === p ? 'on' : ''}
                  onClick={() => onProtectPercent(p)}
                >
                  {p}%
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-register"
              disabled={disabled}
              onClick={onRegisterProtection}
            >
              보호주문
            </button>
          </>
        ) : (
          <p className="muted">포지션 선택</p>
        )}
      </section>
    </aside>
  )
}
