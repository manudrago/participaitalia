import Link from 'next/link'
import { ArrowRight, TrendingUp, Star, Clock, Users, FileText, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import ProposalCard from '@/components/ProposalCard'
import { Proposal } from '@/types'
import { trendingScore } from '@/lib/trending'

async function getProposals(): Promise<Proposal[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proposals')
    .select('*, author:profiles(id, username, full_name, avatar_url, badge)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as Proposal[]
}

export default async function HomePage() {
  const proposals = await getProposals()

  const trending = [...proposals]
    .sort((a, b) => trendingScore(b.upvotes, b.downvotes, b.comment_count, b.created_at)
      - trendingScore(a.upvotes, a.downvotes, a.comment_count, a.created_at))
    .slice(0, 3)

  const topVoted = [...proposals]
    .sort((a, b) => b.vote_score - a.vote_score)
    .slice(0, 3)

  const recent = proposals.slice(0, 3)

  const stats = {
    proposals: proposals.length,
    votes: proposals.reduce((s, p) => s + p.upvotes + p.downvotes, 0),
    comments: proposals.reduce((s, p) => s + p.comment_count, 0),
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Users className="w-3.5 h-3.5" />
            Partecipazione civica italiana
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
            La tua voce conta.<br />
            <span className="text-blue-200">Proponi, vota, discuti.</span>
          </h1>
          <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
            Una piattaforma per cittadini che vogliono partecipare attivamente alla vita politica italiana in modo informato e costruttivo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/proposte/crea" className="flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-sm">
              Crea una proposta
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/proposte" className="flex items-center gap-2 bg-blue-500/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-blue-500/50 transition-colors">
              Esplora proposte
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-gray-900">
                <FileText className="w-5 h-5 text-blue-600" />
                {stats.proposals}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Proposte</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-gray-900">
                <Star className="w-5 h-5 text-blue-600" />
                {stats.votes}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Voti espressi</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-gray-900">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                {stats.comments}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Commenti</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-14">

        {/* Trending */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              In tendenza
            </h2>
            <Link href="/proposte?sort=trending" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Vedi tutte <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {trending.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {trending.map(p => <ProposalCard key={p.id} proposal={p} />)}
            </div>
          )}
        </section>

        {/* Top voted */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Più votate
            </h2>
            <Link href="/proposte?sort=top" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Vedi tutte <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {topVoted.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {topVoted.map(p => <ProposalCard key={p.id} proposal={p} />)}
            </div>
          )}
        </section>

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              Recenti
            </h2>
            <Link href="/proposte?sort=recent" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Vedi tutte <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {recent.map(p => <ProposalCard key={p.id} proposal={p} />)}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Hai un'idea per migliorare l'Italia?</h2>
          <p className="text-blue-100 mb-6 max-w-md mx-auto">
            Condividi la tua proposta con la comunità. Spiega il problema, proponi una soluzione e ascolta il feedback dei cittadini.
          </p>
          <Link href="/proposte/crea" className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors">
            Crea la tua proposta
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card p-8 text-center">
      <p className="text-gray-400 text-sm">Nessuna proposta ancora. Sii il primo!</p>
      <Link href="/proposte/crea" className="mt-3 inline-block btn-primary text-sm">
        Crea proposta
      </Link>
    </div>
  )
}
