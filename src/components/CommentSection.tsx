'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { MessageSquare, ChevronUp, ChevronDown, Reply, Flag } from 'lucide-react'
import { Comment } from '@/types'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  proposalId: string
  comments: Comment[]
  userId: string | null
}

function CommentItem({ comment, proposalId, userId, depth = 0 }: {
  comment: Comment
  proposalId: string
  userId: string | null
  depth?: number
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reported, setReported] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const submitReply = async () => {
    if (!userId) { router.push('/accedi'); return }
    if (!replyText.trim() || replyText.length < 3) return
    setSubmitting(true)
    await supabase.from('comments').insert({
      proposal_id: proposalId,
      user_id: userId,
      parent_id: comment.id,
      content: replyText.trim(),
    })
    setReplyText('')
    setReplyOpen(false)
    setSubmitting(false)
    router.refresh()
  }

  const handleReport = async () => {
    if (!userId) { router.push('/accedi'); return }
    await supabase.from('reports').insert({
      user_id: userId,
      target_id: comment.id,
      target_type: 'comment',
      reason: 'Segnalato dall\'utente',
    })
    setReported(true)
  }

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: it })

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
            {(comment.author?.username ?? 'A')[0].toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-gray-800">{comment.author?.username ?? 'Anonimo'}</span>
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed mb-2 ml-9">{comment.content}</p>

        <div className="flex items-center gap-2 ml-9">
          {depth < 3 && (
            <button
              onClick={() => setReplyOpen(!replyOpen)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              Rispondi
            </button>
          )}
          {!reported ? (
            <button
              onClick={handleReport}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-500 transition-colors ml-2"
            >
              <Flag className="w-3.5 h-3.5" />
              Segnala
            </button>
          ) : (
            <span className="text-xs text-orange-500 ml-2">Segnalato</span>
          )}
        </div>

        {replyOpen && (
          <div className="ml-9 mt-3">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Scrivi una risposta..."
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={submitReply}
                disabled={submitting || replyText.length < 3}
                className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
              >
                {submitting ? 'Invio...' : 'Rispondi'}
              </button>
              <button onClick={() => setReplyOpen(false)} className="btn-secondary text-xs py-1.5 px-3">
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>

      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} proposalId={proposalId} userId={userId} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function CommentSection({ proposalId, comments, userId }: Props) {
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sort, setSort] = useState<'recent' | 'top'>('recent')
  const router = useRouter()
  const supabase = createClient()

  const submitComment = async () => {
    if (!userId) { router.push('/accedi'); return }
    if (!newComment.trim() || newComment.length < 3) return
    setSubmitting(true)
    await supabase.from('comments').insert({
      proposal_id: proposalId,
      user_id: userId,
      content: newComment.trim(),
    })
    setNewComment('')
    setSubmitting(false)
    router.refresh()
  }

  const topLevel = comments.filter(c => !c.parent_id)
  const sorted = [...topLevel].sort((a, b) => {
    if (sort === 'top') return b.vote_score - a.vote_score
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const nested = sorted.map(c => ({
    ...c,
    replies: comments.filter(r => r.parent_id === c.id),
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          Commenti ({comments.length})
        </h3>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setSort('recent')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${sort === 'recent' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Recenti
          </button>
          <button
            onClick={() => setSort('top')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${sort === 'top' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Top
          </button>
        </div>
      </div>

      {/* New comment */}
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder={userId ? 'Condividi il tuo punto di vista...' : 'Accedi per commentare'}
          rows={3}
          disabled={!userId}
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{newComment.length}/2000</span>
          <button
            onClick={submitComment}
            disabled={!userId || submitting || newComment.length < 3}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {submitting ? 'Invio...' : 'Commenta'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="divide-y divide-gray-50">
        {nested.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Nessun commento ancora. Sii il primo a condividere la tua opinione!
          </p>
        ) : (
          nested.map(comment => (
            <CommentItem key={comment.id} comment={comment} proposalId={proposalId} userId={userId} />
          ))
        )}
      </div>
    </div>
  )
}
