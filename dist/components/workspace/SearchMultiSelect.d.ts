export type SearchMultiSelectOption = {
    id: string;
    label: string;
};
/** Searchable multi-selection with keyboard navigation and a compact summary. */
export default function SearchMultiSelect({ label, options, value, onChange, placeholder, noResultsMessage, toggleLabel, }: {
    label: string;
    options: SearchMultiSelectOption[];
    value: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    noResultsMessage?: string;
    toggleLabel?: string;
}): import("react/jsx-runtime").JSX.Element;
