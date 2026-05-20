import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  decimals?: number
  className?: string
  prefix?: string
}

export function FlipNumber({
  value,
  decimals = 2,
  className = '',
  prefix = '',
}: Props) {
  const [anim, setAnim] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current !== value) {
      setAnim(true)
      const t = window.setTimeout(() => setAnim(false), 220)
      prev.current = value
      return () => window.clearTimeout(t)
    }
  }, [value])

  const text = `${prefix}${value.toFixed(decimals)}`

  return (
    <span className={`flip-num tabular ${anim ? 'flip-active' : ''} ${className}`}>
      {text}
    </span>
  )
}
