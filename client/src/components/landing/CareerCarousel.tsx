import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useCareers from '@/hooks/useCareers'
import { Career } from '@/types'

const SECTOR_COLORS: Record<string, { bg: string; badge: string; text: string }> = {
  Healthcare:    { bg: '#0E7490', badge: '#164E63', text: '#FFFFFF' },
  Technology:    { bg: '#6D28D9', badge: '#4C1D95', text: '#FFFFFF' },
  Finance:       { bg: '#0F766E', badge: '#134E4A', text: '#FFFFFF' },
  Education:     { bg: '#B45309', badge: '#78350F', text: '#FFFFFF' },
  Engineering:   { bg: '#1D4ED8', badge: '#1E3A8A', text: '#FFFFFF' },
  Agriculture:   { bg: '#15803D', badge: '#14532D', text: '#FFFFFF' },
  Law:           { bg: '#B91C1C', badge: '#7F1D1D', text: '#FFFFFF' },
  Architecture:  { bg: '#0369A1', badge: '#0C4A6E', text: '#FFFFFF' },
  'Arts & Media':{ bg: '#BE185D', badge: '#831843', text: '#FFFFFF' },
  Business:      { bg: '#4338CA', badge: '#312E81', text: '#FFFFFF' },
  Other:         { bg: '#475569', badge: '#1E293B', text: '#FFFFFF' },
}

const getSectorStyle = (sector: string) =>
  SECTOR_COLORS[sector] ?? SECTOR_COLORS['Other']

const CareerCard = ({ career }: { career: Career }) => {
  const style = getSectorStyle(career.sector)
  return (
    <div
      className="w-64 flex-shrink-0 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow"
      style={{ backgroundColor: style.bg }}
    >
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide text-white"
        style={{ backgroundColor: style.badge }}
      >
        {career.sector}
      </span>
      <h3 className="text-base font-bold text-white mt-3">{career.title}</h3>
      <p className="text-xs text-white/80 mt-1 leading-relaxed line-clamp-2">{career.description}</p>
    </div>
  )
}

const CARD_WIDTH = 272 // 256px + 16px gap

const CareerCarousel = () => {
  const { careers, loading, error } = useCareers({ limit: 8 })
  const [index, setIndex] = useState(0)

  const canGoLeft = index > 0
  const canGoRight = index < careers.length - 1

  return (
    <section className="bg-background py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-primary">Discover Careers</h2>
            <p className="text-sm text-muted mt-1">Trending industries for the next generation.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={!canGoLeft}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(careers.length - 1, i + 1))}
              disabled={!canGoRight}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-muted text-center py-8">Unable to load careers right now.</p>
        ) : (
          <div className="overflow-hidden">
            <div
              className="flex gap-4 transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${index * CARD_WIDTH}px)` }}
            >
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-64 h-44 flex-shrink-0 rounded-xl bg-border animate-pulse"
                    />
                  ))
                : careers.map((career) => (
                    <CareerCard key={career.id} career={career} />
                  ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default CareerCarousel
