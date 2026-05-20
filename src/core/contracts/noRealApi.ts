/** Blocks accidental real API / WebSocket wiring in core prep phase. */
export const FORBIDDEN_REAL_ENDPOINT_PATTERNS = [
  /^wss:\/\//i,
  /^https:\/\/api\./i,
  /binance\.com/i,
  /bybit\.com/i,
] as const

export type ConnectionKind = 'mock_stream' | 'mock_rest' | 'real_ws' | 'real_rest'

export function assertAllowedConnectionKind(
  kind: ConnectionKind,
  context: string,
): void {
  if (kind === 'real_ws' || kind === 'real_rest') {
    throw new Error(`[${context}] real API/WebSocket connections are forbidden in core prep`)
  }
}

export function assertNoRealEndpoint(url: string, context: string): void {
  for (const re of FORBIDDEN_REAL_ENDPOINT_PATTERNS) {
    if (re.test(url)) {
      throw new Error(`[${context}] forbidden endpoint pattern: ${url}`)
    }
  }
}

export function createMockStreamUrl(workspaceId: string): string {
  return `mock://market-stream/${workspaceId}`
}
