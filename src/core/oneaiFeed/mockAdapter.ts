import { tagMockOnly } from '../contracts/mockOnly.ts'
import type { OneAiSignal } from './types.ts'

/** Mock JSON feed — shape aligned with 03-OneAI export; no direct 03 import. */
export const MOCK_ONEAI_SIGNALS: OneAiSignal[] = [
  tagMockOnly({
    signalId: 'sig-mock-btc-001',
    marketType: 'coin',
    symbol: 'BTCUSDT',
    direction: 'long',
    confidenceMock: 0.72,
    strategyType: 'momentum_breakout',
    reasoningSummary: 'Mock: volume expansion above VWAP',
    marketRegimeRef: 'risk_on',
  }),
  tagMockOnly({
    signalId: 'sig-mock-es-001',
    marketType: 'overseas_future',
    symbol: 'ESZ6',
    direction: 'neutral',
    confidenceMock: 0.55,
    strategyType: 'mean_reversion',
    reasoningSummary: 'Mock: range-bound session',
    marketRegimeRef: 'balanced',
  }),
]

export async function fetchMockOneAiSignals(): Promise<OneAiSignal[]> {
  return MOCK_ONEAI_SIGNALS.map((s) => ({ ...s }))
}

export function oneAiFeedContract(): { importFrom03Forbidden: true; mockOnly: true } {
  return { importFrom03Forbidden: true, mockOnly: true }
}
