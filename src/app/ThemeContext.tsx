import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemeId } from '../theme/types.ts'
import { loadThemeId, saveThemeId } from '../theme/themeStorage.ts'

type ThemeApi = {
  themeId: ThemeId
  setThemeId: (id: ThemeId) => void
  toggleTheme: () => void
}

const Ctx = createContext<ThemeApi | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeState] = useState<ThemeId>(() => loadThemeId())

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeState(id)
    saveThemeId(id)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeId(themeId === 'theme1' ? 'theme2' : 'theme1')
  }, [themeId, setThemeId])

  const api = useMemo(
    () => ({ themeId, setThemeId, toggleTheme }),
    [themeId, setThemeId, toggleTheme],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeApi {
  const t = useContext(Ctx)
  if (!t) throw new Error('useTheme outside ThemeProvider')
  return t
}
