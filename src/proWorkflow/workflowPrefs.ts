export type WorkflowPrefs = {
  symbolSync: boolean
  workspaceAutoRestore: boolean
  compactTape: boolean
}

export const WORKFLOW_PREFS_KEY = 'tether23.pro_workflow_v1'

const DEFAULTS: WorkflowPrefs = {
  symbolSync: false,
  workspaceAutoRestore: true,
  compactTape: false,
}

const memory: { raw: string | null } = { raw: null }

function store(): Pick<Storage, 'getItem' | 'setItem'> {
  if (typeof localStorage !== 'undefined') return localStorage
  return {
    getItem: () => memory.raw,
    setItem: (_k, v) => {
      memory.raw = v
    },
  }
}

export function loadWorkflowPrefs(): WorkflowPrefs {
  try {
    const raw = store().getItem(WORKFLOW_PREFS_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Partial<WorkflowPrefs>
    return {
      symbolSync: p.symbolSync ?? DEFAULTS.symbolSync,
      workspaceAutoRestore:
        p.workspaceAutoRestore ?? DEFAULTS.workspaceAutoRestore,
      compactTape: p.compactTape ?? DEFAULTS.compactTape,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveWorkflowPrefs(prefs: WorkflowPrefs): void {
  store().setItem(WORKFLOW_PREFS_KEY, JSON.stringify(prefs))
}

export function clearWorkflowPrefs(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(WORKFLOW_PREFS_KEY)
  }
  memory.raw = null
}
