import type { Position } from '../types/tradingTypes.ts'

export function createPositionStore() {
  const byId = new Map<string, Position>()

  return {
    list(): Position[] {
      return [...byId.values()]
    },

    listBySymbol(symbol: string): Position[] {
      return [...byId.values()].filter((p) => p.symbol === symbol)
    },

    get(positionId: string): Position | undefined {
      return byId.get(positionId)
    },

    upsert(position: Position): void {
      byId.set(position.positionId, { ...position })
    },

    remove(positionId: string): boolean {
      return byId.delete(positionId)
    },

    replaceAll(items: readonly Position[]): void {
      byId.clear()
      for (const p of items) {
        byId.set(p.positionId, { ...p })
      }
    },
  }
}

export type PositionStore = ReturnType<typeof createPositionStore>
