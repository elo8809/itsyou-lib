import { FormField, TextInput } from './FormField';
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
export default function ContractFields({
  fields,
  values,
  onChange,
  disabled,
}: {
  fields: DynamicContractField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
}) {
  if (!fields.length) return null;
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {fields.map((field) => (
        <FormField
          key={field.key}
          label={`${field.label}${field.required ? ' *' : ''}`}
          className={
            field.type === 'multiline'
              ? 'sm:col-span-2'
              : ''
          }
        >
          {field.type === 'multiline' ? (
            <textarea
              className="ui-input min-h-24"
              required={field.required}
              disabled={disabled}
              maxLength={4000}
              value={
                values[field.key] ??
                field.defaultValue ??
                ''
              }
              onChange={(event) =>
                onChange({
                  ...values,
                  [field.key]: event.target.value,
                })
              }
            />
          ) : (
            <TextInput
              type={field.type}
              step={
                field.type === 'number' ? 'any' : undefined
              }
              required={field.required}
              disabled={disabled}
              maxLength={4000}
              value={
                values[field.key] ??
                field.defaultValue ??
                ''
              }
              onChange={(event) =>
                onChange({
                  ...values,
                  [field.key]: event.target.value,
                })
              }
            />
          )}
        </FormField>
      ))}
    </div>
  );
}
