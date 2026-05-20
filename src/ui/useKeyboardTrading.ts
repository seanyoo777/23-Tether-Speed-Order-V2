import { useEffect } from 'react'
import type { CompactMode } from './proTrader.ts'

type Handlers = {
  onBuyMode: () => void
  onSellMode: () => void
  onQtyPreset: (index: 0 | 1 | 2) => void
  onToastClose: () => void
  onDiagToggle?: () => void
  onCompactMode?: (mode: CompactMode) => void
  enabled?: boolean
}

export function useKeyboardTrading({
  onBuyMode,
  onSellMode,
  onQtyPreset,
  onToastClose,
  onDiagToggle,
  onCompactMode,
  enabled = true,
}: Handlers) {
  useEffect(() => {
    if (!enabled) return

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const key = e.key.toLowerCase()

      if (key === 'q') {
        e.preventDefault()
        onBuyMode()
      }
      if (key === 'a') {
        e.preventDefault()
        onSellMode()
      }
      if (key === '1') onQtyPreset(0)
      if (key === '2') onQtyPreset(1)
      if (key === '3') onQtyPreset(2)
      if (key === 'escape') onToastClose()
      if (key === '`' && onDiagToggle) onDiagToggle()
      if (e.key === 'F1' && onCompactMode) {
        e.preventDefault()
        onCompactMode('ultra')
      }
      if (e.key === 'F2' && onCompactMode) {
        e.preventDefault()
        onCompactMode('normal')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    enabled,
    onBuyMode,
    onSellMode,
    onQtyPreset,
    onToastClose,
    onDiagToggle,
    onCompactMode,
  ])
}
