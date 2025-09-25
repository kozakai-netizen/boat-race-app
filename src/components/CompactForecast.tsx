import { memo } from 'react'
import { ForecastTriple } from '@/lib/types'
import { Odds, EV, Probability } from '@/components/ui/Num'

interface CompactForecastProps {
  triples: ForecastTriple[]
  loading?: boolean
  variant?: 'desktop' | 'mobile'
}

const CompactForecast = memo(function CompactForecast({
  triples,
  loading = false,
  variant = 'desktop'
}: CompactForecastProps) {
  if (loading) {
    return (
      <div className="space-y-1">
        {[...Array(variant === 'mobile' ? 2 : 3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-1">
            <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (!triples.length) {
    return (
      <div className="text-xs text-ink-3 text-center py-2">
        予想準備中
      </div>
    )
  }

  const displayCount = variant === 'mobile' ? 2 : 3
  const topTriples = triples.slice(0, displayCount)

  return (
    <div className="space-y-1">
      {topTriples.map((triple, index) => (
        <div
          key={triple.combo}
          className={`flex items-center justify-between py-0.5 px-2 rounded text-xs ${
            triple.super
              ? 'bg-warning-soft text-warning border border-warning'
              : index === 0
                ? 'bg-brand-soft text-brand border border-brand'
                : 'bg-gray-50 text-ink-2 border border-gray-200'
          }`}
        >
          {/* 組み合わせ */}
          <div className="flex items-center space-x-1">
            <span className="font-mono font-bold">
              {triple.combo}
            </span>
            {triple.super && (
              <span className="text-xs">⭐</span>
            )}
          </div>

          {/* 数値情報 */}
          <div className="flex items-center space-x-2 text-xs">
            {variant === 'desktop' && triple.odds && (
              <Odds size="sm" className="text-inherit">
                {typeof triple.odds === 'number' ? triple.odds.toFixed(1) : triple.odds}
              </Odds>
            )}
            <EV size="sm" className="text-inherit">
              {triple.ev.toFixed(2)}
            </EV>
            {variant === 'desktop' && (
              <Probability size="sm" className="text-inherit">
                {(triple.prob * 100).toFixed(1)}%
              </Probability>
            )}
          </div>
        </div>
      ))}

      {/* 「詳細」リンク */}
      <div className="text-center pt-1">
        <span className="text-xs text-ink-4">
          他 {triples.length - displayCount}+ 組合せ
        </span>
      </div>
    </div>
  )
})

export default CompactForecast