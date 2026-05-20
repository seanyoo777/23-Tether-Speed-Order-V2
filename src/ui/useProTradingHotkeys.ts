import { useEffect } from 'react'
import type { CompactMode } from './proTrader.ts'
import type { ClosePercent } from '../types/tradingTypes.ts'

export type ProHotkeyHandlers = {
  onBuyMode: () => void
  onSellMode: () => void
  onQtyPreset: (index: 0 | 1 | 2) => void
  onToastClose: () => void
  onDiagToggle?: () => void
  onCompactMode?: (mode: CompactMode) => void
  onLadderBuyAtMid?: () => void
  onLadderSellAtMid?: () => void
  onReverse?: () => void
  onScaleIn?: () => void
  onScaleOut?: () => void
  onCloseSelected?: (percent: ClosePercent) => void
  onFlattenAll?: () => void
  enabled?: boolean
}

export function useProTradingHotkeys({
  onBuyMode,
  onSellMode,
  onQtyPreset,
  onToastClose,
  onDiagToggle,
  onCompactMode,
  onLadderBuyAtMid,
  onLadderSellAtMid,
  onReverse,
  onScaleIn,
  onScaleOut,
  onCloseSelected,
  onFlattenAll,
  enabled = true,
}: ProHotkeyHandlers) {
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

      if (key === 'b' && onLadderBuyAtMid) {
        e.preventDefault()
        onLadderBuyAtMid()
      }
      if (key === 'v' && onLadderSellAtMid) {
        e.preventDefault()
        onLadderSellAtMid()
      }
      if (key === 'r' && onReverse) {
        e.preventDefault()
        onReverse()
      }
      if (key === '=' || key === '+') {
        if (onScaleIn) {
          e.preventDefault()
          onScaleIn()
        }
      }
      if (key === '-' && onScaleOut) {
        e.preventDefault()
        onScaleOut()
      }
      if (key === 'x' && onCloseSelected) {
        e.preventDefault()
        onCloseSelected(100)
      }
      if (key === 'p' && onCloseSelected) {
        e.preventDefault()
        onCloseSelected(50)
      }
      if (e.key === 'F9' && onFlattenAll) {
        e.preventDefault()
        onFlattenAll()
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
    onLadderBuyAtMid,
    onLadderSellAtMid,
    onReverse,
    onScaleIn,
    onScaleOut,
    onCloseSelected,
    onFlattenAll,
  ])
}

/** @deprecated use useProTradingHotkeys */
export const useKeyboardTrading = useProTradingHotkeys
