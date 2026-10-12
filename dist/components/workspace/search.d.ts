export interface SearchSelectOption {
    value: string;
    label: string;
    description?: string;
    meta?: string;
    keywords?: (string | number | null | undefined)[];
    disabled?: boolean;
}
/** Search every term across labels and metadata; ignore accents and phone formatting. */
export declare function filterSelectOptions(options: SearchSelectOption[], query: string): SearchSelectOption[];
