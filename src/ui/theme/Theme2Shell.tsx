import { useEffect, useState } from 'react'
import { TradingProvider } from '../../app/TradingContext.tsx'
import { useWorkspace } from '../../app/WorkspaceContext.tsx'
import type { CoinSymbol } from '../../types/productTypes.ts'
import { ProductSymbolSelector } from '../ProductSymbolSelector.tsx'
import { WorkspaceTabBar } from '../workspace/WorkspaceTabBar.tsx'
import { Theme2FloatPane } from './Theme2FloatPane.tsx'
import { Theme2Toolbar } from './Theme2Toolbar.tsx'
import { ThemeToggle } from './ThemeToggle.tsx'
import { OrderFlowHud } from '../OrderFlowHud.tsx'

export function Theme2Shell() {
  const ws = useWorkspace()
  const { activeTab, registry, snapshot } = ws
  const session = registry.getOrCreate(activeTab.id, activeTab.symbol)
  const [, tick] = useState(0)
  const lastPrice = session.getLastPrice(activeTab.symbol)
  const st = session.getState()

  useEffect(() => {
    const unsub = session.subscribe(() => tick((n) => n + 1))
    return () => {
      unsub()
    }
  }, [session])

  useEffect(() => {
    session.setSymbol(activeTab.symbol)
  }, [activeTab.symbol, session])

  useEffect(() => {
    for (const tab of snapshot.tabs) {
      registry.getOrCreate(tab.id, tab.symbol).startTicker()
    }
    const demoId = window.setInterval(() => {
      for (const s of registry.list()) {
        s._engines.ticker.autoTickOnce()
      }
    }, 1200)
    return () => {
      window.clearInterval(demoId)
      for (const s of registry.list()) s.stopTicker()
    }
  }, [registry, snapshot.tabs])

  return (
    <div
      className={[
        'theme2-root',
        'workspace-root',
        'ultra-compact',
        `layout-${snapshot.layoutPreset}`,
      ].join(' ')}
    >
      <header className="ws-chrome theme2-chrome">
        <span className="title">23 · THEME2</span>
        <span className="mock-badge">MOCK</span>
        <ThemeToggle />
        <ProductSymbolSelector
          product={st.productType}
          symbol={st.symbol}
          lastPrice={lastPrice}
          ladderDirection={st.ladderDirection}
          hedgeMode={st.hedgeMode}
          onProduct={(p) => session.setProduct(p)}
          onSymbol={(s) => ws.setWorkspaceSymbol(s as CoinSymbol)}
        />
        <Theme2Toolbar />
        <OrderFlowHud session={session} version={st.version} />
      </header>
      <WorkspaceTabBar />
      <div className="theme2-canvas">
        <TradingProvider session={session} enableDemoTick={false}>
          <Theme2FloatPane />
        </TradingProvider>
      </div>
    </div>
  )
}
