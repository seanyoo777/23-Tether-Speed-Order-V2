import { useCallback } from 'react'
import type { TradingSession } from '../engine/tradingSession.ts'
import type { ClosePercent } from '../types/tradingTypes.ts'
import type { CoinSymbol } from '../types/productTypes.ts'
import { useWorkspaceOptional } from '../app/WorkspaceContext.tsx'

type ToastFn = (msg: string) => void

export function useTradingWorkflow(session: TradingSession, showToast: ToastFn) {
  const ws = useWorkspaceOptional()
  const st = session.getState()

  const onSymbol = useCallback(
    (symbol: string) => {
      const sym = symbol as CoinSymbol
      if (ws) ws.setWorkspaceSymbol(sym)
      else session.setSymbol(sym)
    },
    [ws, session],
  )

  /** 포지션 선택 유지 + TP/SL·STOP은 positionId에 묶여 있음. 차트만 해당 종목으로 맞춤. */
  const onSelectPosition = useCallback(
    (positionId: string) => {
      session.setSelectedPositionId(positionId)
      const leg = session.getPositions().find((p) => p.positionId === positionId)
      if (leg && leg.symbol !== session.getState().symbol) {
        session.setSymbol(leg.symbol)
        showToast(`${leg.symbol.replace('USDT', '')} 차트로 전환 (주문 유지)`)
      }
    },
    [session, showToast],
  )

  const onFlattenAll = useCallback(() => {
    const r = session.flattenAll()
    showToast(r.ok ? `FLATTEN ${r.closed}건` : '청산 실패')
  }, [session, showToast])

  const onReverse = useCallback(
    (positionId?: string) => {
      const id = positionId ?? st.selectedPositionId
      if (!id) {
        showToast('포지션 선택')
        return
      }
      const r = session.reversePosition(id)
      showToast(r.ok ? '역전 체결' : r.message)
    },
    [session, st.selectedPositionId, showToast],
  )

  const onScaleIn = useCallback(
    (positionId?: string) => {
      const id = positionId ?? st.selectedPositionId
      if (!id) {
        showToast('포지션 선택')
        return
      }
      const r = session.scaleIn(id)
      showToast(r.ok ? '추가 진입' : r.message)
    },
    [session, st.selectedPositionId, showToast],
  )

  const onScaleOut = useCallback(
    (positionId: string | undefined, percent: ClosePercent) => {
      const id = positionId ?? st.selectedPositionId
      if (!id) {
        showToast('포지션 선택')
        return
      }
      const r = session.closePosition(id, percent)
      showToast(r.ok ? `축소 ${percent}%` : r.message)
    },
    [session, st.selectedPositionId, showToast],
  )

  const onLadderBuyAtMid = useCallback(() => {
    session.setLadderDirection('buy')
    const price = session.getLastPrice(st.symbol)
    const r = session.placeLadderOrder('order-right', price)
    showToast(r.ok ? `BUY @ ${price}` : r.message)
  }, [session, st.symbol, showToast])

  const onLadderSellAtMid = useCallback(() => {
    session.setLadderDirection('sell')
    const price = session.getLastPrice(st.symbol)
    const r = session.placeLadderOrder('order-left', price)
    showToast(r.ok ? `SELL @ ${price}` : r.message)
  }, [session, st.symbol, showToast])

  const onPositionDragClose = useCallback(
    (positionId: string, price: number) => {
      const r = session.closePosition(positionId, 100, price)
      showToast(r.ok ? `드래그 청산 @ ${price}` : r.message)
    },
    [session, showToast],
  )

  return {
    onSymbol,
    onSelectPosition,
    onFlattenAll,
    onReverse,
    onScaleIn,
    onScaleOut,
    onLadderBuyAtMid,
    onLadderSellAtMid,
    onPositionDragClose,
    compactTape: ws?.compactTape ?? false,
  }
}
