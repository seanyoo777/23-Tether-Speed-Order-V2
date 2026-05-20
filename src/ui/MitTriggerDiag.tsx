import { useMemo, useState } from 'react'
import type { StoredOrder } from '../types/tradingTypes.ts'

type Props = {
  symbol: string
  lastPrice: number
  tick: number
  orders: readonly StoredOrder[]
  onApplyPrice: (price: number) => void
}

/** MOCK-only — set last price to test MIT/STOP trigger without waiting for auto tick. */
export function MitTriggerDiag({
  symbol,
  lastPrice,
  tick,
  orders,
  onApplyPrice,
}: Props) {
  const pending = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.symbol === symbol &&
          o.status === 'pending' &&
          (o.kind === 'MIT' || o.kind === 'STOP'),
      ),
    [orders, symbol],
  )

  const [custom, setCustom] = useState('')

  if (pending.length === 0) {
    return (
      <div className="diag-mit-test">
        <p className="diag-mit-title">MIT/STOP 테스트</p>
        <p className="muted">대기 주문 없음 — STOP 열 또는 MIT 패널에서 등록</p>
      </div>
    )
  }

  return (
    <div className="diag-mit-test">
      <p className="diag-mit-title">MIT/STOP 테스트</p>
      <p className="diag-mit-hint muted">시세를 트리거에 맞추면 즉시 터짐 (mock)</p>
      <ul className="diag-mit-list">
        {pending.map((o) => (
          <li key={o.id}>
            <span className={o.side === 'LONG' ? 'long' : 'short'}>
              {o.kind === 'MIT' ? 'MIT' : 'STP'} {o.side}
            </span>
            <span className="tabular">{o.triggerPrice}</span>
            <button
              type="button"
              className="diag-mit-btn"
              onClick={() => onApplyPrice(o.triggerPrice)}
            >
              트리거
            </button>
          </li>
        ))}
      </ul>
      <div className="diag-mit-custom">
        <input
          type="number"
          step={tick}
          className="diag-mit-input tabular"
          placeholder={String(lastPrice)}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
        <button
          type="button"
          className="diag-mit-btn"
          onClick={() => {
            const p = Number(custom)
            if (Number.isFinite(p) && p > 0) onApplyPrice(p)
          }}
        >
          적용
        </button>
      </div>
    </div>
  )
}
