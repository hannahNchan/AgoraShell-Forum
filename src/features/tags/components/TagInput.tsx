import { useState, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { X, Tag as TagIcon, Plus } from 'lucide-react'
import { type AppDispatch } from '../../../store'
import { createTag } from '../store/tagsSlice'
import { type Tag } from '../../../types'
import { supabase } from '../../../services/supabase'

interface TagInputProps {
  selected: Tag[]
  onChange: (tags: Tag[]) => void
  maxTags?: number
}

const TagInput = ({ selected, onChange, maxTags = 3 }: TagInputProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Tag[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const atMax = selected.length >= maxTags

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const search = async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return }
    const { data } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', `%${q}%`)
      .order('name', { ascending: true })
      .limit(8)
    const filtered = (data || []).filter(
      (t: Tag) => !selected.find((s) => s.id === t.id)
    )
    setSuggestions(filtered)
  }

  const handleInput = (value: string) => {
    setQuery(value)
    setShowDropdown(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 200)
  }

  const handleSelect = (tag: Tag) => {
    if (atMax) return
    if (!selected.find((s) => s.id === tag.id)) {
      onChange([...selected, tag])
    }
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const handleCreate = async () => {
    if (!query.trim() || atMax) return
    setCreating(true)
    try {
      const result = await dispatch(createTag(query.trim())).unwrap()
      handleSelect(result)
    } finally {
      setCreating(false)
    }
  }

  const handleRemove = (tagId: string) => {
    onChange(selected.filter((t) => t.id !== tagId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) {
        handleSelect(suggestions[0])
      } else if (query.trim()) {
        handleCreate()
      }
    }
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      onChange(selected.slice(0, -1))
    }
    if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const exactMatch = suggestions.find(
    (s) => s.name.toLowerCase() === query.toLowerCase().trim()
  )
  const showCreate = query.trim().length > 0 && !exactMatch && !atMax

  return (
    <div className="relative">
      <div
        className={`flex flex-wrap gap-1.5 items-center border rounded-lg px-2 py-2 bg-white transition-all ${showDropdown
          ? 'border-indigo-400 ring-2 ring-indigo-100'
          : 'border-slate-200'
          }`}
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            <TagIcon size={10} />
            {tag.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(tag.id) }}
              className="hover:cursor-pointer ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors"
            >
              <X size={11} />
            </button>
          </span>
        ))}

        {!atMax && (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (query) setShowDropdown(true) }}
            placeholder={selected.length === 0 ? 'Buscar o crear tags...' : 'Agregar tag...'}
            className="flex-1 min-w-[140px] text-sm outline-none text-slate-700 placeholder:text-slate-400 bg-transparent py-0.5"
          />
        )}

        {atMax && (
          <span className="text-xs text-slate-400 px-1">
            Máximo {maxTags} tags
          </span>
        )}
      </div>

      {showDropdown && (suggestions.length > 0 || showCreate) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden"
        >
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleSelect(tag)}
              className="hover:cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
            >
              <TagIcon size={12} className="text-slate-400 flex-shrink-0" />
              <span>{tag.name}</span>
            </button>
          ))}

          {showCreate && (
            <>
              {suggestions.length > 0 && (
                <div className="border-t border-slate-100" />
              )}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="hover:cursor-pointer w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors text-left font-medium disabled:opacity-50"
              >
                <Plus size={13} className="flex-shrink-0" />
                {creating ? 'Creando...' : `Crear tag "${query.trim()}"`}
              </button>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 mt-1.5">
        {selected.length}/{maxTags} tags · Presiona Enter para seleccionar
      </p>
    </div>
  )
}

export default TagInput
