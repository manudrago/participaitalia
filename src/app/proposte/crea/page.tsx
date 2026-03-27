'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2, Info, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const MIN_PROBLEM_LENGTH = 100
const MIN_SOLUTION_LENGTH = 100

export default function CreaPropostaPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [pros, setPros] = useState([''])
  const [cons, setCons] = useState([''])

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/accedi?redirect=/proposte/crea')
      else setUser(data.user)
    })
  }, [])

  const addPro = () => setPros(p => [...p, ''])
  const removePro = (i: number) => setPros(p => p.filter((_, idx) => idx !== i))
  const updatePro = (i: number, v: string) => setPros(p => p.map((x, idx) => idx === i ? v : x))

  const addCon = () => setCons(c => [...c, ''])
  const removeCon = (i: number) => setCons(c => c.filter((_, idx) => idx !== i))
  const updateCon = (i: number, v: string) => setCons(c => c.map((x, idx) => idx === i ? v : x))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim() || title.length < 10) errs.title = 'Il titolo deve essere di almeno 10 caratteri'
    if (title.length > 200) errs.title = 'Il titolo non può superare 200 caratteri'
    if (!problem.trim() || problem.length < MIN_PROBLEM_LENGTH)
      errs.problem = `Descrivi il problema in almeno ${MIN_PROBLEM_LENGTH} caratteri (${problem.length}/${MIN_PROBLEM_LENGTH})`
    if (!solution.trim() || solution.length < MIN_SOLUTION_LENGTH)
      errs.solution = `Descrivi la soluzione in almeno ${MIN_SOLUTION_LENGTH} caratteri (${solution.length}/${MIN_SOLUTION_LENGTH})`
    if (pros.some(p => p.trim().length > 0) && pros.filter(p => p.trim()).length === 0)
      errs.pros = 'Aggiungi almeno un pro valido'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    const { data, error } = await supabase.from('proposals').insert({
      user_id: user.id,
      title: title.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      pros: pros.filter(p => p.trim()),
      cons: cons.filter(c => c.trim()),
    }).select().single()

    setLoading(false)
    if (!error && data) {
      setSubmitted(true)
      setTimeout(() => router.push(`/proposte/${data.id}`), 1500)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Proposta pubblicata!</h2>
        <p className="text-gray-500">Stai per essere reindirizzato...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Verifica dell'autenticazione in corso...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Crea una proposta</h1>
      <p className="text-gray-500 text-sm mb-8">
        Condividi la tua idea in modo strutturato. Una buona proposta descrive chiaramente il problema e offre una soluzione concreta.
      </p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex gap-3">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Sii specifico e costruttivo. Evita toni aggressivi. Le proposte vengono valutate dalla comunità in base a chiarezza e utilità pubblica.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Titolo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Es. Potenziamento del trasporto pubblico nelle città medie"
            maxLength={200}
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-200'}`}
          />
          <div className="flex justify-between mt-1.5">
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
            <span className="text-xs text-gray-400 ml-auto">{title.length}/200</span>
          </div>
        </div>

        {/* Problem */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Descrizione del problema <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">Spiega cosa non funziona oggi e perché è un problema rilevante per i cittadini.</p>
          <textarea
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="Descrivi il problema in modo dettagliato..."
            rows={5}
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.problem ? 'border-red-300' : 'border-gray-200'}`}
          />
          <div className="flex justify-between mt-1.5">
            {errors.problem && <p className="text-xs text-red-500">{errors.problem}</p>}
            <span className={`text-xs ml-auto ${problem.length < MIN_PROBLEM_LENGTH ? 'text-amber-500' : 'text-gray-400'}`}>
              {problem.length}/{MIN_PROBLEM_LENGTH} min
            </span>
          </div>
        </div>

        {/* Solution */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Soluzione proposta <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">Proponi una soluzione concreta e realizzabile. Chi dovrebbe attuarla? Come?</p>
          <textarea
            value={solution}
            onChange={e => setSolution(e.target.value)}
            placeholder="Descrivi la tua proposta di soluzione..."
            rows={5}
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.solution ? 'border-red-300' : 'border-gray-200'}`}
          />
          <div className="flex justify-between mt-1.5">
            {errors.solution && <p className="text-xs text-red-500">{errors.solution}</p>}
            <span className={`text-xs ml-auto ${solution.length < MIN_SOLUTION_LENGTH ? 'text-amber-500' : 'text-gray-400'}`}>
              {solution.length}/{MIN_SOLUTION_LENGTH} min
            </span>
          </div>
        </div>

        {/* Pros */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pro <span className="text-gray-400 font-normal text-xs">(vantaggi della proposta)</span>
          </label>
          <div className="space-y-2">
            {pros.map((pro, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={pro}
                  onChange={e => updatePro(i, e.target.value)}
                  placeholder={`Vantaggio ${i + 1}`}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                {pros.length > 1 && (
                  <button type="button" onClick={() => removePro(i)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addPro} className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
            <PlusCircle className="w-4 h-4" />
            Aggiungi pro
          </button>
        </div>

        {/* Cons */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Contro <span className="text-gray-400 font-normal text-xs">(svantaggi o criticità)</span>
          </label>
          <div className="space-y-2">
            {cons.map((con, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={con}
                  onChange={e => updateCon(i, e.target.value)}
                  placeholder={`Svantaggio ${i + 1}`}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                {cons.length > 1 && (
                  <button type="button" onClick={() => removeCon(i)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addCon} className="mt-2 text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
            <PlusCircle className="w-4 h-4" />
            Aggiungi contro
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 sm:flex-none disabled:opacity-60"
          >
            {loading ? 'Pubblicazione...' : 'Pubblica proposta'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Annulla
          </button>
        </div>
      </form>
    </div>
  )
}
