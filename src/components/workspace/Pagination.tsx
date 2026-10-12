import Icon from '../base/Icon';
export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  totalPages?: number;
  disabled?: boolean;
  noun?: string;
  previousLabel?: string;
  nextLabel?: string;
  rangeLabel?: (
    start: number,
    end: number,
    total: number,
  ) => string;
  pageLabel?: (page: number, totalPages: number) => string;
}
export default function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  disabled,
  noun = 'results',
  previousLabel = 'Previous page',
  nextLabel = 'Next page',
  rangeLabel,
  pageLabel,
}: PaginationProps) {
  const size = Math.max(1, pageSize);
  const count = Math.max(0, total);
  const pages = Math.max(
    1,
    totalPages || Math.ceil(count / size),
  );
  const current = Math.min(Math.max(1, page), pages);
  const start = count ? (current - 1) * size + 1 : 0;
  const end = Math.min(current * size, count);
  return (
    <div className="ui-table-pagination">
      <span>
        {rangeLabel
          ? rangeLabel(start, end, count)
          : `${start}–${end} of ${count} ${noun}`}
      </span>
      <div>
        <button
          type="button"
          disabled={disabled || current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label={previousLabel}
        >
          <Icon
            name="ChevronDown"
            size={15}
            className="rotate-90"
          />
        </button>
        <span aria-live="polite">
          {pageLabel
            ? pageLabel(current, pages)
            : `Page ${current} of ${pages}`}
        </span>
        <button
          type="button"
          disabled={disabled || current >= pages}
          onClick={() => onPageChange(current + 1)}
          aria-label={nextLabel}
        >
          <Icon
            name="ChevronDown"
            size={15}
            className="-rotate-90"
          />
        </button>
      </div>
    </div>
  );
}
