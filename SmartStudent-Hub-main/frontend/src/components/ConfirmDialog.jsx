import { Trash2, X, AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({ student, onConfirm, onCancel, loading }) {
  if (!student) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-body">
          <div className="confirm-icon-wrap">
            <AlertTriangle size={28} />
          </div>
          <div className="confirm-title">Delete Student?</div>
          <p className="confirm-desc">
            You are about to permanently delete <strong>{student.name}</strong> (ID #{student.id}).
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            <X size={14} /> Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            <Trash2 size={14} />
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
