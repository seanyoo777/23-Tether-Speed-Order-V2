import type { LatencyMode, OrderFlowPrefs } from './types.ts'

export const ORDER_FLOW_PREFS_KEY = 'tether23.order_flow_v1'

const DEFAULTS: OrderFlowPrefs = {
  enabled: false,
  latencyMode: 'normal',
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

export function loadOrderFlowPrefs(): OrderFlowPrefs {
  try {
    const raw = store().getItem(ORDER_FLOW_PREFS_KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Partial<OrderFlowPrefs>
    return {
      enabled: p.enabled ?? DEFAULTS.enabled,
      latencyMode: p.latencyMode ?? DEFAULTS.latencyMode,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveOrderFlowPrefs(prefs: OrderFlowPrefs): void {
  store().setItem(ORDER_FLOW_PREFS_KEY, JSON.stringify(prefs))
}

export function clearOrderFlowPrefs(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(ORDER_FLOW_PREFS_KEY)
  }
  memory.raw = null
}

export function cycleLatencyMode(mode: LatencyMode): LatencyMode {
  const order: LatencyMode[] = ['instant', 'normal', 'slow', 'volatile']
  const i = order.indexOf(mode)
  return order[(i + 1) % order.length]!
}
