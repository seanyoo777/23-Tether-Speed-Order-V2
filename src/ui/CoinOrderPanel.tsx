import type { CoinOrderEntryKind } from '../types/tradingTypes.ts'
import { RollingQty } from './RollingQty.tsx'

type Props = {
  disabled: boolean
  entryKind: CoinOrderEntryKind
  onEntryKind: (k: CoinOrderEntryKind) => void
  limitPrice: number
  onLimitPrice: (p: number) => void
  lastPrice: number
  tick: number
  sharedOrderQty: number
  onSharedOrderQty: (q: number) => void
  onBuy: () => void
  onSell: () => void
  variant: 'one-way' | 'hedge'
}

export function CoinOrderPanel({
  disabled,
  entryKind,
  onEntryKind,
  limitPrice,
  onLimitPrice,
  lastPrice,
  tick,
  sharedOrderQty,
  onSharedOrderQty,
  onBuy,
  onSell,
  variant,
}: Props) {
  return (
    <section className="order-card card coin-order-panel" data-testid="coin-order-panel">
      <h2>주문</h2>
      <div className="order-type-tabs" role="tablist" aria-label="주문 유형">
        <button
          type="button"
          role="tab"
          aria-selected={entryKind === 'market'}
          className={entryKind === 'market' ? 'on' : ''}
          disabled={disabled}
          onClick={() => onEntryKind('market')}
        >
          시장가
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={entryKind === 'limit'}
          className={entryKind === 'limit' ? 'on' : ''}
          disabled={disabled}
          onClick={() => onEntryKind('limit')}
        >
          지정가
        </button>
      </div>
      {entryKind === 'limit' ? (
        <label className="field-compact limit-price-field">
          지정가
          <input
            type="number"
            className="tabular"
            step={tick}
            disabled={disabled}
            value={limitPrice}
            onChange={(e) => onLimitPrice(Number(e.target.value))}
          />
        </label>
      ) : (
        <p className="market-ref muted tabular">
          시세 <strong>{lastPrice}</strong>
        </p>
      )}
      <RollingQty
        value={sharedOrderQty}
        disabled={disabled}
        onChange={onSharedOrderQty}
      />
      <div className="conv-row exchange-btns">
        <button
          type="button"
          className="btn-buy btn-exchange-buy"
          disabled={disabled}
          onClick={onBuy}
        >
          매수
        </button>
        <button
          type="button"
          className="btn-sell btn-exchange-sell"
          disabled={disabled}
          onClick={onSell}
        >
          매도
        </button>
      </div>
      <p className="coin-order-hint muted">
        {variant === 'hedge'
          ? '헷지: 매수·매도 거래소 규칙 · 롱 청산은 호가 「청산」'
          : '원웨이: 반대 포지션 있으면 청산 후 잔량 체결 · 호가 클릭=지정가'}
      </p>
    </section>
  )
}
