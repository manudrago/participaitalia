'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props {
  targetId: string
  targetType: 'proposal' | 'comment'
  userId: string | null
}

export default function ReportButton({ targetId, targetType, userId }: Props) {
  const [reported, setReported] = useState(false)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()
  const supabase = createClient()

  if (reported) {
    return <span className="text-xs text-orange-500 flex items-center gap-1"><Flag className="w-3 h-3" /> Segnalato</span>
  }

  const submit = async () => {
    if (!userId) { router.push('/accedi'); return }
    await supabase.from('reports').insert({
      user_id: userId,
      target_id: targetId,
      target_type: targetType,
      reason: reason || 'Contenuto inappropriato',
    })
    setReported(true)
    setOpen(false)
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => userId ? setOpen(true) : router.push('/accedi')}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" />
          Segnala contenuto
        </button>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm font-medium text-orange-800 mb-3">Segnala questa proposta</p>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full text-sm border border-orange-200 rounded-lg px-3 py-2 mb-3 bg-white"
          >
            <option value="">Seleziona motivo</option>
            <option value="Contenuto inappropriato">Contenuto inappropriato</option>
            <option value="Spam o pubblicità">Spam o pubblicità</option>
            <option value="Disinformazione">Disinformazione</option>
            <option value="Incitamento all'odio">Incitamento all'odio</option>
            <option value="Altro">Altro</option>
          </select>
          <div className="flex gap-2">
            <button onClick={submit} className="btn-primary text-xs py-1.5 px-3 bg-orange-500 hover:bg-orange-600">
              Invia segnalazione
            </button>
            <button onClick={() => setOpen(false)} className="btn-secondary text-xs py-1.5 px-3">
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
