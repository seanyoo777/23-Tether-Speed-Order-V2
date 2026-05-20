import { useTheme } from '../../app/ThemeContext.tsx'
import { WorkspaceProvider } from '../../app/WorkspaceContext.tsx'
import { WorkspaceShell } from '../workspace/WorkspaceShell.tsx'
import { Theme2Shell } from './Theme2Shell.tsx'

export function ThemeRootShell() {
  const { themeId } = useTheme()

  return (
    <WorkspaceProvider key={themeId} themeId={themeId}>
      {themeId === 'theme1' ? <WorkspaceShell /> : <Theme2Shell />}
    </WorkspaceProvider>
  )
}
