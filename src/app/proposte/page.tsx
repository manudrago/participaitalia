import { Suspense } from 'react'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import ProposalCard from '@/components/ProposalCard'
import SortBar from '@/components/SortBar'
import { Proposal, SortOption } from '@/types'
import { trendingScore } from '@/lib/trending'

async function getProposals(sort: SortOption): Promise<Proposal[]> {
  const supabase = await createClient()
  let query = supabase
    .from('proposals')
    .select('*, author:profiles(id, username, full_name, avatar_url, badge)')
    .eq('status', 'active')

  if (sort === 'top') query = query.order('vote_score', { ascending: false })
  else if (sort === 'recent') query = query.order('created_at', { ascending: false })
  else query = query.order('updated_at', { ascending: false }) // trending sorted client-side

  const { data } = await query.limit(100)
  const proposals = (data ?? []) as Proposal[]

  if (sort === 'trending') {
    return proposals.sort((a, b) =>
      trendingScore(b.upvotes, b.downvotes, b.comment_count, b.created_at) -
      trendingScore(a.upvotes, a.downvotes, a.comment_count, a.created_at)
    )
  }
  return proposals
}

export default async function PropostePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const params = await searchParams
  const sort = (params.sort as SortOption) || 'trending'
  const proposals = await getProposals(sort)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposte</h1>
          <p className="text-gray-500 text-sm mt-1">{proposals.length} proposta{proposals.length !== 1 ? 'e' : ''} attiva{proposals.length !== 1 ? '' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SortBar current={sort} />
          </Suspense>
          <Link href="/proposte/crea" className="btn-primary text-sm flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Nuova</span>
          </Link>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 mb-4">Nessuna proposta trovata.</p>
          <Link href="/proposte/crea" className="btn-primary text-sm">
            Crea la prima proposta
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  )
}
