export default function RequestFileDialog({ url, fields, onClose, onSaved, resource, editing, }: {
    url: string;
    fields: Record<string, string>;
    onClose: () => void;
    onSaved: () => void;
    resource?: boolean;
    editing?: {
        label: string;
        description: string;
    };
}): import("react/jsx-runtime").JSX.Element;
