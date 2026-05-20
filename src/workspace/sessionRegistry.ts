import type { CoinSymbol } from '../types/productTypes.ts'
import {
  createTradingSession,
  type TradingSession,
} from '../engine/tradingSession.ts'
import { loadTabSession, saveTabSession } from './sessionPersistence.ts'
import { exportTabSession, hydrateTabSession } from './sessionSnapshot.ts'

/** One mock session per workspace tab — persisted for popup / reload. */
export class SessionRegistry {
  private readonly sessions = new Map<string, TradingSession>()
  private readonly tabSymbols = new Map<string, CoinSymbol>()
  private readonly unsubs = new Map<string, () => void>()
  private onPersist: ((tabId: string) => void) | null = null
  private hydrating = new Set<string>()

  setPersistListener(fn: (tabId: string) => void): void {
    this.onPersist = fn
  }

  getOrCreate(tabId: string, symbol: CoinSymbol): TradingSession {
    const existing = this.sessions.get(tabId)
    if (existing) {
      if (existing.getState().symbol !== symbol) {
        existing.setSymbol(symbol)
        this.tabSymbols.set(tabId, symbol)
      }
      return existing
    }

    const snap = loadTabSession(tabId)
    const session = createTradingSession({ bindSymbol: symbol })
    if (snap && snap.symbol === symbol) {
      this.hydrating.add(tabId)
      hydrateTabSession(session, snap)
      this.hydrating.delete(tabId)
    } else {
      session.setSymbol(symbol)
    }

    this.wirePersist(tabId, symbol, session)
    this.sessions.set(tabId, session)
    this.tabSymbols.set(tabId, symbol)
    this.persistQuiet(tabId, symbol, session)
    return session
  }

  get(tabId: string): TradingSession | undefined {
    return this.sessions.get(tabId)
  }

  /** Reload in-memory session from storage (popup / BroadcastChannel). */
  reloadFromStorage(tabId: string): boolean {
    const session = this.sessions.get(tabId)
    const symbol = this.tabSymbols.get(tabId)
    const snap = loadTabSession(tabId)
    if (!session || !symbol || !snap || snap.symbol !== symbol) return false

    this.unsubs.get(tabId)?.()
    this.hydrating.add(tabId)
    hydrateTabSession(session, snap)
    this.hydrating.delete(tabId)
    this.wirePersist(tabId, symbol, session)
    return true
  }

  remove(tabId: string): void {
    const s = this.sessions.get(tabId)
    if (s) {
      s.stopTicker()
      this.sessions.delete(tabId)
    }
    this.unsubs.get(tabId)?.()
    this.unsubs.delete(tabId)
    this.tabSymbols.delete(tabId)
  }

  list(): TradingSession[] {
    return [...this.sessions.values()]
  }

  private wirePersist(
    tabId: string,
    symbol: CoinSymbol,
    session: TradingSession,
  ): void {
    this.unsubs.get(tabId)?.()
    const unsub = session.subscribe(() => {
      if (this.hydrating.has(tabId)) return
      this.persist(tabId, symbol, session)
    })
    this.unsubs.set(tabId, () => {
      unsub()
    })
  }

  private persist(
    tabId: string,
    symbol: CoinSymbol,
    session: TradingSession,
  ): void {
    saveTabSession(exportTabSession(session, tabId, symbol))
    this.onPersist?.(tabId)
  }

  private persistQuiet(
    tabId: string,
    symbol: CoinSymbol,
    session: TradingSession,
  ): void {
    saveTabSession(exportTabSession(session, tabId, symbol))
  }
}
