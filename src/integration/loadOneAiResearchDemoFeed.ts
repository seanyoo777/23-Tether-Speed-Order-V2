import {
  assertResearchDemoFeedContract,
  isOneAiSignalResearchFeedContract,
  type OneAiSignalResearchFeedContract,
} from './oneaiResearchFeedContract.ts'

export const ONEAI_RESEARCH_FEED_SAMPLE_PATH = '/oneai/research_demo_feed.sample.json' as const

export type LoadOneAiResearchDemoFeedResult = {
  ok: boolean
  feed: OneAiSignalResearchFeedContract | null
  message: string
}

/**
 * Read-only load — no orders, no OneAI API.
 * @param samplePath defaults to bundled public JSON (synced from 03-OneAI export).
 */
export async function loadOneAiResearchDemoFeed(
  samplePath = ONEAI_RESEARCH_FEED_SAMPLE_PATH,
): Promise<LoadOneAiResearchDemoFeedResult> {
  try {
    const res = await fetch(samplePath, { method: 'GET' })
    if (!res.ok) {
      return {
        ok: false,
        feed: null,
        message: `feed HTTP ${res.status} — run 03-OneAI: npm run export:research-feed then sync sample`,
      }
    }
    const json: unknown = await res.json()
    if (!isOneAiSignalResearchFeedContract(json)) {
      return { ok: false, feed: null, message: 'invalid OneAI feed contract' }
    }
    const check = assertResearchDemoFeedContract(json)
    if (!check.ok) {
      return { ok: false, feed: null, message: check.message }
    }
    return { ok: true, feed: json, message: check.message }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, feed: null, message: `feed load failed: ${msg}` }
  }
}
