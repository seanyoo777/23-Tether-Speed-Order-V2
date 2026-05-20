import { loadThemeId } from '../theme/themeStorage.ts'
import { parsePopupSearch } from '../workspace/popupBridge.ts'
import { ThemeProvider } from './ThemeContext.tsx'
import { WorkspaceProvider } from './WorkspaceContext.tsx'
import { ThemeRootShell } from '../ui/theme/ThemeRootShell.tsx'
import { PopupWorkspace } from '../ui/workspace/PopupWorkspace.tsx'

const popupParams =
  typeof window !== 'undefined'
    ? parsePopupSearch(window.location.search)
    : { popup: false, tabId: 'tab-btc', panel: 'ladder' as const }

export default function App() {
  const themeId = typeof window !== 'undefined' ? loadThemeId() : 'theme1'

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
