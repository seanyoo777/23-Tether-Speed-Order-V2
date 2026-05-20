import { useMemo, useState } from 'react'
import { watchlistRowsForProduct } from '../integration/watchlistBridge.ts'
import { useWatchlist23 } from '../hooks/useWatchlist23.ts'
import { isProductEngineReady, productComingSoonMessage } from '../types/productTypes.ts'
import type { ProductType } from '../types/productTypes.ts'
import { getSymbolConfig } from '../types/productTypes.ts'

type Props = {
  product: ProductType
  selectedSymbol: string
  getLastPrice: (symbol: string) => number
  onSelectSymbol: (symbol: string) => void
  /** Session tick version — refreshes prices without layout change */
  priceVersion?: number
}

export function WatchlistPanel({
  product,
  selectedSymbol,
  getLastPrice,
  onSelectSymbol,
  priceVersion = 0,
}: Props) {
  const [query, setQuery] = useState('')
  const { favorites, toggle, isFavorite } = useWatchlist23()
  const ready = isProductEngineReady(product)

  const rows = useMemo(() => {
    const base = watchlistRowsForProduct(product)
    const q = query.trim().toLowerCase()
    const filtered = q
      ? base.filter(
          (r) =>
            r.symbol.toLowerCase().includes(q) ||
            r.displayName.toLowerCase().includes(q),
        )
      : base
    return [...filtered].sort((a, b) => {
      const af = favorites.has(a.symbol) ? 1 : 0
      const bf = favorites.has(b.symbol) ? 1 : 0
      if (af !== bf) return bf - af
      return a.symbol.localeCompare(b.symbol)
    })
  }, [product, query, favorites])

  const priceBySymbol = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of rows) {
      map.set(row.symbol, row.tradable ? getLastPrice(row.symbol) : 0)
    }
    return map
  }, [rows, getLastPrice, priceVersion])

  return (
    <section className="watchlist panel" data-testid="watchlist-panel">
      <header className="watchlist-head">
        <h2>관심종목</h2>
        {!ready && (
          <span className="watchlist-soon">{productComingSoonMessage(product)}</span>
        )}
      </header>
      <input
        type="search"
        className="watchlist-search"
        placeholder="종목 검색…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="종목 검색"
      />
      <ul className="watchlist-list">
        {rows.length === 0 ? (
          <li className="watchlist-empty">종목 없음</li>
        ) : (
          rows.map((row) => {
            const active = row.symbol === selectedSymbol
            const seed = getSymbolConfig(row.symbol)?.basePrice ?? 0
            const price = row.tradable
              ? (priceBySymbol.get(row.symbol) ?? seed)
              : seed
            const ref = row.tradable ? seed : price
            const chg = ref > 0 ? ((price - ref) / ref) * 100 : 0
            const up = chg >= 0
            return (
              <li key={row.symbol} className={active ? 'active' : ''}>
                <button
                  type="button"
                  className={`watch-fav ${isFavorite(row.symbol) ? 'on' : ''}`}
                  aria-label="관심"
                  onClick={() => toggle(row.symbol)}
                >
                  ★
                </button>
                <button
                  type="button"
                  className="watch-row"
                  disabled={!row.tradable}
                  onClick={() => row.tradable && onSelectSymbol(row.symbol)}
                >
                  <span className="watch-sym">{row.symbol.replace('USDT', '')}</span>
                  <span className="watch-tag">{row.tag}</span>
                  <span className={`watch-price tabular ${up ? 'up' : 'down'}`}>
                    {price > 0 ? price.toLocaleString() : '—'}
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
