import type { AuditEntry } from '../types/tradingTypes.ts'

function nextSeqFromAudits(entries: readonly AuditEntry[]): number {
  let max = 0
  for (const e of entries) {
    const n = Number.parseInt(e.id.replace('audit-', ''), 10)
    if (Number.isFinite(n) && n >= max) max = n
  }
  return max + 1
}

export function createAuditEngine() {
  let auditSeq = 1
  const entries: AuditEntry[] = []

  return {
    list(): readonly AuditEntry[] {
      return entries
    },

    last(): AuditEntry | undefined {
      return entries.at(-1)
    },

    append(action: string, detail: string): AuditEntry {
      const entry: AuditEntry = {
        id: `audit-${auditSeq++}`,
        action,
        detail,
        at: Date.now(),
      }
      entries.push(entry)
      return entry
    },

    replaceAll(items: readonly AuditEntry[]): void {
      entries.length = 0
      entries.push(...items.map((e) => ({ ...e })))
      auditSeq = nextSeqFromAudits(entries)
    },
  }
}

export type AuditEngine = ReturnType<typeof createAuditEngine>
