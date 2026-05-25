/** URL gate for read-only OneAI research_demo workspace (no HTS order wiring). */

export const ONEAI_RESEARCH_DEMO_WORKSPACE = 'research_demo' as const

export function isOneAiResearchDemoRoute(search = ''): boolean {
  if (typeof search !== 'string') return false
  const q = new URLSearchParams(search.startsWith('?') ? search : `?${search}`)
  return q.get('workspace') === ONEAI_RESEARCH_DEMO_WORKSPACE
}

export function buildOneAiResearchDemoUrl(origin = ''): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/?workspace=${ONEAI_RESEARCH_DEMO_WORKSPACE}`
}

export function buildHtsHomeUrl(origin = ''): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/`
}
