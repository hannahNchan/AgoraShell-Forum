import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { type AppDispatch } from '../../../store'
import { selectProfile } from '../../auth/store/authSelectors'
import { useRole } from '../../auth/hooks/useRole'
import { useAuth } from '../../auth/hooks/useAuth'
import { createReply, updateReply, deleteReply, toggleReaction } from '../../posts/store/postsSlice'
import { useConfirm } from '../../../hooks/useConfirm'
import { type Reply } from '../../../types'

export const useReply = (reply: Reply, topicId: string) => {
  const dispatch = useDispatch<AppDispatch>()
  const { user, isAuthenticated } = useAuth()
  const profile = useSelector(selectProfile)
  const { isModerator, isBanned } = useRole()
  const { confirm } = useConfirm()

  const canDelete = isModerator || profile?.id === reply.author_id
  const canEdit = profile?.id === reply.author_id

  const [showReplyEditor, setShowReplyEditor] = useState(false)
  const [showBottomSheet, setShowBottomSheet] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleReplyClick = () => {
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      setShowBottomSheet(true)
    } else {
      setShowReplyEditor(!showReplyEditor)
      window.dispatchEvent(new CustomEvent('reply-editor-toggle'))
    }
  }

  const handleSubmitReply = async (content: string) => {
    if (!content || content === '<p></p>') return
    setSubmitting(true)
    try {
      await dispatch(createReply({ topicId, content, parentId: reply.id })).unwrap()
      setReplyContent('')
      setShowReplyEditor(false)
      setShowBottomSheet(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReply = async () => {
    const ok = await confirm('Eliminar respuesta', '¿Seguro que quieres eliminar esta respuesta?')
    if (!ok) return
    dispatch(deleteReply({ replyId: reply.id, topicId }))
  }

  const handleSaveEdit = async () => {
    if (!editContent || editContent === '<p></p>') return
    setSavingEdit(true)
    try {
      await dispatch(updateReply({ replyId: reply.id, content: editContent })).unwrap()
      setIsEditing(false)
      setEditContent('')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleReaction = (emoji: string) => {
    if (!isAuthenticated) return
    dispatch(toggleReaction({ replyId: reply.id, emoji }))
    setShowEmojiPicker(false)
  }

  const startEditing = () => {
    setEditContent(reply.content)
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditContent('')
  }

  return {
    user,
    isAuthenticated,
    isModerator,
    isBanned,
    canDelete,
    canEdit,
    showReplyEditor,
    showBottomSheet,
    setShowBottomSheet,
    replyContent,
    setReplyContent,
    submitting,
    isEditing,
    editContent,
    setEditContent,
    savingEdit,
    showEmojiPicker,
    setShowEmojiPicker,
    handleReplyClick,
    handleSubmitReply,
    handleDeleteReply,
    handleSaveEdit,
    handleReaction,
    startEditing,
    cancelEditing,
  }
}
