import React from 'react';
import './Pagination.css';

/**
 * Reusable Pagination component for all MediMind roles.
 * Props:
 *   currentPage    {number}   1-based current page
 *   totalItems     {number}   Total count of items
 *   pageSize       {number}   Items per page
 *   onPageChange   {fn}       Called with new page number (1-based)
 *   onPageSizeChange {fn}     Called with new page size
 *   pageSizeOptions {number[]} Defaults to [10, 20, 50]
 */
export function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Build page range: show at most 5 pages centered around current
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    const delta = 2;
    const left = Math.max(2, safeCurrentPage - delta);
    const right = Math.min(totalPages - 1, safeCurrentPage + delta);
    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="pagination-root">
      <div className="pagination-info">
        {totalItems === 0
          ? 'No items'
          : `Showing ${startItem}–${endItem} of ${totalItems} items`}
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange && onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {getPageNumbers().map((pg, idx) =>
          pg === '...' ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={pg}
              className={`pagination-btn ${pg === safeCurrentPage ? 'active' : ''}`}
              onClick={() => onPageChange && onPageChange(pg)}
            >
              {pg}
            </button>
          )
        )}
        <button
          className="pagination-btn"
          onClick={() => onPageChange && onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
      <div className="pagination-size">
        <label htmlFor="page-size-select">Per page:</label>
        <select
          id="page-size-select"
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange && onPageSizeChange(Number(e.target.value));
            onPageChange && onPageChange(1);
          }}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Pagination;
