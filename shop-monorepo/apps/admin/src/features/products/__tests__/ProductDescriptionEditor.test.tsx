// src/features/products/__tests__/ProductDescriptionEditor.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import { useEditor, EditorContent } from '@tiptap/react'
import { ProductDescriptionEditor } from '../components/ProductDescriptionEditor/ProductDescriptionEditor'

// --- TipTap mocks ---
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(),
  EditorContent: vi.fn(({ editor }: { editor: unknown }) =>
    editor ? <div data-testid="editor-content" contentEditable /> : null,
  ),
}))
vi.mock('@tiptap/starter-kit', () => ({ default: { configure: vi.fn(() => 'StarterKit') } }))
vi.mock('@tiptap/extension-underline', () => ({ Underline: {} }))
vi.mock('@tiptap/extension-link', () => ({ Link: { configure: vi.fn(() => 'Link') } }))
vi.mock('@tiptap/extension-table', () => ({ Table: { configure: vi.fn(() => 'Table') } }))
vi.mock('@tiptap/extension-table-row', () => ({ TableRow: {} }))
vi.mock('@tiptap/extension-table-cell', () => ({ TableCell: {} }))
vi.mock('@tiptap/extension-table-header', () => ({ TableHeader: {} }))

// --- Mock editor factory ---
function createMockChain() {
  const chain: Record<string, Mock> = {}
  const methods = [
    'focus', 'toggleBold', 'toggleItalic', 'toggleUnderline', 'toggleStrike',
    'toggleBulletList', 'toggleOrderedList', 'toggleBlockquote', 'toggleHeading',
    'extendMarkRange', 'setLink', 'unsetLink', 'insertTable', 'run',
  ]
  methods.forEach((m) => { chain[m] = vi.fn().mockReturnValue(chain) })
  return chain
}

function createMockEditor(overrides: Record<string, unknown> = {}) {
  return {
    getHTML: vi.fn(() => '<p>hello</p>'),
    getText: vi.fn(() => 'hello'),
    getAttributes: vi.fn(() => ({})),
    isActive: vi.fn(() => false),
    commands: { setContent: vi.fn() },
    chain: vi.fn(() => createMockChain()),
    ...overrides,
  }
}

const mockUseEditor = useEditor as Mock

// --- helpers ---
function setup(props: Partial<Parameters<typeof ProductDescriptionEditor>[0]> = {}) {
  const onChange = vi.fn()
  const user = userEvent.setup()
  render(
    <ProductDescriptionEditor
      value=""
      onChange={onChange}
      {...props}
    />,
  )
  return { onChange, user }
}

describe('ProductDescriptionEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEditor.mockReturnValue(createMockEditor())
  })

  // ─── rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('returns null when editor is not ready', () => {
      mockUseEditor.mockReturnValue(null)
      const { container } = render(
        <ProductDescriptionEditor value="" onChange={vi.fn()} />,
      )
      expect(container).toBeEmptyDOMElement()
    })

    it('renders visual editor when editor is ready', () => {
      setup()
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    it('renders bold, italic, underline, strike toolbar buttons', () => {
      setup()
      expect(screen.getByRole('button', { name: /^B$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^I$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^U$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^S$/i })).toBeInTheDocument()
    })

    it('renders heading buttons in non-compact mode', () => {
      setup({ compact: false })
      expect(screen.getByRole('button', { name: 'H2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'H3' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'H4' })).toBeInTheDocument()
    })

    it('does not render heading buttons in compact mode', () => {
      setup({ compact: true })
      expect(screen.queryByRole('button', { name: 'H2' })).not.toBeInTheDocument()
    })

    it('renders HTML source mode button', () => {
      setup()
      expect(screen.getByRole('button', { name: '</> HTML' })).toBeInTheDocument()
    })
  })

  // ─── disabled state ────────────────────────────────────────────────────────

  describe('disabled state', () => {
    it('disables all toolbar buttons when disabled=true', () => {
      setup({ disabled: true })
      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn) => {
        // source mode button and formatting buttons are all disabled
        expect(btn).toBeDisabled()
      })
    })
  })

  // ─── source mode ──────────────────────────────────────────────────────────

  describe('source mode', () => {
    it('enters source mode and shows HTML textarea on clicking HTML button', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: '</> HTML' }))
      expect(screen.getByRole('textbox', { name: 'HTML source' })).toBeInTheDocument()
    })

    it('shows "حالت HTML" label when in source mode', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: '</> HTML' }))
      expect(screen.getByText('حالت HTML')).toBeInTheDocument()
    })

    it('exits source mode and calls onChange on "اعمال HTML" click', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ProductDescriptionEditor value="<p>test</p>" onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: '</> HTML' }))
      await user.click(screen.getByRole('button', { name: 'اعمال HTML' }))
      expect(onChange).toHaveBeenCalledOnce()
      // visual editor is back
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    it('cancels source mode without calling onChange on "انصراف" click', async () => {
      const { user, onChange } = setup()
      await user.click(screen.getByRole('button', { name: '</> HTML' }))
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      expect(onChange).not.toHaveBeenCalled()
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    it('cancels source mode on Escape keydown in textarea', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: '</> HTML' }))
      const textarea = screen.getByRole('textbox', { name: 'HTML source' })
      await user.type(textarea, '{Escape}')
      expect(screen.getByTestId('editor-content')).toBeInTheDocument()
    })

    it('applies source mode on Ctrl+Enter in textarea', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ProductDescriptionEditor value="" onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: '</> HTML' }))
      const textarea = screen.getByRole('textbox', { name: 'HTML source' })
      await user.type(textarea, '{Control>}{Enter}{/Control}')
      expect(onChange).toHaveBeenCalledOnce()
    })

    it('sanitizes HTML before calling onChange when applying source', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<ProductDescriptionEditor value="" onChange={onChange} />)
      await user.click(screen.getByRole('button', { name: '</> HTML' }))
      const textarea = screen.getByRole('textbox', { name: 'HTML source' })
      // XSS payload in source
      await user.clear(textarea)
      await user.type(textarea, '<p>safe</p><script>alert(1)</script>')
      await user.click(screen.getByRole('button', { name: 'اعمال HTML' }))
      const calledWith = onChange.mock.calls[0][0] as string
      expect(calledWith).not.toContain('<script>')
      expect(calledWith).not.toContain('alert')
    })
  })

  // ─── link dialog ──────────────────────────────────────────────────────────

  describe('link dialog', () => {
    it('opens link dialog when link button clicked', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'لینک' }))
      expect(screen.getByRole('dialog', { name: 'افزودن لینک' })).toBeInTheDocument()
    })

    it('closes link dialog on "انصراف" click', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'لینک' }))
      await user.click(screen.getByRole('button', { name: 'انصراف' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('closes link dialog on Escape key', async () => {
      const { user } = setup()
      await user.click(screen.getByRole('button', { name: 'لینک' }))
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('calls setLink with entered URL on "اعمال" click', async () => {
      const mockEditor = createMockEditor()
      const chain = createMockChain()
      ;(mockEditor.chain as Mock).mockReturnValue(chain)
      mockUseEditor.mockReturnValue(mockEditor)
      const user = userEvent.setup()
      render(<ProductDescriptionEditor value="" onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: 'لینک' }))
      const urlInput = screen.getByPlaceholderText('https://')
      await user.clear(urlInput)
      await user.type(urlInput, 'https://example.com')
      await user.click(screen.getByRole('button', { name: 'اعمال' }))
      expect(chain.setLink).toHaveBeenCalledWith({ href: 'https://example.com' })
    })

    it('calls unsetLink when URL is cleared', async () => {
      const mockEditor = createMockEditor()
      const chain = createMockChain()
      ;(mockEditor.chain as Mock).mockReturnValue(chain)
      mockUseEditor.mockReturnValue(mockEditor)
      const user = userEvent.setup()
      render(<ProductDescriptionEditor value="" onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: 'لینک' }))
      // default value is 'https://' which triggers unsetLink
      await user.click(screen.getByRole('button', { name: 'اعمال' }))
      expect(chain.unsetLink).toHaveBeenCalled()
      expect(chain.setLink).not.toHaveBeenCalled()
    })

    it('pre-fills URL input with existing link href', async () => {
      const mockEditor = createMockEditor({
        getAttributes: vi.fn(() => ({ href: 'https://existing.com' })),
      })
      mockUseEditor.mockReturnValue(mockEditor)
      const user = userEvent.setup()
      render(<ProductDescriptionEditor value="" onChange={vi.fn()} />)
      await user.click(screen.getByRole('button', { name: 'لینک' }))
      expect(screen.getByDisplayValue('https://existing.com')).toBeInTheDocument()
    })
  })

  // ─── character counter ────────────────────────────────────────────────────

    describe('character counter', () => {
    it('does not render counter when maxLength is not provided', () => {
        mockUseEditor.mockReturnValue(createMockEditor({ getText: vi.fn(() => 'hello') }))
        setup()
        expect(screen.queryByTestId('char-counter')).not.toBeInTheDocument()
    })

    it('renders counter with current/max chars when maxLength provided', () => {
        mockUseEditor.mockReturnValue(createMockEditor({ getText: vi.fn(() => 'hello') }))
        setup({ maxLength: 100 })
        expect(screen.getByTestId('char-counter')).toBeInTheDocument()
    })

    it('applies over-limit style when char count exceeds maxLength', () => {
        // getText returns 'hello' = 5 chars, maxLength = 3
        mockUseEditor.mockReturnValue(createMockEditor({ getText: vi.fn(() => 'hello') }))
        setup({ maxLength: 3 })
        expect(screen.getByTestId('char-counter')).toHaveClass('text-rose-400')
    })
    })

  // ─── security ────────────────────────────────────────────────────────────

  describe('security', () => {
    it('does not allow javascript: protocol links to reach onChange', async () => {
      // Simulate onUpdate callback with a link containing javascript: href
      // useEditor captures the onUpdate handler — we call it manually
      let capturedOnUpdate: ((args: { editor: { getHTML: () => string } }) => void) | undefined
      mockUseEditor.mockImplementation((config: { onUpdate?: typeof capturedOnUpdate }) => {
        capturedOnUpdate = config?.onUpdate
        return createMockEditor()
      })
      const onChange = vi.fn()
      render(<ProductDescriptionEditor value="" onChange={onChange} />)
      // Simulate TipTap firing onUpdate with XSS content
      capturedOnUpdate?.({
        editor: { getHTML: () => '<a href="javascript:alert(1)">click</a>' },
      })
      if (onChange.mock.calls.length > 0) {
        const result = onChange.mock.calls[0][0] as string
        expect(result).not.toContain('javascript:')
      }
    })
  })
})