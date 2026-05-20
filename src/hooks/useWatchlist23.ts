import { useCallback, useState } from 'react'

const KEY = 'tether23.watchlist.favorites.v1'

function read(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(arr)
  } catch {
    return new Set()
  }
}

function write(set: Set<string>): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify([...set]))
}

export function useWatchlist23() {
  const [favorites, setFavorites] = useState<Set<string>>(() => read())

  const toggle = useCallback((symbol: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(symbol)) next.delete(symbol)
      else next.add(symbol)
      write(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (symbol: string) => favorites.has(symbol),
    [favorites],
  )

  return { favorites, toggle, isFavorite }
}
