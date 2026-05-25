import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertResearchDemoFeedContract,
  isOneAiSignalResearchFeedContract,
} from '../integration/oneaiResearchFeedContract'

const publicSamplePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../public/oneai/research_demo_feed.sample.json',
)

describe('loadOneAiResearchDemoFeed (bundled public sample)', () => {
  it('public/oneai sample matches contract (sync from 03 export)', () => {
    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(publicSamplePath, 'utf8'))
    } catch {
      expect.fail(
        'missing public/oneai/research_demo_feed.sample.json — copy from 03-OneAI/exports/',
      )
    }
    expect(isOneAiSignalResearchFeedContract(raw)).toBe(true)
    const check = assertResearchDemoFeedContract(raw as never)
    expect(check.ok).toBe(true)
    expect((raw as { items: unknown[] }).items.length).toBeGreaterThan(0)
  })
})
