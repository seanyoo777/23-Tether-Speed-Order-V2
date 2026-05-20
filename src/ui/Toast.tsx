type Props = {
  message: string | null
  onDismiss?: () => void
}

export function Toast({ message, onDismiss }: Props) {
  if (!message) return null
  return (
    <div className="hts-toast" role="status">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="toast-x" onClick={onDismiss} aria-label="닫기">
          ×
        </button>
      )}
    </div>
  )
}
