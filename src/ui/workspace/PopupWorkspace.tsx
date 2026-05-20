import { useEffect, useState } from 'react'
import { TradingProvider } from '../../app/TradingContext.tsx'
import { useWorkspace } from '../../app/WorkspaceContext.tsx'
import { SpeedOrderPane } from '../SpeedOrderPane.tsx'

export function PopupWorkspace() {
  const ws = useWorkspace()
  const tabId = ws.snapshot.tabs.find((t) => t.id === ws.activeTab.id)?.id
    ?? ws.activeTab.id
  const tab =
    ws.snapshot.tabs.find((t) => t.id === tabId) ?? ws.activeTab
  const session = ws.registry.getOrCreate(tab.id, tab.symbol)
  const [, tick] = useState(0)

  useEffect(() => {
    const unsub = session.subscribe(() => tick((n) => n + 1))
    return () => {
      unsub()
    }
  }, [session])

  useEffect(() => {
    session.setSymbol(tab.symbol)
  }, [tab.symbol, session])

  useEffect(() => {
    session.startTicker()
    const demoId = window.setInterval(() => {
      session._engines.ticker.autoTickOnce()
    }, 1200)
    return () => {
      window.clearInterval(demoId)
      session.stopTicker()
    }
  }, [session])

  return (
    <div className="workspace-popup-root">
      <header className="ws-popup-head">
        <span>
          {tab.label} · {ws.popupPanel ?? 'panel'}
        </span>
        <span className="mock-badge">POPUP MOCK</span>
      </header>
      <TradingProvider session={session} enableDemoTick={false}>
        <SpeedOrderPane popupOnly />
      </TradingProvider>
    </div>
  )
}
