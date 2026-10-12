import { SearchSelectOption } from './search';
export interface SearchSelectProps {
    options: SearchSelectOption[];
    value?: string | null;
    onChange: (value: string | null) => void;
    onBlur?: () => void;
    label: string;
    name?: string;
    id?: string;
    hint?: string;
    error?: string;
    placeholder?: string;
    emptyMessage?: string;
    noResultsMessage?: string;
    loadingMessage?: string;
    loading?: boolean;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    toggleLabel?: string;
}
/** Controlled, keyboard-accessible selector with virtualized results for large lists. */
declare const SearchSelect: import("react").ForwardRefExoticComponent<SearchSelectProps & import("react").RefAttributes<HTMLInputElement>>;
export default SearchSelect;
