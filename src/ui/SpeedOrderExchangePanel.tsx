type Props = {
  disabled: boolean
  hasLong: boolean
  hasShort: boolean
  onBuy: () => void
  onSell: () => void
}

/** Coin hedge — exchange-style 매수/매도 (no 4-button / no 전환). */
export function SpeedOrderExchangePanel({
  disabled,
  hasLong,
  hasShort,
  onBuy,
  onSell,
}: Props) {
  return (
    <section className="exchange-order card" data-testid="speed-exchange-panel">
      <h2>주문</h2>
      <p className="exchange-hint muted">
        매수: 숏 있으면 숏 청산 → 없으면 롱 진입 · 매도: 숏 진입(신규) · 롱 청산은 호가
        「청산」
      </p>
      <div className="conv-row">
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
      <p className="exchange-leg-hint muted">
        {hasLong ? '롱 보유 · ' : ''}
        {hasShort ? '숏 보유 · ' : ''}
        호가 평단 줄에 <strong>청산</strong> 버튼
      </p>
    </section>
  )
}
