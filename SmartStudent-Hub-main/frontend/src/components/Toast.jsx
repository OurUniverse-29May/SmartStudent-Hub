import { useEffect } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(t)
  }, [toast.id, onRemove])

  const icons = {
    success: <CheckCircle2 size={17} />,
    error:   <XCircle size={17} />,
    info:    <Info size={17} />,
  }

  return (
    <div className={`toast ${toast.type}`}>
      {icons[toast.type] || icons.info}
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>
        <X size={13} />
      </button>
    </div>
  )
}
