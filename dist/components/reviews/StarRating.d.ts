/** Native radio controls keep star selection usable by keyboard and touch. */
export default function StarRating({ value, onChange, disabled, label, locale, }: {
    value: number;
    onChange?: (value: number) => void;
    disabled?: boolean;
    label: string;
    locale?: 'de' | 'en';
}): import("react/jsx-runtime").JSX.Element;
