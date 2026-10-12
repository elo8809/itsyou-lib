export interface DocumentEditorHandle {
    insertField: (key: string) => void;
}
export interface DocumentEditorProps {
    value: string;
    onChange: (html: string) => void;
    label?: string;
    disabled?: boolean;
}
/** Rich text authoring with an optional HTML view; never mounts unsanitized markup. */
declare const DocumentEditor: import("react").ForwardRefExoticComponent<DocumentEditorProps & import("react").RefAttributes<DocumentEditorHandle>>;
export default DocumentEditor;
