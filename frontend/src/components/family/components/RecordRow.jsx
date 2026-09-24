import { ChevronRight } from 'lucide-react';

export function RecordRow({ record, announce, onOpen }) {
  const Icon = record.icon;
  return (
    <button
      className="record-row"
      onClick={() => (onOpen ? onOpen(record) : announce(`Opening ${record.type.toLowerCase()} record...`))}
    >
      <div className={`record-icon ${record.color}`}>
        <Icon size={18} />
      </div>
      <div className="record-copy">
        <strong>{record.type}</strong>
        <span>
          {record.date} · {record.source}
        </span>
      </div>
      <span className="status-text">{record.status}</span>
      <ChevronRight size={17} />
    </button>
  );
}
