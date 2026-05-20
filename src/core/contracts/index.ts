export {
  HTS_CORE_MOCK_ONLY,
  assertMockOnly,
  tagMockOnly,
  type MockOnlyTagged,
} from './mockOnly.ts'
export {
  FORBIDDEN_REAL_ENDPOINT_PATTERNS,
  assertAllowedConnectionKind,
  assertNoRealEndpoint,
  createMockStreamUrl,
  type ConnectionKind,
} from './noRealApi.ts'
