import { getBridgeMeta, isProductBridgeReady } from '../integration/symbolConfigBridge.ts'
import type { ProductType } from '../types/productTypes.ts'

type Props = {
  product: ProductType
  symbol: string
  hedgeMode?: boolean
}

/** Compact core-linked meta — per product phase. */
export function CoreSymbolMeta({ product, symbol, hedgeMode = false }: Props) {
  if (!isProductBridgeReady(product, symbol)) return null
  const meta = getBridgeMeta(product, symbol)
  if (!meta) return null

  return (
    <div className="core-symbol-meta" data-testid="core-symbol-meta">
      <span className="core-meta-tag">CORE</span>
      <span className="tabular" title="호가 틱">
        tick {meta.tickSize}
      </span>
      <span className="tabular" title="수량 단위">
        lot {meta.lotSize}
      </span>
      <span title="통화">{meta.currency}</span>
      {meta.hedgeEnabled && hedgeMode ? (
        <span className="core-meta-flag" title="헷지 모드 ON">
          H
        </span>
      ) : null}
      {meta.mitEnabled ? <span className="core-meta-flag">MIT</span> : null}
    </div>
  )
}
