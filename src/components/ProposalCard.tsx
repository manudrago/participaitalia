import Link from 'next/link'
import { ThumbsUp, ThumbsDown, MessageSquare, AlertTriangle, Star } from 'lucide-react'
import { Proposal } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { isControversial } from '@/lib/trending'

interface Props {
  proposal: Proposal
}

export default function ProposalCard({ proposal }: Props) {
  const controversial = isControversial(proposal.upvotes, proposal.downvotes)
  const timeAgo = formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: it })

  return (
    <Link href={`/proposte/${proposal.id}`} className="block group">
      <article className="card p-5 hover:shadow-md transition-shadow duration-200 group-hover:border-blue-100">
        <div className="flex items-start gap-4">
          {/* Vote column */}
          <div className="flex flex-col items-center gap-1 min-w-[52px]">
            <div className="flex flex-col items-center bg-gray-50 rounded-xl p-2.5 gap-1.5">
              <div className="flex items-center gap-1 text-emerald-600">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{proposal.upvotes}</span>
              </div>
              <div className={`text-sm font-bold ${proposal.vote_score > 0 ? 'text-emerald-600' : proposal.vote_score < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {proposal.vote_score > 0 ? '+' : ''}{proposal.vote_score}
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <ThumbsDown className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{proposal.downvotes}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <MessageSquare className="w-3 h-3" />
              <span>{proposal.comment_count}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition-colors">
                {proposal.title}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {controversial && (
                  <span className="badge bg-orange-50 text-orange-600">
                    <AlertTriangle className="w-3 h-3" />
                    Controverso
                  </span>
                )}
                {proposal.author?.badge === 'top_contributor' && (
                  <span className="badge bg-yellow-50 text-yellow-600">
                    <Star className="w-3 h-3" />
                    Top contributor
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {proposal.problem}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>
                da <span className="font-medium text-gray-600">{proposal.author?.username ?? 'Anonimo'}</span>
              </span>
              <span>·</span>
              <span>{timeAgo}</span>
              <span>·</span>
              <span>{proposal.upvotes + proposal.downvotes} voti</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
