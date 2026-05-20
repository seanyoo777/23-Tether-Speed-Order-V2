import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createTradingSession,
  type TradingSession,
} from '../engine/tradingSession.ts'

const Ctx = createContext<TradingSession | null>(null)

/** UI-only demo ticks — uses existing mockTicker.autoTickOnce (no rule change). */
const DEMO_TICK_MS = 1200

export function TradingProvider({
  children,
  session: externalSession,
  enableDemoTick = true,
}: {
  children: ReactNode
  session?: TradingSession
  /** Registry sessions already tick — disable duplicate demo interval. */
  enableDemoTick?: boolean
}) {
  const ownedSession = useMemo(() => createTradingSession(), [])
  const session = externalSession ?? ownedSession
  const ownsSession = externalSession === undefined
  const [, setV] = useState(0)

  useEffect(() => {
    const unsub = session.subscribe(() => setV((x) => x + 1))
    if (ownsSession) session.startTicker()
    const demoId =
      enableDemoTick && typeof window !== 'undefined'
        ? window.setInterval(() => {
            session._engines.ticker.autoTickOnce()
          }, DEMO_TICK_MS)
        : undefined
    return () => {
      unsub()
      if (ownsSession) session.stopTicker()
      if (demoId !== undefined) window.clearInterval(demoId)
    }
  }, [session, ownsSession, enableDemoTick])

  return <Ctx.Provider value={session}>{children}</Ctx.Provider>
}

export function useTrading(): TradingSession {
  const s = useContext(Ctx)
  if (!s) throw new Error('useTrading outside TradingProvider')
  return s
}
