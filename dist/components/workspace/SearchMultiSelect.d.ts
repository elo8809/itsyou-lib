export type SearchMultiSelectOption = {
    id: string;
    label: string;
};
/** Searchable multi-selection with keyboard navigation and a compact summary. */
export default function SearchMultiSelect({ label, options, value, onChange, }: {
    label: string;
    options: SearchMultiSelectOption[];
    value: string[];
    onChange: (values: string[]) => void;
}): import("react/jsx-runtime").JSX.Element;
