import { useEffect, useState } from 'react'
import type { TradingSession } from '../engine/tradingSession.ts'
import { cycleLatencyMode, saveOrderFlowPrefs } from '../orderFlow/flowPrefs.ts'
import type { FlowVisualState, LatencyMode } from '../orderFlow/types.ts'

const LATENCY_LABEL: Record<LatencyMode, string> = {
  instant: 'INST',
  normal: 'NORM',
  slow: 'SLOW',
  volatile: 'VOL',
}

type Props = {
  session: TradingSession
  version: number
}

export function OrderFlowHud({ session, version }: Props) {
  const [visual, setVisual] = useState<FlowVisualState>(() =>
    session.getOrderFlowVisual(),
  )
  const [prefs, setPrefs] = useState(() => session.getOrderFlowPrefs())

  useEffect(() => {
    setVisual(session.getOrderFlowVisual())
    const t = window.setInterval(() => {
      const v = session.getOrderFlowVisual()
      if (v.until > 0 && Date.now() > v.until) {
        session.clearOrderFlowVisual()
        setVisual(session.getOrderFlowVisual())
      } else {
        setVisual(v)
      }
    }, 120)
    return () => window.clearInterval(t)
  }, [session, version])

  const patchPrefs = (patch: Partial<typeof prefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    session.setOrderFlowPrefs(next)
    saveOrderFlowPrefs(next)
  }

  return (
    <div
      className={[
        'order-flow-hud',
        visual.tag !== 'none' ? `flow-tag-${visual.tag}` : '',
        prefs.latencyMode === 'volatile' ? 'flow-volatile' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      <button
        type="button"
        className={['of-btn', prefs.enabled ? 'on' : ''].join(' ')}
        onClick={() => patchPrefs({ enabled: !prefs.enabled })}
      >
        FLOW {prefs.enabled ? 'ON' : 'OFF'}
      </button>
      <button
        type="button"
        className="of-btn"
        onClick={() =>
          patchPrefs({ latencyMode: cycleLatencyMode(prefs.latencyMode) })
        }
        title="Latency: instant → normal → slow → volatile"
      >
        LAT {LATENCY_LABEL[prefs.latencyMode]}
      </button>
      {visual.liquidityRole && (
        <span className={`of-role of-${visual.liquidityRole}`}>
          {visual.liquidityRole.toUpperCase()}
        </span>
      )}
      {visual.slippageTicks > 0 && (
        <span className="of-slip">SLIP {visual.slippageTicks}t</span>
      )}
      {visual.partialPct > 0 && visual.partialPct < 100 && (
        <span className="of-partial">{visual.partialPct}%</span>
      )}
      {visual.message && <span className="of-msg">{visual.message}</span>}
    </div>
  )
}
