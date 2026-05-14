interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (total <= pageSize) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: '#f0e8e0' }}>
      <span className="text-xs" style={{ color: 'var(--navy-light)' }}>
        Showing {start}-{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        {page > 0 && (
          <button
            onClick={() => onPageChange(page - 1)}
            className="text-xs font-medium px-3 py-1 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--pink-light)', color: 'var(--pink-dark)' }}
          >
            Previous
          </button>
        )}
        <span className="text-xs" style={{ color: 'var(--navy-light)' }}>
          Page {page + 1} of {totalPages}
        </span>
        {page + 1 < totalPages && (
          <button
            onClick={() => onPageChange(page + 1)}
            className="text-xs font-medium px-3 py-1 rounded-lg transition-colors"
            style={{ background: 'var(--pink)', color: 'white' }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
