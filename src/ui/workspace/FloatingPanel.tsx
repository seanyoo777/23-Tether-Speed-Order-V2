import { useCallback, useRef, type ReactNode } from 'react'
import type { PanelPlacement } from '../../workspace/types.ts'

type Props = {
  title: string
  placement: PanelPlacement
  onMove: (patch: Partial<PanelPlacement>) => void
  onDock: () => void
  onPopup?: () => void
  children: ReactNode
}

export function FloatingPanel({
  title,
  placement,
  onMove,
  onDock,
  onPopup,
  children,
}: Props) {
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  )

  const onHeadDown = useCallback(
    (e: React.PointerEvent) => {
      drag.current = {
        x: e.clientX,
        y: e.clientY,
        px: placement.x,
        py: placement.y,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [placement.x, placement.y],
  )

  const onHeadMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return
      onMove({
        x: drag.current.px + (e.clientX - drag.current.x),
        y: drag.current.py + (e.clientY - drag.current.y),
      })
    },
    [onMove],
  )

  const onHeadUp = useCallback(() => {
    drag.current = null
  }, [])

  return (
    <div
      className="floating-panel"
      style={{
        left: placement.x,
        top: placement.y,
        width: placement.w,
        height: placement.h,
      }}
    >
      <header
        className="floating-head"
        onPointerDown={onHeadDown}
        onPointerMove={onHeadMove}
        onPointerUp={onHeadUp}
        onPointerCancel={onHeadUp}
      >
        <span>{title}</span>
        <span className="floating-actions">
          {onPopup && (
            <button type="button" onClick={onPopup} title="팝업">
              ⧉
            </button>
          )}
          <button type="button" onClick={onDock} title="도킹">
            ⊞
          </button>
        </span>
      </header>
      <div className="floating-body">{children}</div>
    </div>
  )
}
