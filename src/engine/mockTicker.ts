import { getSymbolConfig } from '../types/productTypes.ts'

export type PriceMap = Record<string, number>

export type TickerListener = (symbol: string, price: number, all: PriceMap) => void

export type MockTickerOptions = {
  autoTick?: boolean
  intervalMs?: number
}

function seedPrice(symbol: string): number {
  return getSymbolConfig(symbol)?.basePrice ?? 100
}

function tickSize(symbol: string): number {
  return getSymbolConfig(symbol)?.tick ?? 0.01
}

/** Deterministic pseudo-random walk — no WebSocket. */
export function createMockTicker(
  symbols: readonly string[],
  opts: MockTickerOptions = {},
) {
  const prices: PriceMap = {}
  for (const s of symbols) {
    prices[s] = seedPrice(s)
  }

  const listeners = new Set<TickerListener>()
  let tickIndex = 0
  let timer: ReturnType<typeof setInterval> | undefined

  const notify = (symbol: string) => {
    for (const fn of listeners) fn(symbol, prices[symbol]!, { ...prices })
  }

  const deterministicDelta = (symbol: string): number => {
    const tick = tickSize(symbol)
    const pattern = [0, 1, -1, 2, -2, 1, 0, -1][tickIndex % 8]!
    tickIndex++
    return pattern * tick
  }

  return {
    getPrices(): PriceMap {
      return { ...prices }
    },

    getLastPrice(symbol: string): number {
      return prices[symbol] ?? 0
    },

    subscribe(fn: TickerListener): () => void {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },

    manualTick(symbol: string, price: number): void {
      prices[symbol] = price
      notify(symbol)
    },

    autoTickOnce(): void {
      if (symbols.length === 0) return
      const symbol = symbols[tickIndex % symbols.length]!
      prices[symbol] = Number(
        (prices[symbol]! + deterministicDelta(symbol)).toFixed(8),
      )
      notify(symbol)
    },

    start(): void {
      if (timer) return
      const ms = opts.intervalMs ?? 1000
      if (opts.autoTick !== false) {
        timer = setInterval(() => this.autoTickOnce(), ms)
      }
    },

    stop(): void {
      if (timer) {
        clearInterval(timer)
        timer = undefined
      }
    },
  }
}

export type MockTicker = ReturnType<typeof createMockTicker>
