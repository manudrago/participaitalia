import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Star, Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import VoteButtons from '@/components/VoteButtons'
import CommentSection from '@/components/CommentSection'
import { Proposal, Comment } from '@/types'
import { isControversial } from '@/lib/trending'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import ReportButton from '@/components/ReportButton'

async function getProposal(id: string, userId: string | null): Promise<Proposal | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proposals')
    .select('*, author:profiles(id, username, full_name, avatar_url, badge)')
    .eq('id', id)
    .neq('status', 'removed')
    .single()

  if (!data) return null
  const proposal = data as Proposal

  if (userId) {
    const { data: vote } = await supabase
      .from('votes')
      .select('value')
      .eq('proposal_id', id)
      .eq('user_id', userId)
      .single()
    proposal.user_vote = vote?.value ?? null
  }

  return proposal
}

async function getComments(proposalId: string): Promise<Comment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('comments')
    .select('*, author:profiles(id, username, full_name, avatar_url, badge)')
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true })
  return (data ?? []) as Comment[]
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [proposal, comments] = await Promise.all([
    getProposal(id, user?.id ?? null),
    getComments(id),
  ])

  if (!proposal) notFound()

  const controversial = isControversial(proposal.upvotes, proposal.downvotes)
  const timeAgo = formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true, locale: it })

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link href="/proposte" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Tutte le proposte
      </Link>

      {/* Proposal header */}
      <article className="card p-7 mb-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
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

        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
          {proposal.title}
        </h1>

        <div className="flex items-center gap-3 text-sm text-gray-400 mb-7 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
              {(proposal.author?.username ?? 'A')[0].toUpperCase()}
            </div>
            <span className="font-medium text-gray-700">{proposal.author?.username ?? 'Anonimo'}</span>
          </div>
          <span>·</span>
          <span>{timeAgo}</span>
        </div>

        {/* Problem */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Il Problema</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{proposal.problem}</p>
        </div>

        {/* Solution */}
        <div className="mb-7">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">La Soluzione Proposta</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{proposal.solution}</p>
        </div>

        {/* Pros & Cons */}
        {((proposal.pros?.length ?? 0) > 0 || (proposal.cons?.length ?? 0) > 0) && (
          <div className="grid sm:grid-cols-2 gap-4 mb-7">
            {(proposal.pros?.length ?? 0) > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-700 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  Pro
                </h3>
                <ul className="space-y-1.5">
                  {proposal.pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                      <span className="mt-0.5 text-emerald-500">•</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(proposal.cons?.length ?? 0) > 0 && (
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3">
                  <XCircle className="w-4 h-4" />
                  Contro
                </h3>
                <ul className="space-y-1.5">
                  {proposal.cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <span className="mt-0.5 text-red-400">•</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Voting */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Il tuo voto</h3>
          <VoteButtons
            proposalId={proposal.id}
            upvotes={proposal.upvotes}
            downvotes={proposal.downvotes}
            voteScore={proposal.vote_score}
            userVote={proposal.user_vote ?? null}
            userId={user?.id ?? null}
          />
        </div>

        {/* Report */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <ReportButton targetId={proposal.id} targetType="proposal" userId={user?.id ?? null} />
        </div>
      </article>

      {/* Comments */}
      <div className="card p-6">
        <CommentSection
          proposalId={proposal.id}
          comments={comments}
          userId={user?.id ?? null}
        />
      </div>
    </div>
  )
}
