type Props = {
  disabled: boolean
  hedgeEnabled: boolean
  hasLong: boolean
  hasShort: boolean
  onOpenLong: () => void
  onOpenShort: () => void
  onCloseLong: () => void
  onCloseShort: () => void
}

/** Hedge 4-button row — 롱/숏 진입·청산 (02-style, mock only). */
export function SpeedOrderHedgePanel({
  disabled,
  hedgeEnabled,
  hasLong,
  hasShort,
  onOpenLong,
  onOpenShort,
  onCloseLong,
  onCloseShort,
}: Props) {
  if (!hedgeEnabled) return null

  return (
    <section className="hedge-card card" data-testid="speed-hedge-panel">
      <h2>헷지 주문</h2>
      <p className="hedge-hint muted">
        Hedge: 진입(롱/숏)과 청산 분리 — 매도는 숏 진입, 롱 청산 아님
      </p>
      <div className="hedge-grid-open conv-row">
        <button
          type="button"
          disabled={disabled}
          className="btn-buy btn-hedge-open-long"
          onClick={onOpenLong}
        >
          롱 진입
        </button>
        <button
          type="button"
          disabled={disabled}
          className="btn-sell btn-hedge-open-short"
          onClick={onOpenShort}
        >
          숏 진입
        </button>
      </div>
      <div className="hedge-grid-close conv-row">
        <button
          type="button"
          disabled={disabled || !hasLong}
          className="btn-hedge-close-long"
          onClick={onCloseLong}
        >
          롱 청산
        </button>
        <button
          type="button"
          disabled={disabled || !hasShort}
          className="btn-hedge-close-short"
          onClick={onCloseShort}
        >
          숏 청산
        </button>
      </div>
    </section>
  )
}
