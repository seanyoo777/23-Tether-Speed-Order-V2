import { describe, expect, it } from 'vitest'
import {
  buildOneAiResearchDemoUrl,
  isOneAiResearchDemoRoute,
  ONEAI_RESEARCH_DEMO_WORKSPACE,
} from '../integration/oneaiResearchDemoRoute'

describe('oneaiResearchDemoRoute', () => {
  it('detects research_demo workspace query', () => {
    expect(isOneAiResearchDemoRoute('?workspace=research_demo')).toBe(true)
    expect(isOneAiResearchDemoRoute('workspace=research_demo')).toBe(true)
    expect(isOneAiResearchDemoRoute('?workspace=theme2')).toBe(false)
    expect(isOneAiResearchDemoRoute('')).toBe(false)
  })

  it('builds demo URL', () => {
    expect(buildOneAiResearchDemoUrl('http://localhost:5173')).toContain(
      `workspace=${ONEAI_RESEARCH_DEMO_WORKSPACE}`,
    )
  })
})
