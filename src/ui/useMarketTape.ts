import { useEffect, useRef, useState } from 'react'
import type { AuditEntry } from '../types/tradingTypes.ts'

export type MarketTapeRow = {
  id: string
  price: number
  qty: number
  side: 'BUY' | 'SELL'
  time?: string
  isNew?: boolean
}

const MAX = 30

export function useMarketTape(
  lastPrice: number,
  symbol: string,
  version: number,
  audits: readonly AuditEntry[],
) {
  const [rows, setRows] = useState<MarketTapeRow[]>([])
  const prevPrice = useRef(lastPrice)
  const prevAuditLen = useRef(0)

  useEffect(() => {
    const next: MarketTapeRow[] = []
    const lastAudit = audits.at(-1)
    if (audits.length > prevAuditLen.current && lastAudit) {
      const side: 'BUY' | 'SELL' =
        lastAudit.detail.includes('LONG') || lastAudit.action.includes('buy')
          ? 'BUY'
          : lastAudit.detail.includes('SHORT')
            ? 'SELL'
            : lastPrice >= prevPrice.current
              ? 'BUY'
              : 'SELL'
      next.push({
        id: lastAudit.id,
        price: lastPrice,
        qty: Number((0.04 + hashQty(lastAudit.id)).toFixed(3)),
        side,
        time: formatTapeTime(lastAudit.at),
        isNew: true,
      })
    } else if (lastPrice !== prevPrice.current) {
      next.push({
        id: `tick-${version}`,
        price: lastPrice,
        qty: Number((0.06 + hashQty(symbol + String(lastPrice)) * 0.3).toFixed(3)),
        side: lastPrice >= prevPrice.current ? 'BUY' : 'SELL',
        time: formatTapeTime(Date.now()),
        isNew: true,
      })
    }
    prevPrice.current = lastPrice
    prevAuditLen.current = audits.length

    if (next.length === 0) return
    setRows((prev) => [...next, ...prev].slice(0, MAX))

    const clearNew = window.setTimeout(() => {
      setRows((prev) => prev.map((r) => ({ ...r, isNew: false })))
    }, 400)
    return () => window.clearTimeout(clearNew)
  }, [lastPrice, symbol, version, audits])

  return rows
}

function formatTapeTime(at: number): string {
  const d = new Date(at)
  return d.toLocaleTimeString('ko-KR', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function hashQty(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997
  return (h % 100) / 100
}
