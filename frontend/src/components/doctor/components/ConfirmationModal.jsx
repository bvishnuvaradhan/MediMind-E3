import React from 'react';

export function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmTone = 'primary' }) {
  if (!isOpen) return null;

  return (
    <div className="doctor-modal-overlay" onClick={onClose}>
      <div className="doctor-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="doctor-modal-header">
          <h3 className="doctor-modal-title">{title}</h3>
          <button className="doctor-btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="doctor-modal-body">
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--doctor-text-secondary)', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div className="doctor-modal-footer">
          <button type="button" className="doctor-btn doctor-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`doctor-btn ${confirmTone === 'danger' ? 'doctor-btn-danger' : 'doctor-btn-primary'}`}
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
