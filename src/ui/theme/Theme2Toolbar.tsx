import { useWorkspace } from '../../app/WorkspaceContext.tsx'
import { THEME2_LAYOUT_LABELS } from '../../theme/theme2Presets.ts'
import type { LayoutPresetId } from '../../workspace/types.ts'

const THEME2_LAYOUTS = Object.keys(THEME2_LAYOUT_LABELS) as LayoutPresetId[]

export function Theme2Toolbar() {
  const ws = useWorkspace()
  const { snapshot, setLayoutPreset, save, load, openPopup } = ws

  return (
    <div className="ws-toolbar theme2-toolbar">
      <span className="ws-label">THEME2</span>
      <select
        value={snapshot.layoutPreset}
        onChange={(e) => setLayoutPreset(e.target.value as LayoutPresetId)}
      >
        {THEME2_LAYOUTS.map((id) => (
          <option key={id} value={id}>
            {THEME2_LAYOUT_LABELS[id]}
          </option>
        ))}
      </select>
      <button type="button" onClick={() => save()}>
        저장
      </button>
      <button type="button" onClick={() => load()}>
        불러오기
      </button>
      <button type="button" onClick={() => openPopup('ladder')}>
        호가 팝업
      </button>
      <span className="muted">플로팅 전용 · MOCK</span>
    </div>
  )
}
