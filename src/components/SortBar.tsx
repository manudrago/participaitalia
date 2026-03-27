'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { TrendingUp, Clock, ArrowUpDown } from 'lucide-react'
import { SortOption } from '@/types'

const options: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'trending', label: 'In tendenza', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'top', label: 'Più votate', icon: <ArrowUpDown className="w-4 h-4" /> },
  { value: 'recent', label: 'Recenti', icon: <Clock className="w-4 h-4" /> },
]

export default function SortBar({ current }: { current: SortOption }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setSort = (value: SortOption) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => setSort(opt.value)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
            current === opt.value
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
