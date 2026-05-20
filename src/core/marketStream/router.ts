import {
  assertAllowedConnectionKind,
  createMockStreamUrl,
} from '../contracts/noRealApi.ts'
import { tagMockOnly } from '../contracts/mockOnly.ts'
import type { MarketTick, StreamSubscriber } from './types.ts'

/** Single mock stream fan-out — do not open per-tab WebSockets. */
export function createMarketStreamRouter() {
  assertAllowedConnectionKind('mock_stream', 'MarketStreamRouter')
  const mockUrl = createMockStreamUrl('global')
  const subscribers = new Map<string, StreamSubscriber>()
  let intervalId: ReturnType<typeof setInterval> | null = null

  function subscribe(sub: StreamSubscriber): () => void {
    subscribers.set(sub.id, sub)
    return () => {
      subscribers.delete(sub.id)
    }
  }

  function publish(tick: MarketTick): void {
    for (const sub of subscribers.values()) {
      if (!sub.symbols.has(tick.symbol)) continue
      sub.onTick(tick)
    }
  }

  function startMockStream(symbols: string[], intervalMs = 800): void {
    if (intervalId) return
    intervalId = setInterval(() => {
      for (const symbol of symbols) {
        const base = symbol.startsWith('BTC') ? 97_420 : 3_480
        const jitter = (Math.random() - 0.5) * 4
        publish(
          tagMockOnly({
            symbol,
            lastPrice: base + jitter,
            at: Date.now(),
          }),
        )
      }
    }, intervalMs)
  }

  function stopMockStream(): void {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function connectionCount(): number {
    return 1
  }

  return {
    mockUrl,
    subscribe,
    publish,
    startMockStream,
    stopMockStream,
    connectionCount,
  }
}

export type MarketStreamRouter = ReturnType<typeof createMarketStreamRouter>
