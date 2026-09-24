import { AlertTriangle, X, Check } from 'lucide-react';

export function ConfirmationModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false, onClose, onConfirm }) {
  return (
    <div className="ha-modal-backdrop" onClick={onClose}>
      <div className="ha-modal" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="ha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ color: isDestructive ? 'var(--ha-error)' : 'var(--ha-warning)' }} />
            <h3>{title}</h3>
          </div>
          <button className="ha-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="ha-modal-body">
          <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--ha-text-secondary)' }}>
            {message}
          </p>
        </div>

        <div className="ha-modal-footer">
          <button type="button" className="ha-btn ha-btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`ha-btn ${isDestructive ? 'ha-btn-danger' : 'ha-btn-primary'}`}
            onClick={onConfirm}
          >
            {isDestructive ? <AlertTriangle size={15} /> : <Check size={15} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

