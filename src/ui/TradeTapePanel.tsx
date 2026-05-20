import type { AggressiveSide } from '../visualDepth/types.ts'
import type { MarketTapeRow } from './useMarketTape.ts'

type Props = {
  rows: MarketTapeRow[]
  compact?: boolean
  /** Table layout under ladder (screenshot-style) */
  variant?: 'list' | 'pro-table'
  aggressiveSide?: AggressiveSide
}

export function TradeTapePanel({
  rows,
  compact = false,
  variant = 'list',
  aggressiveSide = 'neutral',
}: Props) {
  if (variant === 'pro-table') {
    return (
      <section
        className={[
          'tape panel tape-pro-table',
          aggressiveSide === 'buy' ? 'tape-agg-buy' : '',
          aggressiveSide === 'sell' ? 'tape-agg-sell' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label="시장체결"
      >
        <h2 className="tape-pro-title">시장 체결</h2>
        <div className="tape-pro-scroll">
          <table className="tape-pro-grid tabular">
            <thead>
              <tr>
                <th>가격</th>
                <th>수량</th>
                <th>시간</th>
                <th>방향</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    —
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={[
                    r.side === 'BUY' ? 'buy' : 'sell',
                    r.isNew ? 'tape-new' : '',
                  ].join(' ')}
                >
                  <td className="t-price">{formatNum(r.price)}</td>
                  <td className="t-qty">{r.qty}</td>
                  <td className="t-time">{r.time ?? '—'}</td>
                  <td className="t-side">{r.side === 'BUY' ? '매수' : '매도'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    )
  }

  return (
    <section
      className={[
        'tape panel',
        compact ? 'tape-compact' : '',
        aggressiveSide === 'buy' ? 'tape-agg-buy' : '',
        aggressiveSide === 'sell' ? 'tape-agg-sell' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="시장체결"
    >
      <h2>시장체결</h2>
      <ul className="tape-list tabular">
        {rows.length === 0 && <li className="muted">—</li>}
        {rows.map((r) => (
          <li
            key={r.id}
            className={[
              r.side === 'BUY' ? 'buy' : 'sell',
              r.isNew ? 'tape-new' : '',
            ].join(' ')}
          >
            <span className="t-price">{formatNum(r.price)}</span>
            <span className="t-qty">{r.qty}</span>
            <span className="t-side">{r.side}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatNum(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 })
}
