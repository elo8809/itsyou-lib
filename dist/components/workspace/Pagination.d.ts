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
    rangeLabel?: (start: number, end: number, total: number) => string;
    pageLabel?: (page: number, totalPages: number) => string;
}
export default function Pagination({ page, pageSize, total, totalPages, onPageChange, disabled, noun, previousLabel, nextLabel, rangeLabel, pageLabel, }: PaginationProps): import("react/jsx-runtime").JSX.Element;
