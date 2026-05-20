import type { CoinSymbol } from '../types/productTypes.ts'
import type { AuditEntry, Position, StoredOrder } from '../types/tradingTypes.ts'
import type { TradingSessionState } from '../engine/tradingSession.ts'

export const SESSION_STORAGE_KEY = 'tether23.sessions_v1'

export type TabSessionSnapshot = {
  tabId: string
  symbol: CoinSymbol
  state: TradingSessionState
  positions: Position[]
  orders: StoredOrder[]
  audits: AuditEntry[]
  /** bound symbol last price */
  lastPrice: number
  orderSeq: number
  auditSeq: number
}

type SessionStore = Record<string, TabSessionSnapshot>

const memorySessions: SessionStore = {}

function store(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  if (typeof localStorage !== 'undefined') return localStorage
  return {
    getItem: () => null,
    setItem: (_k, v) => {
      try {
        const parsed = JSON.parse(v) as SessionStore
        Object.assign(memorySessions, parsed)
      } catch {
        /* ignore */
      }
    },
    removeItem: () => {
      for (const k of Object.keys(memorySessions)) delete memorySessions[k]
    },
  }
}

function readAll(): SessionStore {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY)
      if (raw) return JSON.parse(raw) as SessionStore
    } catch {
      return { ...memorySessions }
    }
  }
  return { ...memorySessions }
}

function writeAll(data: SessionStore): void {
  const json = JSON.stringify(data)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, json)
  } else {
    for (const k of Object.keys(memorySessions)) delete memorySessions[k]
    Object.assign(memorySessions, data)
  }
}

export function loadTabSession(tabId: string): TabSessionSnapshot | null {
  const all = readAll()
  return all[tabId] ?? null
}

export function saveTabSession(snap: TabSessionSnapshot): TabSessionSnapshot {
  const all = readAll()
  all[snap.tabId] = snap
  writeAll(all)
  return snap
}

export function clearSessionStorage(): void {
  store().removeItem(SESSION_STORAGE_KEY)
  for (const k of Object.keys(memorySessions)) delete memorySessions[k]
}

export function listPersistedTabIds(): string[] {
  return Object.keys(readAll())
}
