import { useTheme } from '../../app/ThemeContext.tsx'
import { THEME_LABELS } from '../../theme/types.ts'

export function ThemeToggle() {
  const { themeId, setThemeId } = useTheme()

  return (
    <div className="theme-toggle" role="group" aria-label="테마 전환">
      {(['theme1', 'theme2'] as const).map((id) => (
        <button
          key={id}
          type="button"
          className={['theme-btn', themeId === id ? 'on' : ''].join(' ')}
          onClick={() => setThemeId(id)}
        >
          {THEME_LABELS[id]}
        </button>
      ))}
    </div>
  )
}
