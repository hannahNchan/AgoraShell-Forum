import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { type MentionUser } from './mentionSuggestion'

interface MentionListProps {
  items: MentionUser[]
  command: (item: { id: string; label: string }) => void
}

export const MentionList = forwardRef<any, MentionListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => setSelectedIndex(0), [items])

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) command({ id: item.id, label: item.username })
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (!items.length) return null

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
      style={{ minWidth: '180px' }}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:cursor-pointer ${index === selectedIndex
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-700 hover:bg-slate-50'
            }`}
        >
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-semibold text-xs overflow-hidden">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              item.username.charAt(0).toUpperCase()
            )}
          </div>
          <span className="font-medium">{item.username}</span>
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = 'MentionList'
