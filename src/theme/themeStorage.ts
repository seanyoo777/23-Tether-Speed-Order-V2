import type { ThemeId } from './types.ts'
import { THEME_STORAGE_KEY } from './types.ts'

const memoryTheme: { id?: ThemeId } = {}

function store(): Pick<Storage, 'getItem' | 'setItem'> {
  if (typeof localStorage !== 'undefined') return localStorage
  return {
    getItem: () => memoryTheme.id ?? null,
    setItem: (_k, v) => {
      memoryTheme.id = v as ThemeId
    },
  }
}

export function loadThemeId(): ThemeId {
  try {
    const raw = store().getItem(THEME_STORAGE_KEY)
    if (raw === 'theme2') return 'theme2'
    return 'theme1'
  } catch {
    return 'theme1'
  }
}

export function saveThemeId(themeId: ThemeId): void {
  store().setItem(THEME_STORAGE_KEY, themeId)
}

export function clearThemeStorage(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(THEME_STORAGE_KEY)
  }
  delete memoryTheme.id
}
