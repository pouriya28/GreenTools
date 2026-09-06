// src/features/products/components/ProductDescriptionEditor/ProductDescriptionEditor.tsx

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

import { sanitizeDescriptionHtml } from '@/features/products/utils/sanitizeDescriptionHtml';

interface ProductDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  compact?: boolean;
  maxLength?: number;
}

export function ProductDescriptionEditor({
  value,
  onChange,
  placeholder = 'توضیحات محصول را وارد کنید...',
  disabled = false,
  compact = false,
  maxLength,
}: ProductDescriptionEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value ?? '');

  const sourceTextareaRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),

      Underline,

      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'nofollow noopener noreferrer',
          target: '_blank',
        },
      }),

      Table.configure({
        resizable: false,
      }),

      TableRow,
      TableHeader,
      TableCell,
    ],

    content: value ?? '',

    editable: !disabled,

    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitizedHtml = sanitizeDescriptionHtml(html);

      onChange(sanitizedHtml);
    },

    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none rounded-b-lg border border-t-0 border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ' +
          (compact ? 'min-h-[140px]' : 'min-h-[20rem]'),
      },
    },
  });

  /*
   * Sync external value → editor.
   *
   * This is important when editing an existing product.
   */
  useEffect(() => {
    if (!editor || sourceMode) {
      return;
    }

    const currentHtml = editor.getHTML();
    const incomingHtml = value ?? '';

    if (incomingHtml !== currentHtml) {
      editor.commands.setContent(incomingHtml, {
        emitUpdate: false,
      });
    }
  }, [editor, value, sourceMode]);

  /*
   * Keep source editor synchronized with external value
   * while we are not editing the source manually.
   */
  useEffect(() => {
    if (!sourceMode) {
      setSourceHtml(value ?? '');
    }
  }, [value, sourceMode]);

  /*
   * Enter HTML Source Mode.
   *
   * We take the current TipTap HTML and sanitize it before
   * exposing it to the source editor.
   */
  const enterSourceMode = useCallback(() => {
    if (!editor || disabled) {
      return;
    }

    const html = sanitizeDescriptionHtml(editor.getHTML());

    setSourceHtml(html);
    setSourceMode(true);

    requestAnimationFrame(() => {
      sourceTextareaRef.current?.focus();
    });
  }, [editor, disabled]);

  /*
   * Apply HTML Source → TipTap.
   *
   * IMPORTANT:
   * The source HTML is sanitized before TipTap receives it.
   */
  const applySourceHtml = useCallback(() => {
    if (!editor || disabled) {
      return;
    }

    const sanitizedHtml = sanitizeDescriptionHtml(sourceHtml);

    setSourceHtml(sanitizedHtml);

    editor.commands.setContent(sanitizedHtml, {
      emitUpdate: false,
    });

    onChange(sanitizedHtml);

    setSourceMode(false);
  }, [editor, disabled, sourceHtml, onChange]);

  /*
   * Cancel Source Mode.
   *
   * We intentionally discard source changes.
   */
  const cancelSourceMode = useCallback(() => {
    if (!editor) {
      return;
    }

    const currentHtml = sanitizeDescriptionHtml(editor.getHTML());

    setSourceHtml(currentHtml);
    setSourceMode(false);
  }, [editor]);

  /*
   * Escape key inside source editor:
   *
   * Esc = cancel source editing.
   */
  const handleSourceKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelSourceMode();
    }

    /*
     * Ctrl/Cmd + Enter = apply.
     */
    if (
      event.key === 'Enter' &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      applySourceHtml();
    }
  };

  const setLink = useCallback(() => {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes('link').href as
      | string
      | undefined;

    const url = window.prompt(
      'آدرس لینک را وارد کنید:',
      previousUrl ?? 'https://',
    );

    if (url === null) {
      return;
    }

    if (url === '') {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .unsetLink()
        .run();

      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: url,
      })
      .run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const charCount = sourceMode
    ? getPlainTextLength(sourceHtml)
    : editor.getText().length;

  const overLimit =
    typeof maxLength === 'number' && charCount > maxLength;

  const toolbarBtn = (active: boolean) =>
    `min-h-9 min-w-9 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'border border-slate-700/60 bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
    } disabled:cursor-not-allowed disabled:opacity-40`;

  return (
    <div className="w-full" dir="rtl">
      {!sourceMode ? (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto rounded-t-lg border border-slate-700 bg-slate-950 p-2 shadow-inner">
            {!compact && (
              <>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({ level: 2 })
                      .run()
                  }
                  className={toolbarBtn(
                    editor.isActive('heading', { level: 2 }),
                  )}
                >
                  H2
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({ level: 3 })
                      .run()
                  }
                  className={toolbarBtn(
                    editor.isActive('heading', { level: 3 }),
                  )}
                >
                  H3
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .toggleHeading({ level: 4 })
                      .run()
                  }
                  className={toolbarBtn(
                    editor.isActive('heading', { level: 4 }),
                  )}
                >
                  H4
                </button>

                <div className="mx-1 h-5 w-px self-center bg-slate-800" />
              </>
            )}

            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().toggleBold().run()
              }
              className={toolbarBtn(editor.isActive('bold'))}
            >
              <strong>B</strong>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().toggleItalic().run()
              }
              className={toolbarBtn(editor.isActive('italic'))}
            >
              <em>I</em>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().toggleUnderline().run()
              }
              className={toolbarBtn(
                editor.isActive('underline'),
              )}
            >
              <span className="underline">U</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().toggleStrike().run()
              }
              className={toolbarBtn(
                editor.isActive('strike'),
              )}
            >
              <span className="line-through">S</span>
            </button>

            <div className="mx-1 h-5 w-px self-center bg-slate-800" />

            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().toggleBulletList().run()
              }
              className={toolbarBtn(
                editor.isActive('bulletList'),
              )}
            >
              • لیست
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
              className={toolbarBtn(
                editor.isActive('orderedList'),
              )}
            >
              ۱. لیست
            </button>

            {!compact && (
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  editor.chain().focus().toggleBlockquote().run()
                }
                className={toolbarBtn(
                  editor.isActive('blockquote'),
                )}
              >
                نقل‌قول
              </button>
            )}

            <div className="mx-1 h-5 w-px self-center bg-slate-800" />

            <button
              type="button"
              disabled={disabled}
              onClick={setLink}
              className={toolbarBtn(editor.isActive('link'))}
            >
              لینک
            </button>

            {!compact && (
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({
                      rows: 2,
                      cols: 2,
                      withHeaderRow: true,
                    })
                    .run()
                }
                className={toolbarBtn(
                  editor.isActive('table'),
                )}
              >
                جدول
              </button>
            )}

            {/* HTML Source Mode */}
            <div className="mx-1 h-5 w-px self-center bg-slate-800" />

            <button
              type="button"
              disabled={disabled}
              onClick={enterSourceMode}
              className="min-h-9 rounded-md border border-amber-700/60 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-900/50 disabled:cursor-not-allowed disabled:opacity-40"
              title="ویرایش مستقیم HTML"
            >
              &lt;/&gt; HTML
            </button>
          </div>

          {/* Visual Editor */}
          <EditorContent
            editor={editor}
            placeholder={placeholder}
          />
        </>
      ) : (
        <>
          {/* Source Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-slate-700 bg-slate-950 p-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-300">
                حالت HTML
              </span>

              <span className="hidden text-xs text-slate-500 sm:inline">
                HTML قبل از اعمال پاک‌سازی می‌شود
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={cancelSourceMode}
                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                انصراف
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={applySourceHtml}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                اعمال HTML
              </button>
            </div>
          </div>

          {/* HTML Source */}
          <textarea
            ref={sourceTextareaRef}
            value={sourceHtml}
            onChange={(event) =>
              setSourceHtml(event.target.value)
            }
            onKeyDown={handleSourceKeyDown}
            disabled={disabled}
            spellCheck={false}
            aria-label="HTML source"
            placeholder={`<h2>عنوان محصول</h2>

<p>
توضیحات محصول...
<strong>متن مهم</strong>
</p>`}
            className={
              'block w-full resize-y rounded-b-lg border border-t-0 border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm leading-7 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ' +
              (compact ? 'min-h-[180px]' : 'min-h-[20rem]')
            }
            dir="ltr"
          />

          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500">
              Ctrl/Cmd + Enter برای اعمال
            </span>

            <span className="text-slate-500">
              Escape برای انصراف
            </span>
          </div>
        </>
      )}

      {/* Character Count */}
      {typeof maxLength === 'number' && (
        <div
          className={`mt-1.5 text-left font-mono text-xs ${
            overLimit
              ? 'font-bold text-rose-400'
              : 'text-slate-400'
          }`}
        >
          {charCount.toLocaleString('fa-IR')} /{' '}
          {maxLength.toLocaleString('fa-IR')}
        </div>
      )}
    </div>
  );
}

/**
 * Calculates the readable text length from HTML.
 *
 * Used only for the character counter.
 */
function getPlainTextLength(html: string): number {
  if (!html) {
    return 0;
  }

  const cleanHtml = sanitizeDescriptionHtml(html);

  const container = document.createElement('div');
  container.innerHTML = cleanHtml;

  return (container.textContent ?? '').length;
}