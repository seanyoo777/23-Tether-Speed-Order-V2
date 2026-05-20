/** Prior QA locks — retained for regression references. */
export const STABLE_23_MULTI_WORKSPACE_V1 = 'STABLE_23_MULTI_WORKSPACE_V1' as const
export const STABLE_23_PRO_WORKFLOW_V1 = 'STABLE_23_PRO_WORKFLOW_V1' as const

/** Visual depth QA lock */
export const STABLE_23_VISUAL_DEPTH_V1 = 'STABLE_23_VISUAL_DEPTH_V1' as const

/** P2 coin mock rules */
export const STABLE_23_COIN_MOCK_V1 = 'STABLE_23_COIN_MOCK_V1' as const

/** P5 four-product mock HTS — current QA lock */
export const STABLE_23_MOCK_V1 = 'STABLE_23_MOCK_V1' as const

export const STABLE_23_CURRENT = STABLE_23_MOCK_V1

export type StableTag23 =
  | typeof STABLE_23_MULTI_WORKSPACE_V1
  | typeof STABLE_23_PRO_WORKFLOW_V1
  | typeof STABLE_23_VISUAL_DEPTH_V1
  | typeof STABLE_23_COIN_MOCK_V1
  | typeof STABLE_23_MOCK_V1
