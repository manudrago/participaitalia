import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Pagina non trovata</h2>
      <p className="text-gray-500 text-sm mb-6">La pagina che cerchi non esiste o è stata rimossa.</p>
      <Link href="/" className="btn-primary">Torna alla home</Link>
    </div>
  )
}
