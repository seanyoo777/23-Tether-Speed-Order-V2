import type { MockOnlyTagged } from '../contracts/mockOnly.ts'

export type MarketStreamTopic = {
  symbol: string
  workspaceId: string
  windowId?: string
}

export type MarketTick = {
  symbol: string
  lastPrice: number
  at: number
} & MockOnlyTagged

export type StreamSubscriber = {
  id: string
  workspaceId: string
  windowId?: string
  symbols: Set<string>
  onTick: (tick: MarketTick) => void
}
