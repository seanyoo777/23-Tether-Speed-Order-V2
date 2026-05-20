import { useWorkspace } from '../../app/WorkspaceContext.tsx'
import {
  LAYOUT_PRESET_LABELS,
  MONITOR_PRESET_LABELS,
} from '../../workspace/presets.ts'
import type { LayoutPresetId, MonitorPresetId } from '../../workspace/types.ts'

const LAYOUTS = (
  Object.keys(LAYOUT_PRESET_LABELS) as LayoutPresetId[]
).filter((id) => !id.startsWith('theme2'))
const MONITORS = Object.keys(MONITOR_PRESET_LABELS) as MonitorPresetId[]

export function WorkspaceToolbar() {
  const ws = useWorkspace()
  const { snapshot, setLayoutPreset, setMonitorPreset, save, load, openPopup } =
    ws

  return (
    <div className="ws-toolbar">
      <span className="ws-label">레이아웃</span>
      <select
        value={snapshot.layoutPreset}
        onChange={(e) => setLayoutPreset(e.target.value as LayoutPresetId)}
      >
        {LAYOUTS.map((id) => (
          <option key={id} value={id}>
            {LAYOUT_PRESET_LABELS[id] ?? id}
          </option>
        ))}
      </select>

      <span className="ws-label">모니터</span>
      <select
        value={snapshot.monitorPreset}
        onChange={(e) => setMonitorPreset(e.target.value as MonitorPresetId)}
      >
        {MONITORS.map((id) => (
          <option key={id} value={id}>
            {MONITOR_PRESET_LABELS[id]}
          </option>
        ))}
      </select>

      <button type="button" onClick={() => save()}>
        저장
      </button>
      <button type="button" onClick={() => load()}>
        불러오기
      </button>
      <button
        type="button"
        onClick={() => openPopup('ladder')}
        title="호가 팝업"
      >
        호가 팝업
      </button>
      <span className="ws-saved muted">
        {snapshot.savedAt
          ? new Date(snapshot.savedAt).toLocaleTimeString()
          : '—'}
      </span>
    </div>
  )
}
