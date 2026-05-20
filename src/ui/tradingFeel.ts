/** UI-only trading feel helpers — no engine coupling. */

export const QTY_PRESETS = [0.025, 0.05, 0.1] as const

/** Deterministic 80–180ms mock fill delay. */
export function mockFillDelayMs(seed: number): number {
  const h = Math.abs(Math.sin(seed * 0.017) * 10000) % 101
  return 80 + Math.floor(h)
}

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
  } catch {
    return null
  }
}

function beep(freq: number, durationMs: number, gain = 0.04): void {
  const ctx = getCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.frequency.value = freq
  g.gain.value = gain
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + durationMs / 1000)
}

/** Optional click feedback — stub only. */
export function playClickSoundStub(): void {
  beep(880, 40, 0.02)
}

/** Optional fill feedback — stub only. */
export function playFillSoundStub(): void {
  beep(1320, 60, 0.035)
}
