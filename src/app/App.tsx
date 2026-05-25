import { loadThemeId } from '../theme/themeStorage.ts'
import { isOneAiResearchDemoRoute } from '../integration/oneaiResearchDemoRoute.ts'
import { parsePopupSearch } from '../workspace/popupBridge.ts'
import { ThemeProvider } from './ThemeContext.tsx'
import { WorkspaceProvider } from './WorkspaceContext.tsx'
import { ThemeRootShell } from '../ui/theme/ThemeRootShell.tsx'
import { PopupWorkspace } from '../ui/workspace/PopupWorkspace.tsx'
import { OneAiResearchDemoWorkspace } from '../ui/research/OneAiResearchDemoWorkspace.tsx'

const search =
  typeof window !== 'undefined' ? window.location.search : ''

const popupParams =
  typeof window !== 'undefined'
    ? parsePopupSearch(search)
    : { popup: false, tabId: 'tab-btc', panel: 'ladder' as const }

const researchDemoMode =
  typeof window !== 'undefined' ? isOneAiResearchDemoRoute(search) : false

export default function App() {
  const themeId = typeof window !== 'undefined' ? loadThemeId() : 'theme1'

  if (researchDemoMode) {
    return <OneAiResearchDemoWorkspace />
  }

  if (popupParams.popup) {
    return (
      <ThemeProvider>
        <WorkspaceProvider
          key={`popup-${themeId}`}
          themeId={themeId}
          popupMode
          popupTabId={popupParams.tabId}
          popupPanel={popupParams.panel}
        >
          <PopupWorkspace />
        </WorkspaceProvider>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <ThemeRootShell />
    </ThemeProvider>
  )
}
