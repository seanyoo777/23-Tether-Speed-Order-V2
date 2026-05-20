import { useEffect, useState } from 'react'
import { TradingProvider } from '../../app/TradingContext.tsx'
import { useWorkspace } from '../../app/WorkspaceContext.tsx'
import { MONITOR_PRESET_CLASS } from '../../workspace/presets.ts'
import { SpeedOrderPane } from '../SpeedOrderPane.tsx'
import { WorkspaceTabBar } from './WorkspaceTabBar.tsx'
import { WorkspaceToolbar } from './WorkspaceToolbar.tsx'
import { ThemeToggle } from '../theme/ThemeToggle.tsx'

export function WorkspaceShell() {
  const ws = useWorkspace()
  const { activeTab, registry, snapshot } = ws
  const session = registry.getOrCreate(activeTab.id, activeTab.symbol)
  const [, tick] = useState(0)

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

  const layoutClass = `layout-${snapshot.layoutPreset}`
  const monClass = MONITOR_PRESET_CLASS[snapshot.monitorPreset]

  return (
    <div className={['workspace-root', 'theme1-root', layoutClass, monClass].join(' ')}>
      <header className="ws-chrome">
        <span className="title">23 · Speed Order</span>
        <span className="mock-badge">MOCK</span>
        <ThemeToggle />
        <WorkspaceToolbar />
      </header>
      <WorkspaceTabBar />
      <TradingProvider session={session} enableDemoTick={false}>
        <SpeedOrderPane />
      </TradingProvider>
    </div>
  )
}
