'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { User as UserIcon, Calendar, FileText, AlertTriangle, Save, Loader2 } from 'lucide-react'
import { Profile } from '@/types'

const ROLE_LABELS: Record<string, string> = {
  user: 'Utente',
  admin: 'Amministratore',
  super_admin: 'Super Amministratore',
}

export default function ProfiloPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteZone, setShowDeleteZone] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/accedi?redirect=/profilo')
        return
      }
      setEmail(data.user.email ?? '')
      supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
        .then(({ data: p }) => {
          if (p) {
            setProfile(p as Profile)
            setFullName(p.full_name ?? '')
            setUsername(p.username ?? '')
          }
          setLoading(false)
        })
    })
  }, [])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    if (username.trim().length < 3) {
      setSaveError('Il nome utente deve avere almeno 3 caratteri.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        username: username.trim(),
      })
      .eq('id', profile.id)

    if (error) {
      setSaveError(error.message)
    } else {
      setProfile(prev => prev ? { ...prev, full_name: fullName.trim() || null, username: username.trim() } : prev)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
    setSaving(false)
  }

  async function handleDeleteAccount() {
    if (!profile) return
    if (deleteConfirm !== profile.username) {
      setDeleteError('Il nome utente inserito non corrisponde. Riprova.')
      return
    }
    setDeleting(true)
    setDeleteError('')

    const res = await fetch('/api/profile/delete', { method: 'DELETE' })
    if (res.ok) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      const data = await res.json()
      setDeleteError(data.error || "Errore durante l'eliminazione dell'account.")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const memberSince = new Date(profile.created_at).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  })

  const initials = (profile.full_name || profile.username || '?')[0].toUpperCase()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {profile.full_name || profile.username}
            </h1>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="badge bg-blue-100 text-blue-700">
                <UserIcon className="w-3 h-3" />
                {ROLE_LABELS[profile.role] || 'Utente'}
              </span>
              {profile.badge === 'top_contributor' && (
                <span className="badge bg-yellow-100 text-yellow-700">
                  Top contributor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{profile.proposal_count ?? 0}</p>
              <p className="text-xs text-gray-500">Proposte create</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 capitalize">{memberSince}</p>
              <p className="text-xs text-gray-500">Membro da</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Modifica profilo</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">L'email non può essere modificata da qui.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome utente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              minLength={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="nome_utente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mario Rossi"
            />
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              Profilo aggiornato con successo.
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-6 border-red-200">
        <button
          onClick={() => setShowDeleteZone(!showDeleteZone)}
          className="flex items-center gap-2 text-red-600 font-semibold w-full text-left"
        >
          <AlertTriangle className="w-5 h-5" />
          Zona pericolosa
          <span className="ml-auto text-xs text-red-400">{showDeleteZone ? '▲' : '▼'}</span>
        </button>

        {showDeleteZone && (
          <div className="mt-5 pt-5 border-t border-red-100">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Elimina account</h3>
            <p className="text-sm text-gray-500 mb-4">
              L'eliminazione dell'account è permanente e irreversibile. Tutte le tue proposte e commenti verranno rimossi.
            </p>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Scrivi il tuo nome utente <span className="font-bold text-gray-900">@{profile.username}</span> per confermare:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent mb-3"
              placeholder={profile.username}
            />

            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-3">
                {deleteError}
              </div>
            )}

            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirm !== profile.username}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm flex items-center gap-2"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {deleting ? 'Eliminazione...' : 'Elimina definitivamente il mio account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
