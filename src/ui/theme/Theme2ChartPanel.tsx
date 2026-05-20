type Props = {
  label: string
  symbol: string
  lastPrice: number
}

/** Mock chart slot — no live feed. */
export function Theme2ChartPanel({ label, symbol, lastPrice }: Props) {
  const bars = [42, 58, 45, 62, 55, 70, 48, 65, 52, 68, 60, 72]
  return (
    <div className="theme2-chart-panel">
      <header className="theme2-chart-head">
        <span>{label}</span>
        <span className="tabular">{symbol}</span>
        <span className="tabular chart-price">{lastPrice}</span>
      </header>
      <div className="theme2-chart-mock" aria-hidden>
        {bars.map((h, i) => (
          <span key={i} className="chart-bar" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
