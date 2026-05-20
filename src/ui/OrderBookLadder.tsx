import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type WheelEvent,
} from 'react'
import { getSymbolConfig } from '../types/productTypes.ts'
import { isProductEngineReady } from '../types/productTypes.ts'
import type { ProductType } from '../types/productTypes.ts'
import type {
  LadderDirection,
  LadderOrderColumn,
  Position,
} from '../types/tradingTypes.ts'
import { buildLadderRows } from '../engine/ladderPrices.ts'
import { LadderToolbar } from './LadderToolbar.tsx'
import { buildDepthBookVisual } from '../visualDepth/depthEngine.ts'
import { loadVisualDepthPrefs } from '../visualDepth/visualDepthPrefs.ts'
import { DepthModeToolbar } from './DepthModeToolbar.tsx'
import { VelocityTicker } from './VelocityTicker.tsx'
import {
  advancedMarkers,
  advancedMarkersAtPrice,
  type AdvancedMarker,
} from '../mitAdvanced/markers.ts'
import { badgeClass } from '../mitAdvanced/queuedStatus.ts'
import {
  positionMarkersAtPrice,
  positionMarkersForSymbol,
} from '../mitAdvanced/positionMarkers.ts'
import type { LadderClickMode } from './proTrader.ts'
import type { StoredOrder } from '../types/tradingTypes.ts'
import {
  mockFillDelayMs,
  playClickSoundStub,
  playFillSoundStub,
} from './tradingFeel.ts'

export type TickDirection = 'up' | 'down' | 'flat'

type OrderResult = { ok: true } | { ok: false; message: string }

type Props = {
  product: ProductType
  symbol: string
  lastPrice: number
  ladderDirection: LadderDirection
  ladderPinned: boolean
  pinnedCenter: number | null
  tickDirection: TickDirection
  clickMode: LadderClickMode
  oneClick: boolean
  pendingOrders: readonly StoredOrder[]
  riskLinePrice: number | null
  triggerFlashPrice: number | null
  positions?: readonly Position[]
  onMarkerMove: (orderId: string, triggerPrice: number) => void
  onMarkerCancel: (orderId: string) => void
  onPositionDragClose?: (positionId: string, price: number) => void
  onPinToggle: (v: boolean) => void
  onOneClickToggle: () => void
  onClickModeToggle: () => void
  onRecenter: () => void
  /** Coin hedge: exchange buy/sell on ladder (no direction lock) */
  hedgeExchangeMode?: boolean
  closeOrderMode?: boolean
  sharedOrderQty?: number
  onCloseOrderModeToggle?: () => void
  onOrderClick: (col: LadderOrderColumn, price: number) => OrderResult
  onLadderCloseLeg?: (
    side: 'LONG' | 'SHORT',
    price: number,
    qty?: number,
  ) => OrderResult
  /** STOP 셀 클릭 시 MIT 트리거를 해당 호가 행 가격에 고정 */
  onRegisterMitAtPrice?: (side: 'LONG' | 'SHORT', price: number) => void
  mitOnBookEnabled?: boolean
  /** 선택 포지션 — TP/SL 열 클릭 등록 */
  selectedPositionId?: string | null
  onRegisterProtectionAtBook?: (
    positionId: string,
    price: number,
  ) => { ok: true; kind: string } | { ok: false; message: string }
  onBlocked: (message: string) => void
  onFill?: (price: number) => void
  sessionVersion?: number
  /** 시장 체결 테이블을 호가 바로 아래 (헷지 레이아웃) */
  marketTapeFooter?: ReactNode
}

export function OrderBookLadder({
  product,
  symbol,
  lastPrice,
  ladderDirection,
  ladderPinned,
  pinnedCenter,
  tickDirection,
  clickMode,
  oneClick,
  pendingOrders,
  riskLinePrice,
  triggerFlashPrice,
  positions = [],
  onMarkerMove,
  onMarkerCancel,
  onPositionDragClose,
  onPinToggle,
  onOneClickToggle,
  onClickModeToggle,
  onRecenter,
  hedgeExchangeMode = false,
  closeOrderMode = false,
  sharedOrderQty = 0,
  onCloseOrderModeToggle,
  onOrderClick,
  onLadderCloseLeg,
  onRegisterMitAtPrice,
  mitOnBookEnabled = false,
  selectedPositionId = null,
  onRegisterProtectionAtBook,
  onBlocked,
  onFill,
  sessionVersion = 0,
  marketTapeFooter,
}: Props) {
  const cfg = getSymbolConfig(symbol)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [clickFlash, setClickFlash] = useState<string | null>(null)
  const [clickGlow, setClickGlow] = useState<string | null>(null)
  const [confirmRow, setConfirmRow] = useState<string | null>(null)
  const [filledRow, setFilledRow] = useState<string | null>(null)
  const [trailRow, setTrailRow] = useState<string | null>(null)
  const [hoverMarker, setHoverMarker] = useState<AdvancedMarker | null>(null)
  const [dragOrderId, setDragOrderId] = useState<string | null>(null)
  const [dragPositionId, setDragPositionId] = useState<string | null>(null)
  const [dragPreviewPrice, setDragPreviewPrice] = useState<number | null>(null)
  const [dropFlash, setDropFlash] = useState<string | null>(null)
  const [depthPrefs, setDepthPrefs] = useState(() => loadVisualDepthPrefs())
  const depthMode = depthPrefs.mode
  const depthEnabled = depthPrefs.enabled
  const confirmPending = useRef<{
    rowKey: string
    col: LadderOrderColumn
    price: number
  } | null>(null)
  const prevMidKey = useRef<string | null>(null)
  const fillTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const refPrice = cfg?.basePrice ?? lastPrice
  const markers = useMemo(
    () => advancedMarkers(pendingOrders, symbol, lastPrice, refPrice),
    [pendingOrders, symbol, lastPrice, refPrice],
  )

  const posMarkers = useMemo(
    () => positionMarkersForSymbol(positions, symbol),
    [positions, symbol],
  )

  const isDraggable = (m: AdvancedMarker) =>
    (m.kind === 'MIT' ||
      m.kind === 'STOP' ||
      m.kind === 'PROTECTION_TP' ||
      m.kind === 'PROTECTION_SL') &&
    (m.status === 'WAITING' || m.status === 'ARMED')

  const snapRowPrice = useCallback(
    (clientY: number): number | null => {
      const el = scrollRef.current?.querySelector('tbody')
      if (!el) return null
      const rowsEl = el.querySelectorAll<HTMLTableRowElement>('tr')
      for (const tr of rowsEl) {
        const rect = tr.getBoundingClientRect()
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const key = tr.dataset.rowKey
          if (!key) return null
          const price = Number(key.split('-').pop())
          return Number.isFinite(price) ? price : null
        }
      }
      return null
    },
    [],
  )

  const rows = useMemo(() => {
    if (!cfg) return []
    const center =
      ladderPinned && pinnedCenter !== null ? pinnedCenter : lastPrice
    const raw = buildLadderRows(lastPrice, cfg, ladderPinned, center)
    const tick = cfg.tick
    return raw.map((r) => ({
      ...r,
      isCurrent: Math.abs(r.price - lastPrice) <= tick * 0.51,
    }))
  }, [cfg, lastPrice, ladderPinned, pinnedCenter])

  const endOrderDrag = useCallback(
    (orderId: string, price: number | null) => {
      setDragOrderId(null)
      setDragPreviewPrice(null)
      if (price !== null) {
        onMarkerMove(orderId, price)
        const hit = rows.find(
          (r) => Math.abs(r.price - price) < (cfg?.tick ?? 0.01) * 0.51,
        )
        if (hit) {
          const k = `${hit.index}-${hit.price}`
          setDropFlash(k)
          window.setTimeout(() => setDropFlash(null), 450)
        }
      }
    },
    [onMarkerMove, rows, cfg?.tick],
  )

  const endPositionDrag = useCallback(
    (positionId: string, price: number | null) => {
      setDragPositionId(null)
      setDragPreviewPrice(null)
      if (price !== null && onPositionDragClose) {
        onPositionDragClose(positionId, price)
        const hit = rows.find(
          (r) => Math.abs(r.price - price) < (cfg?.tick ?? 0.01) * 0.51,
        )
        if (hit) {
          const k = `${hit.index}-${hit.price}`
          setDropFlash(k)
          window.setTimeout(() => setDropFlash(null), 450)
        }
      }
    },
    [onPositionDragClose, rows, cfg?.tick],
  )

  const midIndex = rows.findIndex((r) => r.isCurrent)
  const midKey =
    midIndex >= 0 ? `${rows[midIndex]!.index}-${rows[midIndex]!.price}` : null

  const depthBook = useMemo(
    () =>
      buildDepthBookVisual({
        symbol,
        lastPrice,
        tick: cfg?.tick ?? 0.01,
        rows,
        midIndex,
        tickDirection,
        version: sessionVersion,
        mode: depthMode,
      }),
    [
      symbol,
      lastPrice,
      cfg?.tick,
      rows,
      midIndex,
      tickDirection,
      sessionVersion,
      depthMode,
    ],
  )

  useLayoutEffect(() => {
    if (ladderPinned || !scrollRef.current || !midKey) return

    const prev = prevMidKey.current
    if (prev && prev !== midKey) {
      setTrailRow(prev)
      window.setTimeout(() => setTrailRow(null), 150)
    }
    prevMidKey.current = midKey

    const row = scrollRef.current.querySelector('tr.current')
    row?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [midKey, ladderPinned, lastPrice])

  const executeOrder = useCallback(
    (col: LadderOrderColumn, price: number, rowKey: string) => {
      setClickFlash(rowKey)
      setClickGlow(rowKey)
      setConfirmRow(null)
      confirmPending.current = null
      playClickSoundStub()
      window.setTimeout(() => setClickGlow(null), 120)

      if (fillTimer.current) clearTimeout(fillTimer.current)
      const delay = mockFillDelayMs(price)

      fillTimer.current = setTimeout(() => {
        setClickFlash(null)
        const r = onOrderClick(col, price)
        if (r.ok) {
          playFillSoundStub()
          setFilledRow(rowKey)
          onFill?.(price)
          window.setTimeout(() => setFilledRow(null), 500)
        } else {
          onBlocked(r.message)
        }
      }, delay)
    },
    [onOrderClick, onBlocked, onFill],
  )

  const tryRegisterProtectionAtBook = useCallback(
    (price: number, rowKey: string) => {
      if (!selectedPositionId || !onRegisterProtectionAtBook) {
        onBlocked('TP/SL: 하단에서 포지션을 선택하세요.')
        return
      }
      setClickGlow(rowKey)
      window.setTimeout(() => setClickGlow(null), 120)
      const r = onRegisterProtectionAtBook(selectedPositionId, price)
      if (!r.ok) onBlocked(r.message)
    },
    [selectedPositionId, onRegisterProtectionAtBook, onBlocked],
  )

  const tryRegisterMit = useCallback(
    (price: number, rowKey: string) => {
      if (!mitOnBookEnabled || !onRegisterMitAtPrice) return
      const side = ladderDirection === 'buy' ? 'LONG' : 'SHORT'
      setClickGlow(rowKey)
      window.setTimeout(() => setClickGlow(null), 120)
      onRegisterMitAtPrice(side, price)
    },
    [ladderDirection, mitOnBookEnabled, onRegisterMitAtPrice],
  )

  const hasLong = useMemo(
    () =>
      positions.some(
        (p) => p.symbol === symbol && p.side === 'LONG' && p.qty > 1e-12,
      ),
    [positions, symbol],
  )
  const hasShort = useMemo(
    () =>
      positions.some(
        (p) => p.symbol === symbol && p.side === 'SHORT' && p.qty > 1e-12,
      ),
    [positions, symbol],
  )

  const tryCloseOnBook = useCallback(
    (side: 'LONG' | 'SHORT', price: number, rowKey: string, qty?: number) => {
      if (!onLadderCloseLeg) return
      setClickGlow(rowKey)
      window.setTimeout(() => setClickGlow(null), 120)
      const r = onLadderCloseLeg(side, price, qty)
      if (r.ok) {
        playFillSoundStub()
        onFill?.(price)
      } else {
        onBlocked(r.message)
      }
    },
    [onLadderCloseLeg, onBlocked, onFill],
  )

  const tryOrder = useCallback(
    (col: LadderOrderColumn, price: number, rowKey: string) => {
      if (!cfg || !isProductEngineReady(product)) return
      if (hedgeExchangeMode && closeOrderMode) {
        if (col === 'order-left') {
          if (!hasLong) {
            onBlocked('롱 포지션이 없습니다.')
            return
          }
          tryCloseOnBook('LONG', price, rowKey, sharedOrderQty)
          return
        }
        if (!hasShort) {
          onBlocked('숏 포지션이 없습니다.')
          return
        }
        tryCloseOnBook('SHORT', price, rowKey, sharedOrderQty)
        return
      }
      /* 원웨이: 칸 방향으로 체결 (매수전환 패널 제거 — session.placeLadderOrder 동기화) */

      if (!oneClick) {
        const p = confirmPending.current
        if (p && p.rowKey === rowKey && p.col === col && p.price === price) {
          executeOrder(col, price, rowKey)
          return
        }
        confirmPending.current = { rowKey, col, price }
        setConfirmRow(rowKey)
        setClickGlow(rowKey)
        window.setTimeout(() => setClickGlow(null), 120)
        return
      }

      executeOrder(col, price, rowKey)
    },
    [
      cfg,
      product,
      hedgeExchangeMode,
      closeOrderMode,
      hasLong,
      hasShort,
      sharedOrderQty,
      tryCloseOnBook,
      oneClick,
      executeOrder,
      onBlocked,
    ],
  )

  const onWheel = useCallback((e: WheelEvent) => {
    if (!scrollRef.current) return
    e.preventDefault()
    scrollRef.current.scrollTop += e.deltaY
  }, [])

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault()
        onRecenter()
      }
    },
    [onRecenter],
  )

  useEffect(
    () => () => {
      if (fillTimer.current) clearTimeout(fillTimer.current)
    },
    [],
  )

  if (!cfg || !isProductEngineReady(product)) {
    return <section className="ladder panel dim">준비중</section>
  }

  return (
    <section
      className={[
        'ladder panel',
        tickDirection === 'up' ? 'tick-up' : '',
        tickDirection === 'down' ? 'tick-down' : '',
        depthEnabled ? 'depth-visual-on' : '',
        depthBook.panicMode ? 'depth-panic' : '',
        depthBook.spreadFlash ? 'spread-flash' : '',
        depthMode === 'ultra-dom' ? 'depth-ultra-dom' : '',
        depthBook.aggressiveSide === 'buy' ? 'agg-pulse-buy' : '',
        depthBook.aggressiveSide === 'sell' ? 'agg-pulse-sell' : '',
        hedgeExchangeMode ? 'ladder-hedge-exchange' : '',
        hedgeExchangeMode && closeOrderMode ? 'ladder-close-order-mode' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="호가"
      onMouseDown={onMouseDown}
    >
      {hedgeExchangeMode && onCloseOrderModeToggle ? (
        <div className="ladder-close-order-bar">
          <button
            type="button"
            className={`ladder-close-order-main ${closeOrderMode ? 'on' : ''}`}
            onClick={onCloseOrderModeToggle}
          >
            청산주문 {closeOrderMode ? 'ON' : 'OFF'}
          </button>
          <span className="ladder-close-order-hint">
            {closeOrderMode
              ? '호가 클릭 = 청산 (롱청산·숏청산)'
              : '호가 클릭 = 진입 · 행 청산 버튼'}
          </span>
        </div>
      ) : null}

      <div className="ladder-toolbar-row">
        <LadderToolbar
          ladderPinned={ladderPinned}
          oneClick={oneClick}
          clickMode={clickMode}
          closeOrderMode={closeOrderMode}
          showCloseOrderToggle={false}
          onCloseOrderToggle={onCloseOrderModeToggle}
          onPinToggle={onPinToggle}
          onOneClickToggle={() => {
            confirmPending.current = null
            setConfirmRow(null)
            onOneClickToggle()
          }}
          onClickModeToggle={onClickModeToggle}
          onRecenter={onRecenter}
        />
        <DepthModeToolbar onPrefsChange={setDepthPrefs} />
        {depthEnabled && (
          <VelocityTicker
            velocity={depthBook.velocity}
            aggressiveSide={depthBook.aggressiveSide}
            spread={depthBook.spread}
            spreadCompressed={depthBook.spreadCompressed}
            panicMode={depthBook.panicMode}
          />
        )}
      </div>

      {hoverMarker && (
        <div className="marker-tooltip">
          <strong>
            {hoverMarker.label} {hoverMarker.side}
          </strong>
          <span>가격 {hoverMarker.triggerPrice}</span>
          <span>수량 {hoverMarker.qty}</span>
          <span className={badgeClass(hoverMarker.status)}>{hoverMarker.status}</span>
          <span className="muted">
            {new Date(hoverMarker.createdAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      <div
        className="ladder-scroll"
        ref={scrollRef}
        onWheel={onWheel}
        onPointerMove={(e) => {
          if (!dragOrderId && !dragPositionId) return
          const p = snapRowPrice(e.clientY)
          if (p !== null) setDragPreviewPrice(p)
        }}
        onPointerUp={(e) => {
          const price = dragPreviewPrice ?? snapRowPrice(e.clientY)
          if (dragOrderId) endOrderDrag(dragOrderId, price)
          if (dragPositionId) endPositionDrag(dragPositionId, price)
        }}
        onPointerLeave={() => {
          if (dragOrderId) endOrderDrag(dragOrderId, dragPreviewPrice)
          if (dragPositionId) endPositionDrag(dragPositionId, dragPreviewPrice)
        }}
      >
        <table className="ladder-7">
          <thead>
            <tr>
              <th>STOP</th>
              <th>주문</th>
              <th>매도</th>
              <th>가격</th>
              <th>매수</th>
              <th>주문</th>
              <th>TP/SL</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowKey = `${row.index}-${row.price}`
              const tick = cfg.tick
              const isRisk =
                riskLinePrice !== null &&
                Math.abs(row.price - riskLinePrice) <= tick * 0.51
              const isDragTarget =
                dragPreviewPrice !== null &&
                Math.abs(row.price - dragPreviewPrice) <= tick * 0.51
              let rowMarkers = advancedMarkersAtPrice(markers, row.price, symbol)
              if (dragOrderId && isDragTarget) {
                const dragged = markers.find((m) => m.id === dragOrderId)
                rowMarkers = dragged ? [dragged] : rowMarkers
              } else if (dragOrderId) {
                rowMarkers = rowMarkers.filter((m) => m.id !== dragOrderId)
              }
              const stopMarkers = rowMarkers.filter(
                (m) => m.kind === 'MIT' || m.kind === 'STOP',
              )
              const protMarkers = rowMarkers.filter(
                (m) =>
                  m.kind === 'PROTECTION_TP' || m.kind === 'PROTECTION_SL',
              )
              let rowPos = positionMarkersAtPrice(posMarkers, row.price, tick)
              if (dragPositionId && isDragTarget) {
                const dragged = posMarkers.find(
                  (m) => m.positionId === dragPositionId,
                )
                rowPos = dragged ? [dragged] : rowPos
              } else if (dragPositionId) {
                rowPos = rowPos.filter((m) => m.positionId !== dragPositionId)
              }
              const aboveMid = midIndex >= 0 && row.index < midIndex
              const belowMid = midIndex >= 0 && row.index > midIndex
              const dist = Math.abs(row.index - midIndex)
              const dv =
                depthBook.rows.get(row.index) ??
                depthBook.byPrice(row.price, tick)
              const askQty = dv?.askQty ?? 0
              const bidQty = dv?.bidQty ?? 0

              const orderHandlers =
                clickMode === 'single'
                  ? {
                      onClick: () => tryOrder('order-left', row.price, rowKey),
                      onDoubleClick: undefined,
                    }
                  : {
                      onClick: undefined,
                      onDoubleClick: () =>
                        tryOrder('order-left', row.price, rowKey),
                    }

              const buyHandlers =
                clickMode === 'single'
                  ? {
                      onClick: () => tryOrder('order-right', row.price, rowKey),
                      onDoubleClick: undefined,
                    }
                  : {
                      onClick: undefined,
                      onDoubleClick: () =>
                        tryOrder('order-right', row.price, rowKey),
                    }

              const longAtRow = rowPos.some((p) => p.side === 'LONG')
              const shortAtRow = rowPos.some((p) => p.side === 'SHORT')

              return (
                <tr
                  key={rowKey}
                  data-row-key={rowKey}
                  className={[
                    row.isCurrent ? 'current' : '',
                    aboveMid ? 'side-ask' : '',
                    belowMid ? 'side-bid' : '',
                    isRisk ? 'risk-line-row' : '',
                    trailRow === rowKey ? 'price-trail' : '',
                    clickFlash === rowKey ? 'click-flash' : '',
                    clickGlow === rowKey ? 'click-glow' : '',
                    confirmRow === rowKey ? 'confirm-glow' : '',
                    filledRow === rowKey ? 'row-filled' : '',
                    dropFlash === rowKey ? 'drop-flash' : '',
                    dv?.askWall ? 'wall-ask' : '',
                    dv?.bidWall ? 'wall-bid' : '',
                    dv?.askIceberg ? 'iceberg-ask' : '',
                    dv?.bidIceberg ? 'iceberg-bid' : '',
                    triggerFlashPrice !== null &&
                    Math.abs(row.price - triggerFlashPrice) <= tick * 0.51
                      ? 'trigger-glow'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={
                    {
                      '--ask-int': depthEnabled
                        ? Math.round((dv?.askPressure ?? 0) * 100)
                        : Math.min(100, 20 + dist * 5),
                      '--bid-int': depthEnabled
                        ? Math.round((dv?.bidPressure ?? 0) * 100)
                        : Math.min(100, 20 + dist * 5),
                      '--ask-cum': dv?.askCumPct ?? 0,
                      '--bid-cum': dv?.bidCumPct ?? 0,
                      '--vol-pulse': dv?.volumePulse ?? 0,
                    } as CSSProperties
                  }
                >
                  <td
                    className={[
                      'cell-stop',
                      'cell-stop-mit',
                      mitOnBookEnabled && stopMarkers.length === 0
                        ? 'mit-clickable'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={
                      mitOnBookEnabled && stopMarkers.length === 0
                        ? () => tryRegisterMit(row.price, rowKey)
                        : undefined
                    }
                    title={
                      mitOnBookEnabled
                        ? 'STOP 셀 클릭 → MIT 등록 (해당 호가에 고정)'
                        : undefined
                    }
                  >
                    {stopMarkers.length > 0 && (
                      <span className="marker-stack">
                        {stopMarkers.map((m) => (
                          <span
                            key={m.id}
                            className={[
                              `omarker om-${m.kind}`,
                              `qs-${m.status}`,
                              dragOrderId === m.id ? 'dragging' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onMouseEnter={() => setHoverMarker(m)}
                            onMouseLeave={() => setHoverMarker(null)}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              onMarkerCancel(m.id)
                            }}
                            onPointerDown={(e) => {
                              if (!isDraggable(m)) return
                              e.preventDefault()
                              setDragOrderId(m.id)
                              setDragPreviewPrice(m.triggerPrice)
                            }}
                          >
                            {m.label}
                            {isDraggable(m) && (
                              <button
                                type="button"
                                className="marker-x"
                                aria-label="취소"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onMarkerCancel(m.id)
                                }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </span>
                    )}
                    {mitOnBookEnabled && stopMarkers.length === 0 && (
                      <span className="stop-placeholder mit-slot">—</span>
                    )}
                  </td>
                  <td className="cell-order-wrap sell">
                    {hedgeExchangeMode &&
                    !closeOrderMode &&
                    longAtRow &&
                    onLadderCloseLeg ? (
                      <button
                        type="button"
                        className="cell-order cell-close active"
                        onClick={() => tryCloseOnBook('LONG', row.price, rowKey)}
                        title="롱 전량 청산"
                      >
                        청산
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={[
                          'cell-order',
                          hedgeExchangeMode ||
                          ladderDirection === 'sell' ||
                          !hedgeExchangeMode
                            ? 'active'
                            : 'dim',
                        ].join(' ')}
                        {...orderHandlers}
                      >
                        {hedgeExchangeMode
                          ? closeOrderMode
                            ? '롱청산'
                            : '매도'
                          : 'SELL'}
                      </button>
                    )}
                  </td>
                  <td className="cell-depth ask">
                    {depthEnabled && askQty > 0 && (
                      <span
                        className="depth-cum-bar ask"
                        aria-hidden
                      />
                    )}
                    {askQty > 0 && (
                      <span className="depth-qty">
                        {askQty}
                        {dv?.askIceberg && (
                          <span className="iceberg-tag" title="Iceberg mock">🧊</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="cell-price tabular">
                    {rowPos.length > 0 && (
                      <span className="marker-stack pos-markers">
                        {rowPos.map((pm) => (
                          <span
                            key={pm.positionId}
                            className={[
                              'omarker om-pos',
                              pm.side === 'LONG' ? 'long' : 'short',
                              dragPositionId === pm.positionId ? 'dragging' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            title={`${pm.side} ${pm.qty} @ ${pm.avgPrice}`}
                            onPointerDown={(e) => {
                              if (!onPositionDragClose) return
                              e.preventDefault()
                              setDragPositionId(pm.positionId)
                              setDragPreviewPrice(pm.avgPrice)
                            }}
                          >
                            {pm.label}
                          </span>
                        ))}
                      </span>
                    )}
                    {isRisk && <span className="risk-liq-tag">청산</span>}
                    {row.isCurrent ? (
                      <span className="price-mid">
                        {formatPrice(row.price, cfg.tick)}
                      </span>
                    ) : (
                      formatPrice(row.price, cfg.tick)
                    )}
                  </td>
                  <td className="cell-depth bid">
                    {depthEnabled && bidQty > 0 && (
                      <span
                        className="depth-cum-bar bid"
                        aria-hidden
                      />
                    )}
                    {bidQty > 0 && (
                      <span className="depth-qty">
                        {bidQty}
                        {dv?.bidIceberg && (
                          <span className="iceberg-tag" title="Iceberg mock">🧊</span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="cell-order-wrap buy">
                    {hedgeExchangeMode &&
                    !closeOrderMode &&
                    shortAtRow &&
                    onLadderCloseLeg ? (
                      <button
                        type="button"
                        className="cell-order cell-close active"
                        onClick={() =>
                          tryCloseOnBook('SHORT', row.price, rowKey)
                        }
                        title="숏 전량 청산"
                      >
                        청산
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={[
                          'cell-order',
                          hedgeExchangeMode ||
                          ladderDirection === 'buy' ||
                          !hedgeExchangeMode
                            ? 'active'
                            : 'dim',
                        ].join(' ')}
                        {...buyHandlers}
                      >
                        {hedgeExchangeMode
                          ? closeOrderMode
                            ? '숏청산'
                            : '매수'
                          : 'BUY'}
                      </button>
                    )}
                  </td>
                  <td
                    className={[
                      'cell-stop',
                      'cell-stop-prot',
                      selectedPositionId && onRegisterProtectionAtBook
                        ? 'prot-clickable'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={
                      selectedPositionId && onRegisterProtectionAtBook
                        ? () =>
                            tryRegisterProtectionAtBook(row.price, rowKey)
                        : undefined
                    }
                    title={
                      selectedPositionId
                        ? '클릭: 선택 포지션 TP/SL (위·아래 자동) · 우클릭 취소'
                        : 'TP/SL: 하단 포지션 선택 후 클릭'
                    }
                  >
                    {protMarkers.length > 0 ? (
                      <span className="marker-stack">
                        {protMarkers.map((m) => (
                          <span
                            key={m.id}
                            className={[
                              `omarker om-${m.kind}`,
                              `qs-${m.status}`,
                              dragOrderId === m.id ? 'dragging' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onMouseEnter={() => setHoverMarker(m)}
                            onMouseLeave={() => setHoverMarker(null)}
                            onContextMenu={(e) => {
                              e.preventDefault()
                              onMarkerCancel(m.id)
                            }}
                            onPointerDown={(e) => {
                              if (!isDraggable(m)) return
                              e.preventDefault()
                              setDragOrderId(m.id)
                              setDragPreviewPrice(m.triggerPrice)
                            }}
                          >
                            {m.label}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="stop-placeholder">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {marketTapeFooter ? (
        <div className="ladder-market-tape">{marketTapeFooter}</div>
      ) : null}
    </section>
  )
}

function formatPrice(price: number, tick: number): string {
  const d = tick >= 1 ? 1 : tick >= 0.1 ? 2 : 4
  return price.toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
}
