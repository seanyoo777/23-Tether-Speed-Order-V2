import { useState } from 'react'
import {
  pendingMitStopForPosition,
  pendingProtectionLabels,
} from '../engine/protectionBook.ts'
import type { AuditEntry, ClosePercent, Position, StoredOrder } from '../types/tradingTypes.ts'
import { pnlPercent, unrealizedPnl } from '../engine/pnlEngine.ts'
import { FlipNumber } from './FlipNumber.tsx'
import { riskTier, sideLabel } from './proTrader.ts'

type Tab = 'positions' | 'pending' | 'fills'

type Props = {
  disabled: boolean
  legs: readonly Position[]
  pending: readonly StoredOrder[]
  audits: readonly AuditEntry[]
  markPrice: number
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: (id: string, percent: ClosePercent) => void
  onReverse?: (id: string) => void
  onScaleIn?: (id: string) => void
  onScaleOut?: (id: string, percent: ClosePercent) => void
  onCancelOrder: (id: string) => void
  onCancelAll: () => void
  proActions?: boolean
}

export function BottomPositionDock({
  disabled,
  legs,
  pending,
  audits,
  markPrice,
  selectedId,
  onSelect,
  onClose,
  onReverse,
  onScaleIn,
  onScaleOut,
  onCancelOrder,
  onCancelAll,
  proActions = true,
}: Props) {
  const [tab, setTab] = useState<Tab>('positions')
  const [hoverCloseId, setHoverCloseId] = useState<string | null>(null)

  return (
    <section className="dock panel">
      <div className="dock-tabs">
        <button
          type="button"
          className={tab === 'positions' ? 'on' : ''}
          onClick={() => setTab('positions')}
        >
          포지션
        </button>
        <button
          type="button"
          className={tab === 'pending' ? 'on' : ''}
          onClick={() => setTab('pending')}
        >
          미체결 {pending.length > 0 ? `(${pending.length})` : ''}
        </button>
        <button
          type="button"
          className={tab === 'fills' ? 'on' : ''}
          onClick={() => setTab('fills')}
        >
          체결내역
        </button>
      </div>

      <div className="dock-body">
        {tab === 'positions' && (
          <table className="dock-table">
            <thead>
              <tr>
                <th>종목</th>
                <th>방향</th>
                <th>수량</th>
                <th>평단</th>
                <th>평가손익</th>
                <th>수익률</th>
                <th>대기</th>
                <th>{proActions ? '액션' : '청산'}</th>
              </tr>
            </thead>
            <tbody>
              {legs.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    —
                  </td>
                </tr>
              )}
              {legs.map((leg) => {
                const upnl = unrealizedPnl(leg, markPrice)
                const pct = pnlPercent(leg, markPrice)
                const cls = upnl >= 0 ? 'profit' : 'loss'
                const glow = upnl >= 0 ? 'pnl-glow-profit' : 'pnl-glow-loss'
                const risk = riskTier(pct)
                const isHover = hoverCloseId === leg.positionId
                const protTag = pendingProtectionLabels(pending, leg.positionId)
                const mitN = pendingMitStopForPosition(pending, leg.positionId)
                const waitTag = [protTag, mitN > 0 ? `조건${mitN}` : '']
                  .filter(Boolean)
                  .join('·')
                return (
                  <tr
                    key={leg.positionId}
                    className={[
                      leg.positionId === selectedId ? 'selected' : '',
                      glow,
                      risk,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => onSelect(leg.positionId)}
                    onMouseEnter={() => setHoverCloseId(leg.positionId)}
                    onMouseLeave={() => setHoverCloseId(null)}
                  >
                    <td>{leg.symbol.replace('USDT', '')}</td>
                    <td className={leg.side === 'LONG' ? 'long' : 'short'}>
                      {leg.side}
                    </td>
                    <td className="tabular">{leg.qty}</td>
                    <td className="tabular">{leg.avgPrice}</td>
                    <td className={cls}>
                      <FlipNumber
                        value={upnl}
                        prefix={upnl >= 0 ? '+' : ''}
                        className={cls}
                      />
                    </td>
                    <td className={cls}>
                      <FlipNumber value={pct} decimals={2} className={cls} />
                      <span className="pct-suffix">%</span>
                    </td>
                    <td className="wait-tags tabular">{waitTag || '—'}</td>
                    <td className="close-cell" onClick={(e) => e.stopPropagation()}>
                      {isHover || leg.positionId === selectedId ? (
                        <div className="quick-close">
                          {proActions && onReverse && (
                            <button
                              type="button"
                              title="역전"
                              disabled={disabled}
                              onClick={() => onReverse(leg.positionId)}
                            >
                              R
                            </button>
                          )}
                          {proActions && onScaleIn && (
                            <button
                              type="button"
                              title="추가"
                              disabled={disabled}
                              onClick={() => onScaleIn(leg.positionId)}
                            >
                              +
                            </button>
                          )}
                          {proActions && onScaleOut && (
                            <button
                              type="button"
                              title="50% 축소"
                              disabled={disabled}
                              onClick={() => onScaleOut(leg.positionId, 50)}
                            >
                              −
                            </button>
                          )}
                          <button
                            type="button"
                            title="전량"
                            disabled={disabled}
                            onClick={() => onClose(leg.positionId, 100)}
                          >
                            X
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onClose(leg.positionId, 25)}
                          >
                            25
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onClose(leg.positionId, 50)}
                          >
                            50
                          </button>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onClose(leg.positionId, 100)}
                          >
                            100
                          </button>
                        </div>
                      ) : (
                        <span className="close-hint">···</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {tab === 'pending' && (
          <>
            <div className="pending-actions">
              <button type="button" disabled={disabled} onClick={onCancelAll}>
                전체취소
              </button>
            </div>
            <table className="dock-table">
              <thead>
                <tr>
                  <th>BS</th>
                  <th>유형</th>
                  <th>가격</th>
                  <th>수량</th>
                <th>상태</th>
                <th>유동</th>
                <th />
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty">
                      —
                    </td>
                  </tr>
                )}
                {pending.map((o) => (
                  <tr key={o.id}>
                    <td className={o.side === 'LONG' ? 'long' : 'short'}>
                      {sideLabel(o.side)}
                    </td>
                    <td>{o.kind}</td>
                    <td className="tabular">{o.triggerPrice}</td>
                    <td className="tabular">{o.qty}</td>
                    <td>{o.queuedStatus ?? o.status}</td>
                    <td className="flow-role-cell">
                      {o.liquidityRole ? (
                        <span className={`flow-role ${o.liquidityRole}`}>
                          {o.liquidityRole}
                        </span>
                      ) : (
                        '—'
                      )}
                      {o.flowTag && o.flowTag !== 'none' && (
                        <span className="flow-tag-mini">{o.flowTag}</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-cancel-row"
                        disabled={disabled}
                        onClick={() => onCancelOrder(o.id)}
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === 'fills' && (
          <table className="dock-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>동작</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty">
                    —
                  </td>
                </tr>
              )}
              {[...audits].reverse().slice(0, 20).map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.at).toLocaleTimeString()}</td>
                  <td>{a.action}</td>
                  <td>{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
