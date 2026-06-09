import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Clock, Pencil, Check, Tag as TagIcon, Lock, LockOpen, Flag, ScrollText } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useHighlightCode } from '../../../hooks/useHighlightCode'
import { useCodeCollapse } from '../../../hooks/useCodeCollapse'
import RichTextEditor from '../../../components/shared/RichTextEditor'
import TagInput from '../../tags/components/TagInput'
import Spinner from '../../../components/shared/Spinner'
import { Avatar } from './ReplyCard'
import { type Topic, type Tag } from '../../../types'
import ReportModal from '../../reports/components/ReportModal'
import UserLink from '../../../components/shared/UserLink'
import ReputationBadge from '../../reputation/components/ReputationBadge'
import TopicRulesEditor from './TopicRulesEditor'

interface TopicHeaderProps {
  topic: Topic
  isClosed: boolean
  isModerator: boolean
  isAuthenticated: boolean
  isBanned: boolean
  canEdit: boolean
  canManageRules: boolean
  canReport: boolean
  maxTags: number
  onStar: () => void
  onClose: () => void
  onSaveEdit: (title: string, content: string, tagIds: string[], rules?: string[]) => Promise<void>
}

const TopicHeader = ({
  topic, isClosed, isModerator, isAuthenticated, isBanned, canEdit, canManageRules, canReport, maxTags,
  onStar, onClose, onSaveEdit,
}: TopicHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(topic.title)
  const [editContent, setEditContent] = useState(topic.content)
  const [editTags, setEditTags] = useState<Tag[]>(topic.tags || [])
  const [editRules, setEditRules] = useState<string[]>(topic.rules?.length ? topic.rules.map((rule) => rule.body) : [''])
  const [saving, setSaving] = useState(false)
  const [isEditingRules, setIsEditingRules] = useState(false)
  const [savingRules, setSavingRules] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const topicContentRef = useRef<HTMLDivElement>(null)
  useHighlightCode(topicContentRef)
  useCodeCollapse(topicContentRef)

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent || editContent === '<p></p>') return
    setSaving(true)
    try {
      await onSaveEdit(editTitle.trim(), editContent, editTags.map((t) => t.id), canManageRules ? editRules : undefined)
      setIsEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const startRulesEdit = () => {
    setEditRules(topic.rules?.length ? topic.rules.map((rule) => rule.body) : [''])
    setIsEditingRules(true)
  }

  const handleSaveRules = async () => {
    setSavingRules(true)
    try {
      await onSaveEdit(topic.title, topic.content, (topic.tags ?? []).map((t) => t.id), editRules)
      setIsEditingRules(false)
    } finally {
      setSavingRules(false)
    }
  }

  const topicWasEdited = topic.updated_at && topic.updated_at !== topic.created_at

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border p-6 ${isClosed ? 'border-slate-300 dark:border-slate-600' : 'border-slate-200 dark:border-slate-700'}`}>
      {isClosed && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <Lock size={13} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Este tema está cerrado — no se aceptan más respuestas</span>
          {isModerator && (
            <button
              onClick={onClose}
              className="hover:cursor-pointer ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <LockOpen size={13} />
              Reabrir
            </button>
          )}
        </div>
      )}

      <div className="flex items-start gap-4">
        <Avatar profile={topic.author} />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-xl font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{topic.title}</h1>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
            <UserLink profile={topic.author} className="font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400" />
            <ReputationBadge userId={topic.author?.id} compact />
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {format(new Date(topic.created_at), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
            </span>
            {topicWasEdited && <span className="italic text-slate-300 dark:text-slate-600">editado</span>}
          </div>

          {!isEditing && topic.tags && topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {topic.tags.map((tag: Tag) => (
                <Link
                  key={tag.id}
                  to={`/tags/${tag.slug}`}
                  className="hover:cursor-pointer inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors"
                >
                  <TagIcon size={10} />
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {!isEditing && !isEditingRules && topic.rules && topic.rules.length > 0 && (
            <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <ScrollText size={15} className="text-indigo-500" />
                Reglas del tema
              </div>
              <ol className="space-y-1.5">
                {topic.rules.map((rule) => (
                  <li key={rule.id} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="shrink-0 font-semibold text-indigo-500">{rule.position}.</span>
                    <span className="min-w-0 break-words">{rule.body}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!isEditing && isEditingRules && (
            <div className="mt-4 space-y-3">
              <TopicRulesEditor rules={editRules} onChange={setEditRules} />
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => setIsEditingRules(false)}
                  className="rounded-lg px-4 py-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRules}
                  disabled={savingRules}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingRules ? <Spinner size="sm" /> : <Check size={14} />}
                  Guardar reglas
                </button>
              </div>
            </div>
          )}





          <div className="hidden md:block">{isEditing ? (
            <div className="mt-4 space-y-3">
              <RichTextEditor
                key="edit-topic"
                onChange={setEditContent}
                content={topic.content}
                placeholder="Edita el contenido del tema..."
                minHeight="200px"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                <TagInput selected={editTags} onChange={setEditTags} maxTags={maxTags} />
              </div>
              {canManageRules && (
                <TopicRulesEditor rules={editRules} onChange={setEditRules} />
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="hover:cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !editTitle.trim() || !editContent || editContent === '<p></p>'}
                  className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Spinner size="sm" /> : <Check size={14} />}
                  Guardar cambios
                </button>
              </div>
            </div>
          ) : (
            <div ref={topicContentRef} className="prose prose-sm max-w-none mt-5 text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: topic.content }} />
          )}
          </div>






        </div>
      </div>

      <div className="block md:hidden mb-2">{isEditing ? (
        <div className="mt-4 space-y-3">
          <RichTextEditor
            key="edit-topic"
            onChange={setEditContent}
            content={topic.content}
            placeholder="Edita el contenido del tema..."
            minHeight="200px"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
            <TagInput selected={editTags} onChange={setEditTags} maxTags={maxTags} />
          </div>
          {canManageRules && (
            <TopicRulesEditor rules={editRules} onChange={setEditRules} />
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="hover:cursor-pointer text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editTitle.trim() || !editContent || editContent === '<p></p>'}
              className="hover:cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Spinner size="sm" /> : <Check size={14} />}
              Guardar cambios
            </button>
          </div>
        </div>
      ) : (
        <div ref={topicContentRef} className="prose prose-sm max-w-none mt-5 text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: topic.content }} />
      )}
      </div>
      <div className="flex items-center gap-2 shrink-0 md:mt-4">
        {isModerator && isAuthenticated && !isEditing && (
          <button
            onClick={onClose}
            title={isClosed ? 'Reabrir tema' : 'Cerrar tema'}
            className={`hover:cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${isClosed
              ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-300 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
          >
            {isClosed ? <LockOpen size={14} /> : <Lock size={14} />}
            <span className="hidden sm:inline">{isClosed ? 'Reabrir' : 'Cerrar'}</span>
          </button>
        )}
        {canManageRules && isAuthenticated && !isBanned && !isEditing && !isEditingRules && (
          <button
            onClick={startRulesEdit}
            className="hover:cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors"
          >
            <ScrollText size={14} />
            <span className="hidden sm:inline">{topic.rules?.length ? 'Editar reglas' : 'Añadir reglas'}</span>
          </button>
        )}
        {canEdit && isAuthenticated && !isBanned && !isEditing && !isEditingRules && (
          <button
            onClick={() => setIsEditing(true)}
            className="hover:cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-indigo-300 hover:text-indigo-500 dark:hover:border-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors"
          >
            <Pencil size={14} />
            <span className="hidden sm:inline">Editar</span>
          </button>
        )}
        {isAuthenticated && canReport && !isEditing && (
          <button
            onClick={() => setReportOpen(true)}
            title="Reportar"
            className="hover:cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-red-300 hover:text-red-500 dark:hover:border-red-700 dark:hover:text-red-400 text-sm transition-colors"
          >
            <Flag size={14} />
            <span className="hidden sm:inline">Reportar</span>
          </button>
        )}
        <button
          onClick={onStar}
          disabled={!isAuthenticated}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${topic.is_starred
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
            : 'border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-amber-300 hover:text-amber-500'
            } disabled:cursor-not-allowed`}
        >
          <Star size={15} fill={topic.is_starred ? 'currentColor' : 'none'} />
          <span className="font-medium">{topic.stars_count}</span>
        </button>
      </div>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Reportar tema"
        author={topic.author}
        options={[
          {
            type: 'topic',
            label: 'Tema',
            targetTopicId: topic.id,
            reportedUserId: topic.author_id,
          },
          {
            type: 'user',
            label: 'Autor',
            targetUserId: topic.author_id,
            reportedUserId: topic.author_id,
          },
        ]}
      />
    </div>
  )
}

export default TopicHeader
