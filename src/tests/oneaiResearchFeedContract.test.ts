import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertResearchDemoFeedContract,
  isOneAiSignalResearchFeedContract,
} from '../integration/oneaiResearchFeedContract'

const samplePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../03-OneAI/exports/research_demo_feed.sample.json',
)

describe('oneaiResearchFeedContract', () => {
  it('validates exported research_demo sample from 03-OneAI', () => {
    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(samplePath, 'utf8'))
    } catch {
      expect.fail(`missing sample — run: cd 03-OneAI && npm run export:research-feed`)
    }
    expect(isOneAiSignalResearchFeedContract(raw)).toBe(true)
    const assert = assertResearchDemoFeedContract(raw as never)
    expect(assert.ok).toBe(true)
  })
})
