export interface DynamicContractField {
    key: string;
    label: string;
    type: 'text' | 'multiline' | 'number' | 'date';
    required: boolean;
    defaultValue?: string;
}
export interface ContractTemplateOption {
    id: string;
    templateId: string;
    name: string;
    description: string;
    category: string;
    version: number;
    fields: DynamicContractField[];
    variables: string[];
}
export default function ContractFields({ fields, values, onChange, disabled, }: {
    fields: DynamicContractField[];
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
    disabled?: boolean;
}): import("react/jsx-runtime").JSX.Element;
