import type {
  OneAiSignalMarketType,
  OneAiSignalResearchFeedContract,
} from '../../integration/oneaiResearchFeedContract.ts'

const MARKET_LABEL: Record<OneAiSignalMarketType, string> = {
  option: '옵션',
  futures: '선물',
  stock: '주식',
  crypto: '코인',
}

type Props = {
  feed: OneAiSignalResearchFeedContract
}

export function OneAiResearchDemoPanel({ feed }: Props) {
  return (
    <section className="panel oneai-research-panel" data-testid="oneai-research-demo-panel">
      <header className="oneai-research-header">
        <h2>OneAI Signal Research</h2>
        <p className="muted">
          research_demo · read-only · {feed.items.length} signals · source {feed.source}
        </p>
        <p className="muted oneai-research-policy">
          주식 레인: 표시용 direction — 주문/체결 연동 없음 (03 position policy)
        </p>
      </header>

      <div className="oneai-research-markets">
        {feed.markets.map((m) => (
          <span key={m} className="oneai-research-chip">
            {MARKET_LABEL[m]} ({feed.byMarket[m]?.length ?? 0})
          </span>
        ))}
      </div>

      <ul className="oneai-research-list">
        {feed.items.map((item) => (
          <li key={item.signalId} className="oneai-research-row" data-testid={`oneai-signal-${item.signalId}`}>
            <div className="oneai-research-row-top">
              <strong>{item.signalId}</strong>
              <span className="oneai-research-badge">{item.marketType}</span>
              <span className="oneai-research-badge">{item.direction}</span>
              <span className="oneai-research-conf">{item.confidenceMock}%</span>
            </div>
            <div className="oneai-research-strategy">{item.strategyType}</div>
            <p className="oneai-research-summary">{item.reasoningSummary}</p>
            {item.marketRegimeRef && (
              <p className="muted">
                regime: {item.marketRegimeRef.regimeLabel} ({item.marketRegimeRef.regime})
              </p>
            )}
            {item.tags.length > 0 && <p className="muted">tags: {item.tags.join(', ')}</p>}
          </li>
        ))}
      </ul>

      <footer className="muted oneai-research-footer">
        MOCK ONLY · generated {feed.generatedAt} · no trade execution
      </footer>
    </section>
  )
}
