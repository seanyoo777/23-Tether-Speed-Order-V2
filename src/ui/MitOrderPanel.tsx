import type { StoredOrder } from '../types/tradingTypes.ts'
import { badgeClass, resolveQueuedStatus } from '../mitAdvanced/queuedStatus.ts'
import { getSymbolConfig } from '../types/productTypes.ts'

type Props = {
  symbol: string
  lastPrice: number
  orders: readonly StoredOrder[]
  /** 있으면 이 포지션에 묶인 주문만 (종목 바꿔도 유지 표시) */
  selectedPositionId?: string | null
  onCancel: (id: string) => void
}

export function MitOrderPanel({
  symbol,
  lastPrice,
  orders,
  selectedPositionId = null,
  onCancel,
}: Props) {
  const ref = getSymbolConfig(symbol)?.basePrice ?? lastPrice
  const rows = orders
    .filter((o) => {
      if (o.status !== 'pending') return false
      if (o.kind !== 'MIT' && o.kind !== 'STOP') return false
      if (selectedPositionId) return o.positionId === selectedPositionId
      return o.symbol === symbol
    })
    .map((o) => {
      const sym = o.symbol
      const refP =
        getSymbolConfig(sym, o.productType)?.basePrice ??
        (sym === symbol ? lastPrice : ref)
      const tick = getSymbolConfig(sym, o.productType)?.tick ?? 0.5
      return {
        id: o.id,
        symbol: sym,
        label: o.kind === 'MIT' ? 'MIT' : 'STP',
        kind: o.kind,
        side: o.side,
        triggerPrice: o.triggerPrice,
        qty: o.qty,
        status: resolveQueuedStatus(o, lastPrice, refP, tick),
        createdAt: o.createdAt,
      }
    })

  return (
    <section className="mit-panel card">
      <h2>MIT / STOP</h2>
      {selectedPositionId ? (
        <p className="mit-panel-hint muted">선택 포지션에 묶인 조건주문</p>
      ) : null}
      <ul className="mit-list">
        {rows.length === 0 && <li className="muted">대기 주문 없음</li>}
        {rows.map((m) => (
          <li key={m.id} className={`mit-row om-${m.kind}`}>
            <span className={badgeClass(m.status)}>{m.status}</span>
            {m.symbol !== symbol ? (
              <span className="mit-sym">{m.symbol.replace('USDT', '')}</span>
            ) : null}
            <span className="mit-kind">{m.label}</span>
            <span className={m.side === 'LONG' ? 'long' : 'short'}>{m.side}</span>
            <span className="tabular">{m.triggerPrice}</span>
            <span className="tabular">{m.qty}</span>
            {m.status === 'WAITING' || m.status === 'ARMED' ? (
              <button type="button" className="mit-x" onClick={() => onCancel(m.id)}>
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
