import { ChevronRight, Trash2, FileText } from 'lucide-react';

export function RecordRow({ record, announce, onOpen, onDelete }) {
  const Icon = record.icon || FileText;
  return (
    <div className="record-row-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
      <button
        type="button"
        className="record-row"
        style={{ flex: 1, minWidth: 0 }}
        onClick={() => (onOpen ? onOpen(record) : announce(`Opening ${record.type?.toLowerCase() || 'record'}...`))}
      >
        <div className={`record-icon ${record.color || 'blue'}`}>
          <Icon size={18} />
        </div>
        <div className="record-copy">
          <strong>{record.title || record.type}</strong>
          <span>
            {record.patient ? `${record.patient} · ` : ''}{record.date} · {record.source}
          </span>
        </div>
        <span className="status-text">{record.status || 'Available'}</span>
        <ChevronRight size={17} />
      </button>

      {onDelete && (
        <button
          type="button"
          className="delete-record-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(record);
          }}
          aria-label={`Delete record ${record.title || record.type}`}
          title="Delete record"
          style={{
            padding: '9px 10px',
            backgroundColor: 'var(--family-card)',
            border: '1px solid var(--family-border)',
            borderRadius: 'var(--radius-sm, 6px)',
            color: '#dc2626',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
