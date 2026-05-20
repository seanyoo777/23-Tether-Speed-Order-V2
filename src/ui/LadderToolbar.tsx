import type { LadderClickMode } from './proTrader.ts'

type Props = {
  ladderPinned: boolean
  oneClick: boolean
  clickMode: LadderClickMode
  /** Coin hedge — 청산주문 모드 (스크린샷 상단 토글) */
  closeOrderMode?: boolean
  showCloseOrderToggle?: boolean
  onCloseOrderToggle?: () => void
  onPinToggle: (v: boolean) => void
  onOneClickToggle: () => void
  onClickModeToggle: () => void
  onRecenter: () => void
}

export function LadderToolbar({
  ladderPinned,
  oneClick,
  clickMode,
  closeOrderMode = false,
  showCloseOrderToggle = false,
  onCloseOrderToggle,
  onPinToggle,
  onOneClickToggle,
  onClickModeToggle,
  onRecenter,
}: Props) {
  return (
    <div className="ladder-toolbar">
      {showCloseOrderToggle && onCloseOrderToggle ? (
        <button
          type="button"
          className={`tb tb-close-order ${closeOrderMode ? 'on' : ''}`}
          onClick={onCloseOrderToggle}
        >
          청산주문 {closeOrderMode ? 'ON' : 'OFF'}
        </button>
      ) : null}
      <button
        type="button"
        className={`tb ${ladderPinned ? 'on' : ''}`}
        onClick={() => onPinToggle(!ladderPinned)}
      >
        호가고정 {ladderPinned ? 'ON' : 'OFF'}
      </button>
      <button type="button" className="tb" onClick={onRecenter}>
        현재가
      </button>
      <button
        type="button"
        className={`tb ${oneClick ? 'on' : ''}`}
        onClick={onOneClickToggle}
      >
        원클릭 {oneClick ? 'ON' : 'OFF'}
      </button>
      <button type="button" className="tb" onClick={onClickModeToggle}>
        {clickMode === 'single' ? '단클릭' : '더블클릭'}
      </button>
    </div>
  )
}
