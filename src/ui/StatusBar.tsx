import { useEffect, useRef, useState } from 'react'

type Props = {
  tickCount: number
  symbol: string
}

export function StatusBar({ tickCount, symbol }: Props) {
  const [fps, setFps] = useState(60)
  const [ping] = useState(12)
  const frames = useRef(0)
  const last = useRef(performance.now())

  useEffect(() => {
    let raf = 0
    const loop = (now: number) => {
      frames.current++
      if (now - last.current >= 1000) {
        setFps(frames.current)
        frames.current = 0
        last.current = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="status-bar">
      <span>PING {ping}ms</span>
      <span>FPS {fps}</span>
      <span>TICK {tickCount}</span>
      <span>{symbol}</span>
      <span className="mock-tag">MOCK ONLY</span>
    </div>
  )
}
