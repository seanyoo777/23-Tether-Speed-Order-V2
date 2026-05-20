import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useWorkspaceOptional } from '../../app/WorkspaceContext.tsx'
import type { DockZone, PanelId } from '../../workspace/types.ts'
import { FloatingPanel } from './FloatingPanel.tsx'

const PANEL_TITLES: Record<PanelId, string> = {
  tape: '체결 tape',
  ladder: '호가 Ladder',
  order: '주문',
  mit: 'MIT / STOP',
  linkage: 'TP/SL 연결',
  dock: '포지션',
  status: '상태',
  chart1: 'Chart 1m',
  chart2: 'Chart 5m',
  chart3: 'Chart 15m',
}

type Props = {
  panelId: PanelId
  className?: string
  dockZone?: DockZone
  children: ReactNode
}

export function DetachablePanel({
  panelId,
  className = '',
  dockZone = 'right',
  children,
}: Props) {
  const ws = useWorkspaceOptional()
  if (!ws) {
    return <div className={className}>{children}</div>
  }

  const p = ws.panel(panelId)
  if (!p.visible) return null
  if (ws.isPopup && ws.popupPanel !== panelId) return null

  const chrome = (
    <div className={`detach-wrap ${className}`}>
      {!p.detached && (
        <div className="detach-bar">
          <span className="detach-title">{PANEL_TITLES[panelId]}</span>
          <button
            type="button"
            className="detach-btn"
            title="분리"
            onClick={() => ws.detachPanel(panelId)}
          >
            ↗
          </button>
          <button
            type="button"
            className="detach-btn"
            title="팝업"
            onClick={() => ws.openPopup(panelId)}
          >
            ⧉
          </button>
        </div>
      )}
      {children}
    </div>
  )

  if (p.detached && !p.popup) {
    return createPortal(
      <FloatingPanel
        title={PANEL_TITLES[panelId]}
        placement={p.placement}
        onMove={(patch) => ws.movePanel(panelId, patch)}
        onDock={() => ws.dockPanel(panelId, dockZone)}
        onPopup={() => ws.openPopup(panelId)}
      >
        {children}
      </FloatingPanel>,
      document.body,
    )
  }

  if (p.popup) return null

  return chrome
}
