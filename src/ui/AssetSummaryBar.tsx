type Props = {
  totalEquity: number
  dayRealized: number
  positionEval: number
  lossCutMargin: number
}

export function AssetSummaryBar({
  totalEquity,
  dayRealized,
  positionEval,
  lossCutMargin,
}: Props) {
  return (
    <div className="asset-bar">
      <div className="asset-cell">
        <span className="label">총평가금액</span>
        <span className="value tabular">{totalEquity.toLocaleString()}</span>
      </div>
      <div className="asset-cell">
        <span className="label">당일실현손익</span>
        <span
          className={`value tabular ${dayRealized >= 0 ? 'profit' : 'loss'}`}
        >
          {dayRealized >= 0 ? '+' : ''}
          {dayRealized.toFixed(2)}
        </span>
      </div>
      <div className="asset-cell">
        <span className="label">포지션평가</span>
        <span
          className={`value tabular ${positionEval >= 0 ? 'profit' : 'loss'}`}
        >
          {positionEval >= 0 ? '+' : ''}
          {positionEval.toFixed(2)}
        </span>
      </div>
      <div className="asset-cell">
        <span className="label">로스컷여유</span>
        <span className="value tabular">{lossCutMargin.toLocaleString()}</span>
      </div>
    </div>
  )
}
