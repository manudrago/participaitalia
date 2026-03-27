import Link from 'next/link'
import { Vote } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Vote className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Partecipa<span className="text-blue-600">Italia</span></span>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Una piattaforma per la partecipazione civica informata e costruttiva.
          </p>
          <nav className="flex items-center gap-4 text-sm text-gray-500">
            <Link href="/proposte" className="hover:text-gray-900 transition-colors">Proposte</Link>
            <Link href="/proposte/crea" className="hover:text-gray-900 transition-colors">Proponi</Link>
            <Link href="/accedi" className="hover:text-gray-900 transition-colors">Accedi</Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} ParticipaItalia. Tutti i diritti riservati.
        </div>
      </div>
    </footer>
  )
}
