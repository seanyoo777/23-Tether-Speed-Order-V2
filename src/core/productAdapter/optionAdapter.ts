import { createBaseAdapter } from './baseAdapter.ts'
import { filterIntentsForSpec } from '../orderIntent/validators.ts'
import { ALL_ORDER_INTENTS } from '../orderIntent/validators.ts'
import type { SymbolSpec } from '../symbolSpec/types.ts'

const base = createBaseAdapter('option')

export const optionAdapter = {
  ...base,
  allowedOrderIntents: (spec: SymbolSpec) =>
    filterIntentsForSpec(
      ALL_ORDER_INTENTS.filter((i) => !i.startsWith('OPEN_SHORT') || spec.shortEnabled),
      spec,
    ),
}
