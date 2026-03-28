'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Shield, Trash2, Users, FileText, MessageSquare, Flag, Star } from 'lucide-react'
import { Profile } from '@/types'

type Tab = 'proposte' | 'commenti' | 'utenti' | 'segnalazioni'

interface AdminProposal {
  id: string
  title: string
  status: string
  vote_score: number
  upvotes: number
  downvotes: number
  comment_count: number
  created_at: string
  author?: { id: string; username: string; full_name: string | null }
}

interface AdminComment {
  id: string
  content: string
  created_at: string
  author?: { id: string; username: string; full_name: string | null }
  proposal?: { id: string; title: string }
}

interface AdminUser extends Profile {
  email: string | null
}

interface AdminReport {
  id: string
  target_id: string
  target_type: 'proposal' | 'comment'
  reason: string
  created_at: string
  user_id: string
}

const ROLE_LABELS: Record<string, string> = {
  user: 'Utente',
  admin: 'Amministratore',
  super_admin: 'Super Amministratore',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Attiva',
  flagged: 'Segnalata',
  removed: 'Rimossa',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  flagged: 'bg-yellow-100 text-yellow-700',
  removed: 'bg-red-100 text-red-700',
}

const SUPER_ADMIN_EMAIL = 'emauel.draghetti@gmail.com'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('proposte')
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)

  const [proposals, setProposals] = useState<AdminProposal[]>([])
  const [comments, setComments] = useState<AdminComment[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])

  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; label: string } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('*').eq('id', data.user.id).single().then(({ data: p }) => {
          if (p) setCurrentProfile(p as Profile)
        })
      }
    })
  }, [])

  const fetchProposals = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/proposals')
    if (res.ok) setProposals(await res.json())
    setLoading(false)
  }, [])

  const fetchComments = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/comments')
    if (res.ok) setComments(await res.json())
    setLoading(false)
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    setReports(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'proposte') fetchProposals()
    else if (tab === 'commenti') fetchComments()
    else if (tab === 'utenti') fetchUsers()
    else if (tab === 'segnalazioni') fetchReports()
  }, [tab])

  async function deleteProposal(id: string) {
    const res = await fetch(`/api/admin/proposals/${id}`, { method: 'DELETE' })
    if (res.ok) setProposals(prev => prev.filter(p => p.id !== id))
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== id))
  }

  async function deleteUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
  }

  async function updateUserRole(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as Profile['role'] } : u))
  }

  async function toggleBlock(id: string, is_blocked: boolean) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked }),
    })
    if (res.ok) setUsers(prev => prev.map(u => u.id === id ? { ...u, is_blocked } : u))
  }

  function handleConfirmDelete() {
    if (!confirmDelete) return
    if (confirmDelete.type === 'proposal') deleteProposal(confirmDelete.id)
    else if (confirmDelete.type === 'comment') deleteComment(confirmDelete.id)
    else if (confirmDelete.type === 'user') deleteUser(confirmDelete.id)
    setConfirmDelete(null)
  }

  const isSuperAdmin = currentProfile?.role === 'super_admin'

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'proposte', label: 'Proposte', icon: <FileText className="w-4 h-4" /> },
    { key: 'commenti', label: 'Commenti', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'utenti', label: 'Utenti', icon: <Users className="w-4 h-4" /> },
    { key: 'segnalazioni', label: 'Segnalazioni', icon: <Flag className="w-4 h-4" /> },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pannello Amministrazione</h1>
            <p className="text-sm text-gray-500 mt-0.5">Gestisci contenuti e utenti della piattaforma</p>
          </div>
        </div>
        {currentProfile && (
          <span className={`badge ${isSuperAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
            <Shield className="w-3 h-3" />
            {ROLE_LABELS[currentProfile.role]}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              tab === t.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Caricamento...
          </div>
        ) : (
          <>
            {/* Proposte tab */}
            {tab === 'proposte' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500">{proposals.length} proposte totali</p>
                </div>
                {proposals.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">Nessuna proposta.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="px-6 py-3 text-left">Titolo</th>
                          <th className="px-6 py-3 text-left">Autore</th>
                          <th className="px-6 py-3 text-left">Punteggio</th>
                          <th className="px-6 py-3 text-left">Stato</th>
                          <th className="px-6 py-3 text-left">Data</th>
                          <th className="px-6 py-3 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {proposals.map(p => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <a href={`/proposte/${p.id}`} className="text-gray-900 font-medium hover:text-blue-600 line-clamp-1 max-w-xs">
                                {p.title}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {p.author?.full_name || p.author?.username || '—'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-semibold ${p.vote_score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {p.vote_score > 0 ? '+' : ''}{p.vote_score}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`badge ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-700'}`}>
                                {STATUS_LABELS[p.status] || p.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(p.created_at).toLocaleDateString('it-IT')}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setConfirmDelete({ type: 'proposal', id: p.id, label: p.title })}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Elimina proposta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Commenti tab */}
            {tab === 'commenti' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500">{comments.length} commenti totali</p>
                </div>
                {comments.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">Nessun commento.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="px-6 py-3 text-left">Contenuto</th>
                          <th className="px-6 py-3 text-left">Proposta</th>
                          <th className="px-6 py-3 text-left">Autore</th>
                          <th className="px-6 py-3 text-left">Data</th>
                          <th className="px-6 py-3 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {comments.map(c => (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-gray-700 line-clamp-2 max-w-sm">{c.content}</p>
                            </td>
                            <td className="px-6 py-4">
                              {c.proposal ? (
                                <a href={`/proposte/${c.proposal.id}`} className="text-blue-600 hover:underline line-clamp-1 max-w-xs">
                                  {c.proposal.title}
                                </a>
                              ) : '—'}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {c.author?.full_name || c.author?.username || '—'}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(c.created_at).toLocaleDateString('it-IT')}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setConfirmDelete({ type: 'comment', id: c.id, label: c.content.slice(0, 40) })}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Elimina commento"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Utenti tab */}
            {tab === 'utenti' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500">{users.length} utenti registrati</p>
                </div>
                {users.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">Nessun utente.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="px-6 py-3 text-left">Utente</th>
                          <th className="px-6 py-3 text-left">Email</th>
                          <th className="px-6 py-3 text-left">Ruolo</th>
                          <th className="px-6 py-3 text-left">Bloccato</th>
                          <th className="px-6 py-3 text-left">Iscritto</th>
                          <th className="px-6 py-3 text-right">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {users.map(u => {
                          const isSuperAdminUser = u.email === SUPER_ADMIN_EMAIL || u.role === 'super_admin'
                          const isCurrentUser = u.id === currentProfile?.id
                          const canModify = !isSuperAdminUser || isSuperAdmin
                          return (
                            <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                                    {(u.full_name || u.username || '?')[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {u.full_name || u.username}
                                      {isCurrentUser && <span className="ml-1 text-xs text-gray-400">(tu)</span>}
                                    </p>
                                    <p className="text-xs text-gray-500">@{u.username}</p>
                                  </div>
                                  {u.role === 'super_admin' && (
                                    <span className="badge bg-purple-100 text-purple-700 ml-1">
                                      <Shield className="w-3 h-3" />
                                      Super Admin
                                    </span>
                                  )}
                                  {u.badge === 'top_contributor' && (
                                    <span className="badge bg-yellow-100 text-yellow-700">
                                      <Star className="w-3 h-3" />
                                      Top
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-500">{u.email || '—'}</td>
                              <td className="px-6 py-4">
                                <select
                                  value={u.role}
                                  onChange={e => updateUserRole(u.id, e.target.value)}
                                  disabled={!canModify || isCurrentUser}
                                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="user">Utente</option>
                                  <option value="admin">Amministratore</option>
                                  <option value="super_admin" disabled={!isSuperAdmin}>
                                    Super Amministratore
                                  </option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => toggleBlock(u.id, !u.is_blocked)}
                                  disabled={!canModify || isCurrentUser}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    u.is_blocked ? 'bg-red-500' : 'bg-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                      u.is_blocked ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </td>
                              <td className="px-6 py-4 text-gray-500">
                                {new Date(u.created_at).toLocaleDateString('it-IT')}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => setConfirmDelete({ type: 'user', id: u.id, label: u.full_name || u.username })}
                                  disabled={!canModify || isCurrentUser}
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Elimina utente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Segnalazioni tab */}
            {tab === 'segnalazioni' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100">
                  <p className="text-sm text-gray-500">{reports.length} segnalazioni totali</p>
                </div>
                {reports.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-sm">Nessuna segnalazione.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                        <tr>
                          <th className="px-6 py-3 text-left">Tipo</th>
                          <th className="px-6 py-3 text-left">ID Contenuto</th>
                          <th className="px-6 py-3 text-left">Motivo</th>
                          <th className="px-6 py-3 text-left">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reports.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <span className={`badge ${r.target_type === 'proposal' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                {r.target_type === 'proposal' ? 'Proposta' : 'Commento'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                              {r.target_id.slice(0, 8)}…
                            </td>
                            <td className="px-6 py-4 text-gray-700">{r.reason}</td>
                            <td className="px-6 py-4 text-gray-500">
                              {new Date(r.created_at).toLocaleDateString('it-IT')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Conferma eliminazione</h3>
            <p className="text-gray-600 text-sm mb-6">
              Sei sicuro di voler eliminare{' '}
              <span className="font-semibold text-gray-900">"{confirmDelete.label}"</span>?
              {' '}Questa azione è irreversibile.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 btn-secondary text-sm"
              >
                Annulla
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
