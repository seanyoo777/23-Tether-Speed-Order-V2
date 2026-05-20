import type { AggressiveSide } from '../visualDepth/types.ts'

type Props = {
  velocity: number
  aggressiveSide: AggressiveSide
  spread: number
  spreadCompressed: boolean
  panicMode: boolean
}

export function VelocityTicker({
  velocity,
  aggressiveSide,
  spread,
  spreadCompressed,
  panicMode,
}: Props) {
  return (
    <div
      className={[
        'velocity-ticker',
        panicMode ? 'panic' : '',
        aggressiveSide === 'buy' ? 'agg-buy' : '',
        aggressiveSide === 'sell' ? 'agg-sell' : '',
        spreadCompressed ? 'spread-tight' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="체결 속도"
    >
      <span className="vt-label">VEL</span>
      <span className="vt-value tabular">{velocity}</span>
      <span className="vt-spread tabular">
        SP {spread.toFixed(spread >= 10 ? 0 : 2)}
      </span>
      {aggressiveSide !== 'neutral' && (
        <span className={`vt-pulse vt-${aggressiveSide}`}>
          {aggressiveSide === 'buy' ? '▲ BUY' : '▼ SELL'}
        </span>
      )}
    </div>
  )
}
