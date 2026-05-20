import { useCallback, useState } from 'react'
import type { DepthVisualMode } from '../visualDepth/types.ts'
import {
  cycleDepthMode,
  loadVisualDepthPrefs,
  saveVisualDepthPrefs,
  type VisualDepthPrefs,
} from '../visualDepth/visualDepthPrefs.ts'

const MODE_LABEL: Record<DepthVisualMode, string> = {
  normal: 'DOM',
  volatile: 'VOL',
  'ultra-dom': 'μDOM',
}

type Props = {
  onPrefsChange?: (prefs: VisualDepthPrefs) => void
}

export function DepthModeToolbar({ onPrefsChange }: Props) {
  const [prefs, setPrefs] = useState(() => loadVisualDepthPrefs())

  const commit = useCallback(
    (next: VisualDepthPrefs) => {
      setPrefs(next)
      saveVisualDepthPrefs(next)
      onPrefsChange?.(next)
    },
    [onPrefsChange],
  )

  return (
    <div className="depth-mode-toolbar" role="toolbar" aria-label="Depth visual mode">
      <button
        type="button"
        className={['dm-btn', prefs.enabled ? 'on' : ''].join(' ')}
        onClick={() => commit({ ...prefs, enabled: !prefs.enabled })}
      >
        DEPTH {prefs.enabled ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        className="dm-btn"
        onClick={() => commit({ ...prefs, mode: cycleDepthMode(prefs.mode) })}
        title="normal → volatile → ultra-dom"
      >
        {MODE_LABEL[prefs.mode]}
      </button>
    </div>
  )
}
