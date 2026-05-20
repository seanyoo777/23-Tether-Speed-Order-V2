import {
  PRODUCT_LABELS,
  PRODUCT_TAB_ORDER,
  symbolsForProduct,
  type ProductType,
} from '../types/productTypes.ts'
import { isProductEngineReady } from '../types/productTypes.ts'
import type { LadderDirection } from '../types/tradingTypes.ts'
import { CoreSymbolMeta } from './CoreSymbolMeta.tsx'

type Props = {
  product: ProductType
  symbol: string
  lastPrice: number
  ladderDirection: LadderDirection
  hedgeMode?: boolean
  onProduct: (p: ProductType) => void
  onSymbol: (s: string) => void
}

export function ProductSymbolSelector({
  product,
  symbol,
  lastPrice,
  ladderDirection,
  hedgeMode = false,
  onProduct,
  onSymbol,
}: Props) {
  return (
    <div className="product-symbol-bar">
      <div className="product-tabs">
        {PRODUCT_TAB_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            className={p === product ? 'on' : ''}
            onClick={() => onProduct(p)}
          >
            {PRODUCT_LABELS[p]}
          </button>
        ))}
      </div>
      {isProductEngineReady(product) && (
        <div className="symbol-tabs">
          {symbolsForProduct(product).map((s) => (
            <button
              key={s}
              type="button"
              className={s === symbol ? 'on neon' : ''}
              onClick={() => onSymbol(s)}
            >
              {s.replace('USDT', '')}
            </button>
          ))}
        </div>
      )}
      {isProductEngineReady(product) && (
        <>
          <CoreSymbolMeta
            product={product}
            symbol={symbol}
            hedgeMode={hedgeMode}
          />
          <span className="hdr-price tabular">{lastPrice.toLocaleString()}</span>
          <span
            className={`hdr-mode ${ladderDirection === 'buy' ? 'buy-mode' : 'sell-mode'}`}
          >
            {ladderDirection === 'buy' ? 'BUY MODE' : 'SELL MODE'}
          </span>
        </>
      )}
    </div>
  )
}
