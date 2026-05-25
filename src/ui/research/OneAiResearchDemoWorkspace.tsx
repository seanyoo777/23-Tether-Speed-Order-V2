import { useEffect, useState } from 'react'
import { buildHtsHomeUrl } from '../../integration/oneaiResearchDemoRoute.ts'
import {
  loadOneAiResearchDemoFeed,
  type LoadOneAiResearchDemoFeedResult,
} from '../../integration/loadOneAiResearchDemoFeed.ts'
import type { OneAiSignalResearchFeedContract } from '../../integration/oneaiResearchFeedContract.ts'
import { OneAiResearchDemoPanel } from './OneAiResearchDemoPanel.tsx'

export function OneAiResearchDemoWorkspace() {
  const [result, setResult] = useState<LoadOneAiResearchDemoFeedResult | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadOneAiResearchDemoFeed().then((r) => {
      if (!cancelled) setResult(r)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const feed: OneAiSignalResearchFeedContract | null = result?.ok ? result.feed : null

  return (
    <div className="oneai-research-workspace" data-testid="oneai-research-demo-workspace">
      <header className="oneai-research-toolbar">
        <a href={buildHtsHomeUrl()} className="oneai-research-back">
          ← HTS (mock)
        </a>
        <span className="ws-label">WORKSPACE: research_demo</span>
        <span className="muted">OneAI feed consumer POC · Step 3</span>
      </header>

      {!result && <p className="muted panel">Loading OneAI feed…</p>}

      {result && !result.ok && (
        <section className="panel oneai-research-error" data-testid="oneai-research-load-error">
          <h2>Feed load failed</h2>
          <p>{result.message}</p>
          <p className="muted">
            Sync: copy 03-OneAI/exports/research_demo_feed.sample.json → public/oneai/ (see
            docs/ONEAI_FEED_CONSUMER_POC.md)
          </p>
        </section>
      )}

      {feed && <OneAiResearchDemoPanel feed={feed} />}
    </div>
  )
}
