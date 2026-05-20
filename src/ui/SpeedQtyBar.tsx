type Props = {
  disabled?: boolean
  qty: number
  onQty: (q: number) => void
  onReset: () => void
}

export function SpeedQtyBar({ disabled, qty, onQty, onReset }: Props) {
  return (
    <div className="speed-qty-bar">
      <span className="speed-label">속도주문</span>
      <button type="button" disabled={disabled} onClick={() => onQty(qty + 0.01)}>
        +0.01
      </button>
      <button type="button" disabled={disabled} onClick={() => onQty(qty + 0.05)}>
        +0.05
      </button>
      <button type="button" disabled={disabled} onClick={() => onQty(qty + 0.1)}>
        +0.1
      </button>
      <button type="button" className="reset" disabled={disabled} onClick={onReset}>
        RESET
      </button>
      <span className="speed-qty tabular">{qty}</span>
    </div>
  )
}
