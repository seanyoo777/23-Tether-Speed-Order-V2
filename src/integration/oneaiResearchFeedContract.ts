/**
 * OneAI SignalResearchFeed consumer contract (23-SpeedOrder-V2).
 * Duplicate of 03-OneAI/src/contracts/signalResearchFeedContract.ts — keep in sync manually.
 * Read-only · research_demo workspace · no orders.
 */

export const ONEAI_SIGNAL_RESEARCH_FEED_SOURCE = 'oneai-signal-research-storage' as const

export const ONEAI_SIGNAL_MARKET_TYPES = ['option', 'futures', 'stock', 'crypto'] as const

export type OneAiSignalMarketType = (typeof ONEAI_SIGNAL_MARKET_TYPES)[number]

export type OneAiSignalResearchFeedItemContract = {
  signalId: string
  marketType: OneAiSignalMarketType
  strategyType: string
  direction: string
  confidenceMock: number
  reasoningSummary: string
  marketRegimeRef: { regime: string; regimeLabel: string; mockOnly: true } | null
  tags: string[]
  createdAt: string
  mockOnly: true
}

export type OneAiSignalResearchFeedContract = {
  generatedAt: string
  variantId: string | null
  source: typeof ONEAI_SIGNAL_RESEARCH_FEED_SOURCE
  markets: OneAiSignalMarketType[]
  byMarket: Record<OneAiSignalMarketType, OneAiSignalResearchFeedItemContract[]>
  items: OneAiSignalResearchFeedItemContract[]
  mockOnly: true
}

export function isOneAiSignalResearchFeedContract(
  value: unknown,
): value is OneAiSignalResearchFeedContract {
  if (!value || typeof value !== 'object') return false
  const f = value as Partial<OneAiSignalResearchFeedContract>
  return (
    f.mockOnly === true &&
    f.source === ONEAI_SIGNAL_RESEARCH_FEED_SOURCE &&
    Array.isArray(f.items)
  )
}

export function assertResearchDemoFeedContract(feed: OneAiSignalResearchFeedContract): {
  ok: boolean
  message: string
} {
  if (feed.variantId !== 'research_demo') {
    return { ok: false, message: `expected research_demo, got ${feed.variantId}` }
  }
  const missing = ONEAI_SIGNAL_MARKET_TYPES.filter((m) => !feed.byMarket[m]?.length)
  if (missing.length) return { ok: false, message: `missing: ${missing.join(',')}` }
  return { ok: true, message: `${feed.items.length} items` }
}
