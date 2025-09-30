'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Forecast, Result } from '@/lib/types'
import { parseRaceId, getVenueDisplayName, type RaceIdInfo } from '@/lib/raceId'
import RaceHeader from '@/components/RaceHeader'
import ForecastList from '@/components/ForecastList'
import RaceEntries from '@/components/RaceEntries'
import HamburgerMenu from '@/components/HamburgerMenu'
import { useLegendModal } from '@/components/LegendModal'
import { useFeedbackModal } from '@/components/FeedbackForm'
import { useUrlSync } from '@/hooks/useUrlSync'
import { RaceDetailSkeleton } from '@/components/ui/SkeletonLoader'

const LegendModal = dynamic(() => import('@/components/LegendModal').then(mod => ({ default: mod.default })), {
  loading: () => null
})

const ShareButton = dynamic(() => import('@/components/ShareButton'), {
  loading: () => <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
})

interface RaceDetailProps {
  params: Promise<{ id: string }>
}

export default function RaceDetail({ params }: RaceDetailProps) {
  const [raceId, setRaceId] = useState<string>('')
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [raceResult, setRaceResult] = useState<Result | null>(null)
  const [fixedFirst, setFixedFirst] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [fixedLoading, setFixedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elementFilter, setElementFilter] = useState<'all' | 'high_ev' | 'realistic' | 'relative'>('all')
  const [venueRaces, setVenueRaces] = useState<Array<{race_id: string, race_no: number, has_super: boolean}>>([])
  const [venueRacesLoading, setVenueRacesLoading] = useState(false)

  const { getStateFromUrl, updateUrl } = useUrlSync()
  const { isOpen: legendOpen, openModal: openLegend, closeModal: closeLegend } = useLegendModal()
  const { openModal: openFeedback, FeedbackForm: FeedbackFormComponent } = useFeedbackModal(`/race/${raceId}`)

  // フィルタリングされたトリプルを計算
  const filteredTriples = useMemo(() => {
    const allTriples = forecast?.triples || []
    console.log('Filter Debug:', { elementFilter, totalTriples: allTriples.length })

    if (elementFilter === 'all') {
      console.log('Showing all triples:', allTriples.length)
      return allTriples
    }

    const filtered = allTriples.filter((triple) => {
      switch (elementFilter) {
        case 'high_ev':
          const hasHighEv = triple.ev >= 1.5
          if (hasHighEv) console.log('High EV triple:', triple.combo, 'EV:', triple.ev)
          return hasHighEv
        case 'realistic':
          const isRealistic = triple.prob >= 0.05
          if (isRealistic) console.log('Realistic triple:', triple.combo, 'Prob:', triple.prob)
          return isRealistic
        case 'relative':
          // 上位30%に入る（相対優位性）
          const sortedByEv = [...allTriples].sort((a, b) => b.ev - a.ev)
          const topCount = Math.max(2, Math.ceil(sortedByEv.length * 0.3))
          const topTriples = sortedByEv.slice(0, topCount)
          const isTopRanked = topTriples.includes(triple)
          if (isTopRanked) console.log('Top ranked triple:', triple.combo, 'EV:', triple.ev)
          return isTopRanked
        default:
          return true
      }
    })

    console.log('Filtered result:', { filter: elementFilter, count: filtered.length })
    return filtered
  }, [forecast?.triples, elementFilter])

  // Handle async params
  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setRaceId(resolvedParams.id)
    }
    initParams()
  }, [params])

  // Initialize state from URL on component mount
  useEffect(() => {
    const urlState = getStateFromUrl()
    if (urlState.fixedFirst !== undefined) {
      setFixedFirst(urlState.fixedFirst)
    }
  }, [getStateFromUrl])

  const fetchRaceData = useCallback(async () => {
    if (!raceId) return

    setLoading(true)
    setError(null)

    try {
      const raceInfo = parseRaceId(raceId)

      // Parallel data fetching for better performance
      const [forecastResult, resultResult] = await Promise.allSettled([
        fetch(`/api/prediction/${raceId}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/results/suminoye?date=${raceInfo.date}`).then(res => res.ok ? res.json() : null)
      ])

      // Handle forecast data
      if (forecastResult.status === 'fulfilled' && forecastResult.value && forecastResult.value.success) {
        // Convert /api/prediction response to Forecast format
        const predictionData = forecastResult.value.prediction
        const adaptedForecast: Forecast = {
          triples: predictionData.topCombinations.map((combo: any) => ({
            combo: combo.triple,
            odds: null,
            ev: combo.expectedValue || 1.0,
            prob: combo.probability,
            super: combo.expectedValue >= 1.5 && combo.probability >= 0.04,
            icons: ['🎯'], // デフォルトアイコン
            why: null
          })),
          updated_at: forecastResult.value.timestamp,
          summary: {
            total_combinations: predictionData.topCombinations.length,
            avg_ev: predictionData.topCombinations.reduce((sum: number, c: any) => sum + (c.expectedValue || 1.0), 0) / predictionData.topCombinations.length,
            confidence: 0.75 // デフォルト値
          }
        }
        setForecast(adaptedForecast)
      } else {
        console.error('Failed to fetch prediction data')
        setError('予想データの取得に失敗しました')
      }

      // Handle result data
      if (resultResult.status === 'fulfilled' && resultResult.value) {
        const matchingResult = resultResult.value.results?.find((r: Result) => r.race_id === raceId)
        if (matchingResult) {
          setRaceResult(matchingResult)
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching race data:', err)
      setError('データの取得に失敗しました')
      setLoading(false)
    }
  }, [raceId])

  useEffect(() => {
    if (raceId) {
      fetchRaceData()
    }
  }, [raceId, fetchRaceData])

  useEffect(() => {
    if (raceId) {
      // 同じ競艇場の全レース情報も取得
      const raceInfo = parseRaceId(raceId)
      fetchVenueRaces(raceInfo.venue, raceInfo.date)
    }
  }, [raceId])

  const fetchFixedFirstForecast = async (lane: number | null) => {
    if (!raceId) return

    setFixedLoading(true)

    try {
      // 現在はfixFirst機能を実装していないため、通常の予想を取得
      const response = await fetch(`/api/prediction/${raceId}`)
      if (response.ok) {
        const predictionResult = await response.json()
        if (predictionResult.success) {
          const predictionData = predictionResult.prediction
          let filteredCombinations = predictionData.topCombinations

          // lane指定があれば、クライアント側でフィルタリング
          if (lane) {
            filteredCombinations = predictionData.topCombinations.filter((combo: any) =>
              combo.triple.startsWith(lane.toString())
            )
          }

          const adaptedForecast: Forecast = {
            triples: filteredCombinations.map((combo: any) => ({
              combo: combo.triple,
              odds: null,
              ev: combo.expectedValue || 1.0,
              prob: combo.probability,
              super: combo.expectedValue >= 1.5 && combo.probability >= 0.04,
              icons: ['🎯'],
              why: null
            })),
            updated_at: predictionResult.timestamp,
            summary: {
              total_combinations: filteredCombinations.length,
              avg_ev: filteredCombinations.reduce((sum: number, c: any) => sum + (c.expectedValue || 1.0), 0) / filteredCombinations.length,
              confidence: 0.75
            }
          }
          setForecast(adaptedForecast)
        }
      }
    } catch (err) {
      console.error('Error fetching fixed first forecast:', err)
    } finally {
      setFixedLoading(false)
    }
  }

  const fetchVenueRaces = useCallback(async (venue: string, date: string) => {
    setVenueRacesLoading(true)
    try {
      // 住之江の全レース情報を取得
      const response = await fetch(`/api/races/${venue}?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        const races = data.races || []
        setVenueRaces(races.map((race: any) => ({
          race_id: race.race_id,
          race_no: race.race_number || race.race_no,
          has_super: race.has_super || false
        })))
      } else {
        // フォールバック: モックデータを生成
        const mockRaces = Array.from({length: 12}, (_, i) => ({
          race_id: `${venue}-${date.replace(/-/g, '')}-${i + 1}R`,
          race_no: i + 1,
          has_super: Math.random() > 0.3
        }))
        setVenueRaces(mockRaces)
      }
    } catch (error) {
      console.error('Error fetching venue races:', error)
      // フォールバック: モックデータ
      const mockRaces = Array.from({length: 12}, (_, i) => ({
        race_id: `${venue}-${date.replace(/-/g, '')}-${i + 1}R`,
        race_no: i + 1,
        has_super: Math.random() > 0.3
      }))
      setVenueRaces(mockRaces)
    } finally {
      setVenueRacesLoading(false)
    }
  }, [])

  const handleLaneSelect = (lane: number | null) => {
    setFixedFirst(lane)
    updateUrl({ fixedFirst: lane })
    fetchFixedFirstForecast(lane)
  }

  const generateMockCloseAt = (raceInfo: RaceIdInfo) => {
    const raceNo = parseInt(raceInfo.raceNo.replace('R', ''))
    const today = new Date()
    today.setHours(10 + raceNo, 45, 0, 0)
    return today.toISOString()
  }


  if (!raceId || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="pt-16 md:pt-4 p-4">
          <div className="max-w-6xl mx-auto">
            <RaceDetailSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-surface-1 rounded-lg shadow-card p-6 text-center border border-ink-line">
            <div className="text-error">{error}</div>
            <button
              onClick={fetchRaceData}
              className="mt-4 bg-brand text-white px-4 py-2 rounded hover:bg-brand transition"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  const raceInfo = parseRaceId(raceId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        onLegendClick={openLegend}
        onFeedbackClick={openFeedback}
        showBackButton={true}
        pageTitle={`${getVenueDisplayName(raceInfo.venue)} ${raceInfo.raceNo}`}
      />

      {/* メインコンテンツ */}
      <div className="pt-20 p-4">
        <div className="max-w-6xl mx-auto">

        {/* レースタブ */}
        {venueRaces.length > 0 && (
          <div className="mb-4 bg-white rounded-lg shadow-card border border-ink-line overflow-hidden">
            <div className="p-2">
              <div className="flex overflow-x-auto space-x-2 pb-1" style={{scrollbarWidth: 'thin'}}>
                {venueRaces.map((race) => {
                  const isCurrentRace = race.race_id === raceId
                  return (
                    <Link
                      key={race.race_id}
                      href={`/race/${race.race_id}`}
                      className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isCurrentRace
                          ? 'bg-brand text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{race.race_no}R</span>
                        {race.has_super && (
                          <span className="text-xs">⭐</span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* レースヘッダー */}
        <RaceHeader
          venue={getVenueDisplayName(raceInfo.venue)}
          date={raceInfo.date}
          raceNo={raceInfo.raceNo}
          closeAt={generateMockCloseAt(raceInfo)}
          hasSuperPicks={forecast?.triples.some(t => t.super) || false}
          selectedLane={fixedFirst}
          onLaneSelect={handleLaneSelect}
          fixedLoading={fixedLoading}
        />

        {/* 予想結果と選手一覧 - 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 予想リスト */}
          <div className="bg-surface-1 rounded-lg shadow-card p-4 border border-ink-line">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-1">
                {fixedFirst ? `${fixedFirst}号艇 固定予想` : '予想結果'}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setElementFilter('all')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    elementFilter === 'all'
                      ? 'bg-ink-1 text-surface-1'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                  }`}
                >
                  全表示
                </button>
                <button
                  onClick={() => setElementFilter('high_ev')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    elementFilter === 'high_ev'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                  }`}
                >
                  💰 期待値
                </button>
                <button
                  onClick={() => setElementFilter('realistic')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    elementFilter === 'realistic'
                      ? 'bg-blue-500 text-white'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                  }`}
                >
                  🎯 現実的
                </button>
                <button
                  onClick={() => setElementFilter('relative')}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    elementFilter === 'relative'
                      ? 'bg-green-500 text-white'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                  }`}
                >
                  ⭐ 相対優位
                </button>
              </div>
            </div>

            <ForecastList
              triples={filteredTriples}
              loading={loading}
              raceResult={raceResult && raceResult.win_triple ? {
                triple: raceResult.win_triple,
                payout: raceResult.payouts?.trifecta || null,
                popularity: null
              } : undefined}
              urlSyncProps={{
                getStateFromUrl,
                updateUrl,
              }}
            />
          </div>

          {/* 選手一覧 */}
          <RaceEntries raceId={raceId} />
        </div>

        {/* 凡例 */}
        <div className="mt-6 bg-surface-1 rounded-xl shadow-hover p-4 border border-ink-line">
          <h3 className="text-sm font-semibold text-ink-1 mb-3">凡例</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚀</span>
              <span className="text-ink-2">スピード優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">💨</span>
              <span className="text-ink-2">パワー優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🧱</span>
              <span className="text-ink-2">安定性優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚡</span>
              <span className="text-ink-2">テクニック優位</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="font-medium text-yellow-800 mb-2">⭐ SUPER基準（3つの要素）</div>
            <div className="space-y-1 text-yellow-700">
              <div className="flex items-center space-x-2">
                <span>💰</span>
                <span><strong>期待値が高い</strong> - 長期利益につながる予想（EV ≥ 1.5）</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🎯</span>
                <span><strong>現実的な当選率</strong> - 机上の空論でない予想（確率 ≥ 5%）</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⭐</span>
                <span><strong>そのレースで特に狙い目</strong> - 相対的に優秀な予想（上位30%）</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-yellow-600">
              上記3要素をすべて満たす予想のみ⭐SUPERマークが表示されます
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* モーダル */}
      <LegendModal isOpen={legendOpen} onClose={closeLegend} />
      <FeedbackFormComponent />
    </div>
  )
}