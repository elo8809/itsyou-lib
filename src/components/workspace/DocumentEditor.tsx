import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import createDOMPurify from 'dompurify';
import classNames from 'classnames/dedupe';
import FilterTabs from './FilterTabs';

export interface DocumentEditorHandle {
  insertField: (key: string) => void;
}
export interface DocumentEditorProps {
  value: string;
  onChange: (html: string) => void;
  label?: string;
  disabled?: boolean;
}
const toolbar = [
  { label: 'Bold', text: 'B', command: 'bold' },
  { label: 'Italic', text: 'I', command: 'italic' },
  {
    label: 'Heading',
    text: 'H2',
    command: 'formatBlock',
    value: 'h2',
  },
  {
    label: 'Paragraph',
    text: '¶',
    command: 'formatBlock',
    value: 'p',
  },
  {
    label: 'Bulleted list',
    text: '• List',
    command: 'insertUnorderedList',
  },
  {
    label: 'Numbered list',
    text: '1. List',
    command: 'insertOrderedList',
  },
  { label: 'Undo', text: '↶', command: 'undo' },
  { label: 'Redo', text: '↷', command: 'redo' },
];
function clean(html: string) {
  const purifier = createDOMPurify(window);
  purifier.addHook(
    'uponSanitizeAttribute',
    (node, data) => {
      if (
        data.attrName === 'src' &&
        !/^data:image\/(png|jpeg|gif|webp);base64,/.test(
          data.attrValue,
        )
      )
        data.keepAttr = false;
    },
  );
  return purifier.sanitize(html, {
    FORBID_TAGS: [
      'style',
      'script',
      'iframe',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'video',
      'audio',
      'svg',
      'math',
    ],
    FORBID_ATTR: ['style', 'id'],
  });
}
/** Rich text authoring with an optional HTML view; never mounts unsanitized markup. */
const DocumentEditor = forwardRef<
  DocumentEditorHandle,
  DocumentEditorProps
>(function DocumentEditor(
  { value, onChange, label = 'Contract content', disabled },
  ref,
) {
  const [mode, setMode] = useState('visual');
  const editor = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLTextAreaElement>(null);
  const range = useRef<Range | null>(null);
  const lastValue = useRef<string>();
  useEffect(() => {
    if (
      mode === 'visual' &&
      editor.current &&
      lastValue.current !== value
    ) {
      editor.current.innerHTML = clean(value);
      lastValue.current = value;
    }
  }, [value, mode]);
  const capture = () => {
    const selection = window.getSelection();
    if (
      selection?.rangeCount &&
      editor.current?.contains(selection.anchorNode)
    )
      range.current = selection.getRangeAt(0).cloneRange();
  };
  const change = () => {
    if (!editor.current) return;
    lastValue.current = editor.current.innerHTML;
    onChange(lastValue.current);
    capture();
  };
  const command = (name: string, argument?: string) => {
    if (disabled) return;
    editor.current?.focus();
    const selection = window.getSelection();
    if (
      range.current &&
      editor.current?.contains(
        range.current.commonAncestorContainer,
      )
    ) {
      selection?.removeAllRanges();
      selection?.addRange(range.current);
    }
    // Native editing commands preserve the browser's undo history and existing contract markup.
    document.execCommand(name, false, argument);
    change();
  };
  useImperativeHandle(ref, () => ({
    insertField(key) {
      const token = `{{${key}}}`;
      if (mode === 'html' && source.current) {
        const { selectionStart: start, selectionEnd: end } =
          source.current;
        onChange(
          value.slice(0, start) + token + value.slice(end),
        );
        source.current.focus();
      } else command('insertText', token);
    },
  }));
  return (
    <div
      className={classNames(
        'ui-document-editor',
        disabled && 'opacity-60',
      )}
    >
      <div className="ui-document-editor-bar">
        <FilterTabs
          label="Editor mode"
          value={mode}
          onChange={(next) => {
            lastValue.current = undefined;
            range.current = null;
            setMode(next);
          }}
          options={[
            { value: 'visual', label: 'Write' },
            { value: 'html', label: 'HTML' },
          ]}
        />
        <span className="ui-document-editor-hint">
          Insert fields from the sidebar
        </span>
      </div>
      {mode === 'visual' ? (
        <>
          <div
            className="ui-document-toolbar"
            role="toolbar"
            aria-label="Text formatting"
          >
            {toolbar.map((item) => (
              <button
                key={item.label}
                type="button"
                title={item.label}
                aria-label={item.label}
                disabled={disabled}
                onMouseDown={(event) =>
                  event.preventDefault()
                }
                onClick={() =>
                  command(item.command, item.value)
                }
              >
                {item.text}
              </button>
            ))}
          </div>
          <div
            ref={editor}
            role="textbox"
            aria-label={label}
            aria-multiline="true"
            aria-disabled={disabled || undefined}
            contentEditable={!disabled}
            suppressContentEditableWarning
            className="ui-document-content"
            onInput={change}
            onKeyUp={capture}
            onMouseUp={capture}
            onBlur={capture}
            onPaste={(event) => {
              event.preventDefault();
              command(
                'insertText',
                event.clipboardData.getData('text/plain'),
              );
            }}
            onDrop={(event) => event.preventDefault()}
          />
        </>
      ) : (
        <textarea
          ref={source}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label={`${label} HTML`}
          spellCheck={false}
          className="ui-document-source"
        />
      )}
    </div>
  );
});
export default DocumentEditor;
