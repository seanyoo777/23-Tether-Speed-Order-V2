import { runSelfTests, type SelfTestRow } from '../engine/selfTest.ts'
import type { ProductType } from '../types/productTypes.ts'
import type { LadderDirection, StoredOrder } from '../types/tradingTypes.ts'
import { MitTriggerDiag } from './MitTriggerDiag.tsx'

type Props = {
  compact?: boolean
  product: ProductType
  symbol: string
  lastPrice: number
  tick?: number
  sharedOrderQty: number
  ladderDirection: LadderDirection
  openPositions: number
  pendingOrders: number
  pendingMitStop: number
  mitStopOrders?: readonly StoredOrder[]
  onManualTick?: (price: number) => void
  lastAudit?: string
}

export function DiagnosticsPanel(props: Props) {
  const { status, rows } = runSelfTests()

  return (
    <section className={`diag panel ${props.compact ? 'diag-compact' : ''}`}>
      <h2>DIAG</h2>
      <dl className="diag-kv">
        <dt>status</dt>
        <dd className={`status-${status}`}>{status}</dd>
        <dt>symbol</dt>
        <dd>{props.symbol}</dd>
        <dt>last</dt>
        <dd className="tabular">{props.lastPrice}</dd>
        <dt>qty</dt>
        <dd>{props.sharedOrderQty}</dd>
        <dt>dir</dt>
        <dd>{props.ladderDirection}</dd>
        <dt>pos</dt>
        <dd>{props.openPositions}</dd>
        {!props.compact && (
          <>
            <dt>mockOnly</dt>
            <dd>true</dd>
            <dt>pending</dt>
            <dd>{props.pendingOrders}</dd>
            <dt>mit</dt>
            <dd>{props.pendingMitStop}</dd>
            <dt>audit</dt>
            <dd>{props.lastAudit ?? '—'}</dd>
          </>
        )}
      </dl>
      {props.onManualTick ? (
        <MitTriggerDiag
          symbol={props.symbol}
          lastPrice={props.lastPrice}
          tick={props.tick ?? 0.5}
          orders={props.mitStopOrders ?? []}
          onApplyPrice={props.onManualTick}
        />
      ) : null}
      {!props.compact && (
        <ul className="selftest-list">
          {rows.map((r: SelfTestRow) => (
            <li key={r.id} className={r.verdict.toLowerCase()}>
              {r.id}: {r.verdict}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
