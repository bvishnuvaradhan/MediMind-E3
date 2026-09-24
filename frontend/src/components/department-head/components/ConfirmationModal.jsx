import React from 'react';

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmTone = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="dh-modal-overlay" onClick={onClose}>
      <div className="dh-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="dh-modal-header">
          <h3 className="dh-modal-title">{title}</h3>
          <button className="dh-btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="dh-modal-body">
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--dh-text-secondary)', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div className="dh-modal-footer">
          <button type="button" className="dh-btn dh-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`dh-btn ${confirmTone === 'danger' ? 'dh-btn-danger' : 'dh-btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
