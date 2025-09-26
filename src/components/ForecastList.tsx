'use client'

import { useState, useMemo, useEffect } from 'react'
import { ForecastTriple } from '@/lib/types'
import SortControls from './SortControls'
import { Odds, EV, Probability } from '@/components/ui/Num'

interface ForecastListProps {
  triples: ForecastTriple[]
  loading?: boolean
  raceResult?: {
    triple: string
    payout: number | null
    popularity: number | null
  }
  urlSyncProps?: {
    getStateFromUrl: () => {
      fixedFirst?: number | null
      sortBy?: 'ev' | 'probability' | 'odds'
      sortOrder?: 'desc' | 'asc'
      showLimit?: number
    }
    updateUrl: (state: {
      fixedFirst?: number | null
      sortBy?: 'ev' | 'probability' | 'odds'
      sortOrder?: 'desc' | 'asc'
      showLimit?: number
    }) => void
  }
}

export default function ForecastList({ triples, loading, raceResult, urlSyncProps }: ForecastListProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'ev' | 'probability' | 'odds'>('ev')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [showLimit, setShowLimit] = useState(5)

  // Initialize from URL if urlSyncProps is provided
  useEffect(() => {
    if (urlSyncProps) {
      const urlState = urlSyncProps.getStateFromUrl()
      if (urlState.sortBy) setSortBy(urlState.sortBy)
      if (urlState.sortOrder) setSortOrder(urlState.sortOrder)
      if (urlState.showLimit) setShowLimit(urlState.showLimit)
    }
  }, [urlSyncProps])

  const isWinningCombo = (combo: string) => {
    return raceResult && raceResult.triple === combo
  }

  const sortedTriples = useMemo(() => {
    const sorted = [...triples].sort((a, b) => {
      let aValue: number
      let bValue: number

      switch (sortBy) {
        case 'probability':
          aValue = a.prob
          bValue = b.prob
          break
        case 'odds':
          aValue = typeof a.odds === 'string' ? parseFloat(a.odds) || 0 : (a.odds || 0)
          bValue = typeof b.odds === 'string' ? parseFloat(b.odds) || 0 : (b.odds || 0)
          break
        case 'ev':
        default:
          aValue = a.ev
          bValue = b.ev
          break
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue
    })

    return sorted
  }, [triples, sortBy, sortOrder])

  const displayTriples = showLimit === 999 ? sortedTriples : sortedTriples.slice(0, showLimit)

  const handleSortChange = (newSortBy: 'ev' | 'probability' | 'odds', newSortOrder: 'desc' | 'asc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    if (urlSyncProps) {
      urlSyncProps.updateUrl({
        sortBy: newSortBy,
        sortOrder: newSortOrder,
      })
    }
  }

  const handleShowLimitChange = (limit: number) => {
    setShowLimit(limit)
    if (urlSyncProps) {
      urlSyncProps.updateUrl({
        showLimit: limit,
      })
    }
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.08) return 'text-red-600 bg-red-50'
    if (prob >= 0.05) return 'text-orange-600 bg-orange-50'
    if (prob >= 0.03) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getEvColor = (ev: number) => {
    if (ev >= 2.0) return 'text-green-700 bg-green-100'
    if (ev >= 1.5) return 'text-green-600 bg-green-50'
    if (ev >= 1.25) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }


  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-4 bg-gray-100 rounded-lg h-16"></div>
        ))}
      </div>
    )
  }

  if (triples.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>予想データがありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!loading && triples.length > 0 && (
        <SortControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          showLimit={showLimit}
          onShowLimitChange={handleShowLimitChange}
        />
      )}

      {displayTriples.map((triple, idx) => (
        <div
          key={`${triple.combo}-${idx}`}
          className={`p-4 rounded-lg border-2 transition-all ${
            isWinningCombo(triple.combo)
              ? 'border-green-500 bg-green-50'
              : triple.super
              ? 'border-yellow-300 bg-yellow-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* 左側：組み合わせとバッジ */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-mono font-bold text-gray-800">
                  {triple.combo}
                </div>

                {/* Hit type removed in simplified system */}

                {/* Hit type removed in simplified system */}

                {/* Hit type removed in simplified system */}

                {triple.super && (
                  <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">
                    ⭐ SUPER
                  </div>
                )}
              </div>

              {/* アイコン群 */}
              <div className="flex items-center space-x-1">
                {triple.icons && triple.icons.map((icon, iconIdx) => (
                  <span key={iconIdx} className="text-lg">{icon}</span>
                ))}
              </div>
            </div>

            {/* 右側：数値とツールチップ */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium ${getProbabilityColor(triple.prob)}`}>
                    <Probability>{(triple.prob * 100).toFixed(1)}%</Probability>
                  </span>
                  <span className={`text-sm px-2 py-1 rounded font-semibold ${getEvColor(triple.ev)}`}>
                    EV <EV>{triple.ev.toFixed(2)}</EV>
                  </span>
                </div>

                {triple.odds && (
                  <div className="text-xs text-gray-500 mt-1">
                    オッズ <Odds className="text-gray-500">
                      {typeof triple.odds === 'number' ? triple.odds.toFixed(1) : triple.odds}
                    </Odds>倍
                  </div>
                )}
              </div>

              {/* Tooltip disabled in simplified system */}
              {false && triple.why && (
                <div className="relative">
                  <button
                    onMouseEnter={() => setShowTooltip(triple.combo)}
                    onMouseLeave={() => setShowTooltip(null)}
                    className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center hover:bg-blue-200 transition"
                  >
                    ?
                  </button>

                  {showTooltip === triple.combo && (
                    <div className="absolute right-0 top-8 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                      <div className="font-semibold mb-1">予想根拠</div>
                      <div>
                        {(triple.why as unknown as { summary?: string })?.summary || '詳細な分析結果'}
                      </div>
                      {(triple.why as unknown as { factors?: string[] })?.factors && (triple.why as unknown as { factors: string[] }).factors.length > 0 && (
                        <div className="mt-2">
                          <div className="text-gray-300 text-xs mb-1">根拠要素:</div>
                          <div className="flex flex-wrap gap-1">
                            {(triple.why as unknown as { factors: string[] }).factors.map((factor: string, idx: number) => (
                              <span key={idx} className="bg-gray-700 px-1 py-0.5 rounded text-xs">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Hit result details removed in simplified system */}
          {false && raceResult && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center justify-between text-sm">
                <div className="text-green-700 font-medium">
                  実際の結果: {raceResult?.triple}
                </div>
                <div className="flex items-center space-x-4 text-gray-600">
                  {raceResult?.payout && (
                    <span>払戻: {raceResult?.payout?.toLocaleString()}円</span>
                  )}
                  {raceResult?.popularity && (
                    <span>{raceResult?.popularity}番人気</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* 表示件数情報 */}
      {triples.length > displayTriples.length && (
        <div className="text-center pt-2 text-sm text-gray-500">
          {displayTriples.length} / {triples.length} 件表示中
        </div>
      )}
    </div>
  )
}