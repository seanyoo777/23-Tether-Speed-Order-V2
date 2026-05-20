import { useWorkspace } from '../../app/WorkspaceContext.tsx'
import type { CoinSymbol } from '../../types/productTypes.ts'
import { COIN_SYMBOLS } from '../../types/productTypes.ts'

export function WorkspaceTabBar() {
  const ws = useWorkspace()
  const { snapshot, activeTab, setActiveTab, addTab, closeTab } = ws

  return (
    <nav className="ws-tabs" aria-label="워크스페이스 탭">
      {snapshot.tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={['ws-tab', tab.id === activeTab.id ? 'on' : ''].join(' ')}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
          {snapshot.tabs.length > 1 && (
            <span
              className="ws-tab-x"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                  closeTab(tab.id)
                }
              }}
            >
              ×
            </span>
          )}
        </button>
      ))}
      <div className="ws-tab-add">
        {COIN_SYMBOLS.filter(
          (s) => !snapshot.tabs.some((t) => t.symbol === s),
        ).map((sym) => (
          <button
            key={sym}
            type="button"
            className="ws-add-sym"
            onClick={() => addTab(sym as CoinSymbol)}
          >
            +{sym.replace('USDT', '')}
          </button>
        ))}
      </div>
    </nav>
  )
}
