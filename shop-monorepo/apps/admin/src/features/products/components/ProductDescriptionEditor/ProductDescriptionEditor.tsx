// src/features/products/components/ProductDescriptionEditor/ProductDescriptionEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link } from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useCallback, useEffect } from 'react';
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
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
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
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(sanitizeDescriptionHtml(editor.getHTML()));
    },
    editorProps: {
      attributes: {
        // بازنویسی کلاس‌های تایپوگرافی تیره و خوانایی محیط متنی
        class:
          'prose prose-invert max-w-none rounded-b-lg border border-t-0 border-slate-700 bg-slate-900/90 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 ' +
          (compact ? 'min-h-[140px]' : 'min-h-[20rem]'),
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('آدرس لینک را وارد کنید:', previousUrl ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const charCount = editor.getText().length;
  const overLimit = typeof maxLength === 'number' && charCount > maxLength;

  // بازنویسی استایل دکمه‌های تولبار برای تفکیک عالی در حالت Active و Hover
  const toolbarBtn = (active: boolean) =>
    `min-h-9 min-w-9 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
    } disabled:cursor-not-allowed disabled:opacity-40`;

  return (
    <div className="w-full" dir="rtl">
      {/* تولبار ادیتور با پس‌زمینه تیره مشخص و Border مجزا */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto rounded-t-lg border border-slate-700 bg-slate-950 p-2 shadow-inner">
        {!compact && (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={toolbarBtn(editor.isActive('heading', { level: 2 }))}
            >
              H2
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={toolbarBtn(editor.isActive('heading', { level: 3 }))}
            >
              H3
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              className={toolbarBtn(editor.isActive('heading', { level: 4 }))}
            >
              H4
            </button>
            <div className="mx-1 h-5 w-px self-center bg-slate-800" />
          </>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={toolbarBtn(editor.isActive('bold'))}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={toolbarBtn(editor.isActive('italic'))}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={toolbarBtn(editor.isActive('underline'))}
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={toolbarBtn(editor.isActive('strike'))}
        >
          <span className="line-through">S</span>
        </button>

        <div className="mx-1 h-5 w-px self-center bg-slate-800" />

        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarBtn(editor.isActive('bulletList'))}
        >
          • لیست
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarBtn(editor.isActive('orderedList'))}
        >
          ۱. لیست
        </button>
        {!compact && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={toolbarBtn(editor.isActive('blockquote'))}
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
              editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run()
            }
            className={toolbarBtn(editor.isActive('table'))}
          >
            جدول
          </button>
        )}
      </div>

      {/* ناحیه متنی ادیتور */}
      <EditorContent editor={editor} placeholder={placeholder} />

      {/* شمارنده کاراکترها */}
      {typeof maxLength === 'number' && (
        <div className={`mt-1.5 text-left text-xs font-mono ${overLimit ? 'font-bold text-rose-400' : 'text-slate-400'}`}>
          {charCount.toLocaleString('fa-IR')} / {maxLength.toLocaleString('fa-IR')}
        </div>
      )}
    </div>
  );
}