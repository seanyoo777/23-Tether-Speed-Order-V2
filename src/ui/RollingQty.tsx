import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  disabled?: boolean
  onChange: (v: number) => void
}

export function RollingQty({ value, disabled, onChange }: Props) {
  const [roll, setRoll] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current !== value) {
      setRoll(true)
      const t = window.setTimeout(() => setRoll(false), 280)
      prev.current = value
      return () => window.clearTimeout(t)
    }
  }, [value])

  return (
    <div className={`qty-hero tabular ${roll ? 'qty-roll' : ''}`}>
      <span className="qty-label">수량</span>
      <input
        type="number"
        className="qty-value"
        step={0.001}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  )
}
