import type { MockOnlyTagged } from '../contracts/mockOnly.ts'
import type { CoreMarketType } from '../symbolSpec/types.ts'

export type OneAiSignalDirection = 'long' | 'short' | 'neutral'

export type OneAiSignal = {
  signalId: string
  marketType: CoreMarketType
  symbol: string
  direction: OneAiSignalDirection
  confidenceMock: number
  strategyType: string
  reasoningSummary: string
  marketRegimeRef: string
} & MockOnlyTagged
