import { useCallback, useState } from 'react'
import { useWorkspaceOptional } from '../app/WorkspaceContext.tsx'
import {
  loadWorkflowPrefs,
  saveWorkflowPrefs,
  type WorkflowPrefs,
} from '../proWorkflow/workflowPrefs.ts'

type Props = {
  onFlattenAll: () => void
  onDetachDock?: () => void
}

export function ProWorkflowBar({ onFlattenAll, onDetachDock }: Props) {
  const ws = useWorkspaceOptional()
  const [prefs, setPrefs] = useState<WorkflowPrefs>(() => loadWorkflowPrefs())

  const patch = useCallback(
    (partial: Partial<WorkflowPrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...partial }
        saveWorkflowPrefs(next)
        if (partial.symbolSync !== undefined && ws) {
          ws.setSymbolSync(partial.symbolSync)
        }
        if (partial.workspaceAutoRestore !== undefined && ws) {
          ws.setWorkspaceAutoRestore(partial.workspaceAutoRestore)
        }
        if (partial.compactTape !== undefined && ws) {
          ws.setCompactTape(partial.compactTape)
        }
        return next
      })
    },
    [ws],
  )

  return (
    <div className="pro-workflow-bar" role="toolbar" aria-label="Pro workflow">
      <button
        type="button"
        className={['pw-btn', prefs.symbolSync ? 'on' : ''].join(' ')}
        title="모든 탭 심볼 동기화"
        onClick={() => patch({ symbolSync: !prefs.symbolSync })}
      >
        {prefs.symbolSync ? '심볼 SYNC' : '심볼 각각'}
      </button>
      <button
        type="button"
        className={['pw-btn', prefs.workspaceAutoRestore ? 'on' : ''].join(' ')}
        title="레이아웃 자동 저장"
        onClick={() =>
          patch({ workspaceAutoRestore: !prefs.workspaceAutoRestore })
        }
      >
        {prefs.workspaceAutoRestore ? '자동복원 ON' : '자동복원 OFF'}
      </button>
      <button
        type="button"
        className={['pw-btn', prefs.compactTape ? 'on' : ''].join(' ')}
        title="체결창 컴팩트"
        onClick={() => patch({ compactTape: !prefs.compactTape })}
      >
        TAPE {prefs.compactTape ? '▪' : '▬'}
      </button>
      {onDetachDock && (
        <button type="button" className="pw-btn" onClick={onDetachDock}>
          DOCK 분리
        </button>
      )}
      <button
        type="button"
        className="pw-btn pw-danger"
        title="F9 긴급 전량 청산"
        onClick={onFlattenAll}
      >
        FLATTEN
      </button>
    </div>
  )
}
