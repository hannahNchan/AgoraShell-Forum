import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import ImageResize from 'tiptap-extension-resize-image'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Link as LinkIcon, Image as ImageIcon, Quote, Minus,
} from 'lucide-react'
import { supabase } from '../../services/supabase'

interface RichTextEditorProps {
  content?: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

const ToolbarButton = ({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded transition-colors ${active
      ? 'bg-indigo-100 text-indigo-700'
      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      }`}
  >
    {children}
  </button>
)

const uploadImage = async (file: File): Promise<string | null> => {
  const ext = file.name.split('.').pop()
  const fileName = `forum/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from('images').upload(fileName, file)
  if (error || !data) {
    console.error('Storage error:', error)
    return null
  }
  if (error || !data) return null
  const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path)
  return urlData.publicUrl
}

export const RichTextEditor = ({
  content = '',
  onChange,
  placeholder = 'Escribe algo...',
  minHeight = '160px',
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageResize.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-indigo-600 underline' } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3',
        style: `min-height: ${minHeight}`,
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) return false
            uploadImage(file).then((url) => {
              if (url) {
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src: url })
                  )
                )
              }
            })
            return true
          }
        }
        return false
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false
        const file = files[0]
        if (!file.type.startsWith('image/')) return false
        event.preventDefault()
        uploadImage(file).then((url) => {
          if (url) {
            const { schema } = view.state
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY })
            if (!coordinates) return
            const node = schema.nodes.image.create({ src: url })
            const transaction = view.state.tr.insert(coordinates.pos, node)
            view.dispatch(transaction)
          }
        })
        return true
      },
    },
  })

  if (!editor) return null

  const addImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = await uploadImage(file)
      if (url) editor.chain().focus().setImage({ src: url }).run()
    }
    input.click()
  }

  const addLink = () => {
    const url = window.prompt('URL del enlace:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white">
      <div className="flex items-center gap-0.5 p-2 border-b border-slate-100 flex-wrap bg-slate-50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Negrita"
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Cursiva"
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Código"
        >
          <Code size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Lista"
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Cita"
        >
          <Quote size={15} />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Insertar enlace">
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Subir imagen">
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Separador"
        >
          <Minus size={15} />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextEditor
