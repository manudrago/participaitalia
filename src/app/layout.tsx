import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Partecipa Italia – La voce dei cittadini',
  description: 'Piattaforma italiana di partecipazione civica: proponi idee, vota e discuti le politiche che contano.',
  openGraph: {
    title: 'Partecipa Italia',
    description: 'La piattaforma per la partecipazione civica italiana',
    locale: 'it_IT',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
