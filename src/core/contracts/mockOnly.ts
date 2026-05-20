/** Global mock-only gate for 23 HTS core — production must flip via explicit flag phase. */
export const HTS_CORE_MOCK_ONLY = true as const

export type MockOnlyTagged = {
  readonly mockOnly: true
}

export function assertMockOnly(tagged: MockOnlyTagged, context: string): void {
  if (!HTS_CORE_MOCK_ONLY || tagged.mockOnly !== true) {
    throw new Error(`[${context}] mockOnly contract violated`)
  }
}

export function tagMockOnly<T extends Record<string, unknown>>(row: T): T & MockOnlyTagged {
  return { ...row, mockOnly: true as const }
}
