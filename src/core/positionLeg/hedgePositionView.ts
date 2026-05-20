import type { HedgePositionBook } from './types.ts'

export function hasSeparateLegs(book: HedgePositionBook): boolean {
  return Boolean(book.longLeg || book.shortLeg)
}

export function bothLegsOpen(book: HedgePositionBook): boolean {
  return Boolean(
    book.longLeg &&
      book.longLeg.qty > 0 &&
      book.shortLeg &&
      book.shortLeg.qty > 0,
  )
}

export function assertNoNetPositionField(book: HedgePositionBook): void {
  const forbidden = ['netPosition', 'netQty', 'netSide'] as const
  for (const key of forbidden) {
    if (key in book) {
      throw new Error(`Forbidden net field on HedgePositionBook: ${key}`)
    }
  }
}
