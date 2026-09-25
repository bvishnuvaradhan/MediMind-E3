import { X, Trash2, FileText } from 'lucide-react';

export function DeleteRecordModal({ isOpen, onClose, record, onConfirmDelete }) {
  if (!isOpen || !record) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal delete-record-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-record-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0, backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <Trash2 size={20} />
            </div>
            <div>
              <p className="eyebrow" style={{ color: '#dc2626' }}>Confirm Document Deletion</p>
              <h2 id="delete-record-title" style={{ margin: 0, fontSize: '18px' }}>
                Delete Medical Record
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close delete modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '16px 0', padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <FileText size={22} style={{ color: 'var(--family-primary)', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)', marginBottom: '2px' }}>
              {record.title || record.type || 'Medical Document'}
            </strong>
            <span style={{ display: 'block', fontSize: '12.5px', color: 'var(--family-muted)' }}>
              Patient: <strong>{record.patient || 'Family Member'}</strong> · {record.category || 'Reports'}
            </span>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--family-subtle)', marginTop: '2px' }}>
              Date: {record.date} · Source: {record.source}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--family-muted)', lineHeight: '1.5', margin: 0 }}>
          Are you sure you want to permanently delete this document from your family records? This document will no longer be available for clinical consultation reviews or AI predictions.
        </p>

        <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            onClick={() => {
              onConfirmDelete(record);
              onClose();
            }}
          >
            Delete Record
          </button>
        </div>
      </section>
    </div>
  );
}
