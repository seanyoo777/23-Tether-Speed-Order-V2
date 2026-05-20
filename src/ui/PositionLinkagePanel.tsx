import type { Position, StoredOrder } from '../types/tradingTypes.ts'

type Props = {
  positions: readonly Position[]
  orders: readonly StoredOrder[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function PositionLinkagePanel({
  positions,
  orders,
  selectedId,
  onSelect,
}: Props) {
  if (positions.length === 0) {
    return (
      <section className="linkage-panel card">
        <h2>TP/SL 연결</h2>
        <p className="muted">포지션 없음</p>
      </section>
    )
  }

  return (
    <section className="linkage-panel card">
      <h2>TP/SL 연결</h2>
      <ul className="link-tree">
        {positions.map((p) => {
          const linked = orders.filter(
            (o) =>
              o.positionId === p.positionId &&
              (o.kind === 'PROTECTION_TP' || o.kind === 'PROTECTION_SL') &&
              o.status === 'pending',
          )
          return (
            <li
              key={p.positionId}
              className={p.positionId === selectedId ? 'on' : ''}
            >
              <button
                type="button"
                className="tree-root"
                onClick={() => onSelect(p.positionId)}
              >
                <span className={p.side === 'LONG' ? 'long' : 'short'}>{p.side}</span>
                <span className="tabular">{p.qty}</span>
              </button>
              <ul className="tree-children">
                {linked.length === 0 && (
                  <li className="muted small">└ TP/SL 없음</li>
                )}
                {linked.map((o) => (
                  <li key={o.id} className={`leaf om-${o.kind}`}>
                    └ {o.kind === 'PROTECTION_TP' ? 'TP' : 'SL'}{' '}
                    <span className="tabular">{o.triggerPrice}</span> × {o.qty}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
