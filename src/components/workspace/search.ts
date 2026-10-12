export interface SearchSelectOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
  keywords?: (string | number | null | undefined)[];
  disabled?: boolean;
}

const normalize = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/ß/g, 'ss');
const compact = (value: string) =>
  value.replace(/[^\p{L}\p{N}]/gu, '');

/** Search every term across labels and metadata; ignore accents and phone formatting. */
export function filterSelectOptions(
  options: SearchSelectOption[],
  query: string,
): SearchSelectOption[] {
  const terms = normalize(query)
    .split(/\s+/)
    .map(compact)
    .filter(Boolean);
  if (!terms.length) return options;
  return options.filter((option) => {
    const fields = [
      option.label,
      option.meta,
      option.description,
      ...(option.keywords || []),
    ]
      .filter((v) => v != null)
      .map((v) => compact(normalize(String(v))));
    return terms.every((term) =>
      fields.some((field) => field.includes(term)),
    );
  });
}
