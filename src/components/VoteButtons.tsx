'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  proposalId: string
  upvotes: number
  downvotes: number
  voteScore: number
  userVote: number | null
  userId: string | null
}

export default function VoteButtons({ proposalId, upvotes, downvotes, voteScore, userVote: initialUserVote, userId }: Props) {
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const [ups, setUps] = useState(upvotes)
  const [downs, setDowns] = useState(downvotes)
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [pendingVote, setPendingVote] = useState<1 | -1 | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const currentScore = ups - downs

  const handleVoteClick = (value: 1 | -1) => {
    if (!userId) {
      router.push('/accedi')
      return
    }
    // Show warning before first vote
    if (userVote === null) {
      setPendingVote(value)
      setShowWarning(true)
      return
    }
    submitVote(value)
  }

  const confirmVote = () => {
    if (pendingVote) {
      setShowWarning(false)
      submitVote(pendingVote)
      setPendingVote(null)
    }
  }

  const submitVote = async (value: 1 | -1) => {
    if (loading) return
    setLoading(true)

    const prevVote = userVote
    // Optimistic update
    if (prevVote === value) {
      // Remove vote
      setUserVote(null)
      if (value === 1) setUps(u => u - 1)
      else setDowns(d => d - 1)
    } else {
      if (prevVote === 1) setUps(u => u - 1)
      if (prevVote === -1) setDowns(d => d - 1)
      if (value === 1) setUps(u => u + 1)
      else setDowns(d => d + 1)
      setUserVote(value)
    }

    try {
      if (prevVote === value) {
        await supabase.from('votes').delete().eq('proposal_id', proposalId).eq('user_id', userId)
      } else if (prevVote === null) {
        await supabase.from('votes').insert({ proposal_id: proposalId, user_id: userId, value })
      } else {
        await supabase.from('votes').update({ value }).eq('proposal_id', proposalId).eq('user_id', userId)
      }
      router.refresh()
    } catch {
      // Revert on error
      setUserVote(prevVote)
      setUps(upvotes)
      setDowns(downvotes)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {showWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-3">
            Leggi attentamente la proposta prima di votare.
          </p>
          <p className="text-xs text-amber-700 mb-4">
            Il tuo voto contribuisce alla valutazione di questa proposta da parte della comunità. Assicurati di aver compreso il problema e la soluzione proposta.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmVote}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Ho letto, voto {pendingVote === 1 ? '▲ Sì' : '▼ No'}
            </button>
            <button
              onClick={() => { setShowWarning(false); setPendingVote(null) }}
              className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Continua a leggere
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => handleVoteClick(1)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            userVote === 1
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          } disabled:opacity-50`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{ups}</span>
        </button>

        <div className={`text-xl font-bold min-w-8 text-center ${currentScore > 0 ? 'text-emerald-600' : currentScore < 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {currentScore > 0 ? '+' : ''}{currentScore}
        </div>

        <button
          onClick={() => handleVoteClick(-1)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
            userVote === -1
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          } disabled:opacity-50`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>{downs}</span>
        </button>

        <span className="text-xs text-gray-400 ml-1">{ups + downs} voti totali</span>
      </div>
    </div>
  )
}
