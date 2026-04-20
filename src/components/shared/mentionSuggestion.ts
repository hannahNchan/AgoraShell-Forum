import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { MentionList } from './MentionList'
import { supabase } from '../../services/supabase'

export interface MentionUser {
  id: string
  username: string
  avatar_url: string | null
}

export const mentionSuggestion = {
  items: async ({ query }: { query: string }): Promise<MentionUser[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', query ? `%${query}%` : '%')
      .limit(5)
    return (data ?? []) as MentionUser[]
  },

  render: () => {
    let component: ReactRenderer
    let popup: TippyInstance[]

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) return

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'mention',
        })
      },

      onUpdate(props: any) {
        component.updateProps(props)
        if (!props.clientRect) return
        popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }
        return (component.ref as any)?.onKeyDown?.(props) ?? false
      },

      onExit() {
        popup?.[0]?.destroy()
        component.destroy()
      },
    }
  },
}
