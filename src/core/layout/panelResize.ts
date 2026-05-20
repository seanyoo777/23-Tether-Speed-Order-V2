import type { HtsLayoutSnapshot, PanelSizeFrac } from './types.ts'

export function resizePanelFrac(
  snapshot: HtsLayoutSnapshot,
  slot: keyof HtsLayoutSnapshot['panels'],
  axis: 'width' | 'height',
  nextFrac: number,
): HtsLayoutSnapshot {
  const panel = snapshot.panels[slot]
  const clamped = Math.max(0.05, Math.min(0.95, nextFrac))
  const frac: PanelSizeFrac = {
    frac: clamped,
    minPx:
      axis === 'width'
        ? (panel.widthFrac?.minPx ?? 120)
        : (panel.heightFrac?.minPx ?? 80),
    maxPx: panel.heightFrac?.maxPx,
  }
  return {
    ...snapshot,
    panels: {
      ...snapshot.panels,
      [slot]:
        axis === 'width'
          ? { ...panel, widthFrac: frac }
          : { ...panel, heightFrac: frac },
    },
    savedAt: Date.now(),
  }
}

export function validateLayoutFractions(snapshot: HtsLayoutSnapshot): boolean {
  const horizontal = ['watchlist', 'chart', 'orderbook', 'orderPanel'] as const
  const sum = horizontal.reduce(
    (acc, key) => acc + (snapshot.panels[key].widthFrac?.frac ?? 0),
    0,
  )
  return sum > 0.5 && sum <= 1.05
}
