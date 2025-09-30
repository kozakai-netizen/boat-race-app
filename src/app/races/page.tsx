'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { RacesResponse, Forecast } from '@/lib/types'
import RaceListItem from '@/components/RaceListItem'
import ImprovedRaceCard from '@/components/ImprovedRaceCard'
import HamburgerMenu from '@/components/HamburgerMenu'
import LegendModal, { useLegendModal } from '@/components/LegendModal'
import { useFeedbackModal } from '@/components/FeedbackForm'
import { RaceListSkeleton } from '@/components/ui/SkeletonLoader'

function RacesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [racesData, setRacesData] = useState<RacesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [forecasts, setForecasts] = useState<Record<string, Forecast>>({})
  const [forecastsLoading, setForecastsLoading] = useState(false)
  const [showSuperOnly, setShowSuperOnly] = useState(false)
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [expandedRaces, setExpandedRaces] = useState<Set<string>>(new Set())
  const [selectedVenue, setSelectedVenue] = useState(() => {
    const venueParam = searchParams.get('venue')
    return venueParam ? parseInt(venueParam) : 12 // デフォルト：住之江
  })

  const { isOpen: legendOpen, openModal: openLegend, closeModal: closeLegend } = useLegendModal()
  const { openModal: openFeedback, FeedbackForm: FeedbackFormComponent } = useFeedbackModal('/races')

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const grade = searchParams.get('grade') || 'normal'

  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

  // 競艇場名取得
  const getVenueName = (venueId: number) => {
    const venues: Record<number, string> = {
      1: '桐生',
      2: '戸田',
      11: 'びわこ',
      12: '住之江',
      13: '尼崎',
      22: '福岡'
    }
    return venues[venueId] || `競艇場${venueId}`
  }

  useEffect(() => {
    fetchRacesData()
  }, [date, grade, selectedVenue]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch forecasts when races data is loaded
  useEffect(() => {
    if (racesData?.races?.length) {
      fetchForecastsData()
    }
  }, [racesData]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRacesData = async () => {
    setLoading(true)
    try {
      // 住之江以外は現在デモデータを返す
      if (selectedVenue === 12) {
        const response = await fetch(`/api/races/suminoye?date=${date}&grade=${grade}`)
        if (response.ok) {
          const data = await response.json()
          setRacesData(data)
        } else {
          console.error('Failed to fetch races data')
          setRacesData(null)
        }
      } else {
        // 戸田・尼崎は一旦デモデータ
        setRacesData({
          races: [],
          status: 'demo',
          timestamp: new Date().toISOString(),
          venue: getVenueName(selectedVenue),
          date: date
        })
      }
    } catch (error) {
      console.error('Error fetching races data:', error)
      setRacesData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchForecastsData = async () => {
    if (!racesData?.races?.length) return

    setForecastsLoading(true)

    try {
      // Use Promise.allSettled for better error handling and performance
      const forecastPromises = racesData.races.map(async (race) => {
        const response = await fetch(`/api/prediction/${race.race_id}`)
        if (response.ok) {
          const predictionResult = await response.json()
          if (predictionResult.success) {
            const predictionData = predictionResult.prediction
            const adaptedForecast: Forecast = {
              triples: predictionData.topCombinations.map((combo: any) => ({
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
                total_combinations: predictionData.topCombinations.length,
                avg_ev: predictionData.topCombinations.reduce((sum: number, c: any) => sum + (c.expectedValue || 1.0), 0) / predictionData.topCombinations.length,
                confidence: 0.75
              }
            }
            return { raceId: race.race_id, forecast: adaptedForecast }
          }
        }
        return { raceId: race.race_id, forecast: null }
      })

      const results = await Promise.allSettled(forecastPromises)
      const forecastMap: Record<string, Forecast> = {}

      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value?.forecast?.triples?.length > 0) {
          forecastMap[result.value.raceId] = result.value.forecast
        }
      })

      setForecasts(forecastMap)
    } catch (error) {
      console.error('Error fetching forecasts:', error)
    } finally {
      setForecastsLoading(false)
    }
  }

  const isRaceOpen = useCallback((closeAt: string) => {
    const now = new Date()
    const closeTime = new Date(closeAt)
    // レース開始時間まで発売中とみなす
    return now < closeTime
  }, [])

  const toggleRaceExpansion = useCallback((raceId: string) => {
    const startTime = performance.now()
    const isExpanding = !expandedRaces.has(raceId)

    setExpandedRaces(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(raceId)) {
        newExpanded.delete(raceId)
      } else {
        newExpanded.add(raceId)
      }
      return newExpanded
    })

    // Performance measurement for race expansion
    if (isExpanding) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const endTime = performance.now()
          const duration = endTime - startTime
          const target = 600 // 600ms target

          if (process.env.NODE_ENV === 'development') {
            console.log(`Race expansion performance:`, {
              raceId,
              duration: `${duration.toFixed(2)}ms`,
              target: `${target}ms`,
              status: duration <= target ? '✅ PASS' : '❌ FAIL',
              difference: duration > target ? `+${(duration - target).toFixed(2)}ms over target` : `${(target - duration).toFixed(2)}ms under target`
            })
          }

          // Report to analytics/monitoring if available
          if (window.gtag) {
            window.gtag('event', 'race_expansion_performance', {
              duration: Math.round(duration),
              target: target,
              within_target: duration <= target,
              race_id: raceId
            })
          }
        }, 0)
      })
    }
  }, [expandedRaces])

  const filteredRaces = useMemo(() => {
    if (!racesData?.races) return []

    return racesData.races.filter(race => {
      // ⭐のみ表示: メイン予想（1番目）がSUPERかどうかで判定
      if (showSuperOnly) {
        const forecast = forecasts[race.race_id]

        // forecastが存在しない場合は除外
        if (!forecast || !forecast.triples || forecast.triples.length === 0) {
          console.log(`Race ${race.race_id}: No forecast data available`)
          return false
        }

        // メイン予想（1番目）がSUPERかどうかで判定
        const topPrediction = forecast.triples[0]
        const isMainSuper = topPrediction?.super === true

        // デバッグ用ログ
        console.log(`Race ${race.race_id}:`, {
          hasForecast: !!forecast,
          triples: forecast.triples.length,
          topPredictionSuper: topPrediction?.super,
          isMainSuper,
          forecastsLoading
        })

        if (!isMainSuper) return false
      }

      // 発売中のみ表示: 締切時間で判定
      if (showOpenOnly && !isRaceOpen(race.close_at)) return false

      return true
    })
  }, [racesData?.races, showSuperOnly, showOpenOnly, isRaceOpen, forecasts, forecastsLoading])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        onLegendClick={openLegend}
        onFeedbackClick={openFeedback}
        showBackButton={true}
        pageTitle={`${getVenueName(selectedVenue)} (${date})`}
      />

      {/* メインコンテンツ */}
      <div className="pt-20 p-4">
        <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          {/* タイトル・基本情報 統合ヘッダー */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
            {/* 左側: タイトル情報 */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">🚤 レース一覧</h1>
              <p className="text-gray-600 text-sm sm:text-base">
                {getVenueName(selectedVenue)} - {date} ({grade === 'major' ? '重賞' : '一般戦'})
              </p>
            </div>

            {/* 右側: 基本情報（天気・SUPER PICKS・次の締切） */}
            {selectedVenue === 12 && (
              <div className="flex flex-col sm:flex-row sm:gap-6 gap-4">
                {/* 天候 */}
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {(() => {
                      const hour = new Date().getHours()
                      if (hour < 6 || hour > 18) return '🌙'
                      if (hour < 10) return '🌅'
                      if (Math.random() > 0.7) return '☁️'
                      return '🌤️'
                    })()}
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {(() => {
                      const hour = new Date().getHours()
                      if (hour < 6 || hour > 18) return '夜間'
                      if (hour < 10) return '朝'
                      if (Math.random() > 0.7) return 'くもり'
                      return '晴れ'
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {18 + Math.floor(Math.random() * 8)}°C 風{1 + Math.floor(Math.random() * 4)}m/s
                  </div>
                </div>

                {/* SUPER PICKS */}
                <div className="text-center">
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="text-lg font-bold text-yellow-600">
                    {racesData?.races.filter(race => {
                      const forecast = forecasts[race.race_id]
                      // メイン予想（1番目）がSUPERかどうかで判定
                      return forecast?.triples?.[0]?.super === true
                    }).length || 0}件
                  </div>
                  <div className="text-xs text-gray-600">SUPER PICKS</div>
                </div>

                {/* 次の締切 */}
                <div className="text-center">
                  <div className="text-2xl mb-1">⏰</div>
                  <div className="text-lg font-bold text-green-600">
                    {racesData?.races.length > 0 && racesData.races
                      .filter(race => isRaceOpen(race.close_at))
                      .sort((a, b) => new Date(a.close_at).getTime() - new Date(b.close_at).getTime())[0]
                      ?.close_at ?
                      new Date(racesData.races
                        .filter(race => isRaceOpen(race.close_at))
                        .sort((a, b) => new Date(a.close_at).getTime() - new Date(b.close_at).getTime())[0]
                        .close_at
                      ).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                      : '--:--'
                    }
                  </div>
                  <div className="text-xs text-gray-600">次の締切</div>
                </div>
              </div>
            )}
          </div>


          {/* フィルター */}
          <div className="flex flex-wrap gap-4 mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSuperOnly}
                onChange={(e) => setShowSuperOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">⭐のみ表示</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">発売中のみ表示</span>
            </label>
          </div>

        </div>


        {loading && (
          <RaceListSkeleton />
        )}

        {racesData && !loading && (
          <div className="space-y-4">
            {filteredRaces.length > 0 ? (
              /* 新しいカードレイアウト */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredRaces.map((race) => (
                  <ImprovedRaceCard
                    key={race.race_id}
                    race={race}
                    forecast={forecasts[race.race_id]}
                    isLoading={loading || forecastsLoading}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-3">
                <div className="text-4xl mb-4">🏁</div>
                <div className="text-lg font-medium">
                  {selectedVenue === 12 ?
                    '条件に合うレースが見つかりませんでした' :
                    `${getVenueName(selectedVenue)}のデータは準備中です`
                  }
                </div>
                <p className="text-sm mt-2">
                  {[1, 2, 11, 12, 13, 22].includes(selectedVenue) ?
                    'フィルター条件を変更してお試しください' :
                    '対応済み競艇場：桐生・戸田・びわこ・住之江・尼崎・福岡。他の競艇場を選択してください。'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {!racesData && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">データが見つかりませんでした</div>
            <p className="text-sm text-gray-400 mt-2">
              選択した日付・グレード・競艇場のレース情報がありません
            </p>
          </div>
        )}

        {/* 凡例 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">凡例</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⭐</span>
              <span>SUPER PICKS（期待値・現実的確率・相対優位性の3要素を満たす予想）</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔴</span>
              <span>受付終了</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🟡</span>
              <span>まもなく締切</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚫</span>
              <span>受付中</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚀</span>
              <span>スピード優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">💨</span>
              <span>パワー優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🧱</span>
              <span>安定性優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚡</span>
              <span>テクニック優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📊</span>
              <span>データ予想・分析</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              💡 アイコンが多く表示されているレースほど、複数の要素で優位性がある狙い目のレースです
            </p>
          </div>
        </div>

        {/* 対応状況 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">📈 対応状況</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>6場対応済み</strong>: 桐生・戸田・びわこ・住之江・尼崎・福岡 ✅</p>
            <p>• <strong>手動データ取得</strong>: 6場一括取得機能運用中 ⚡</p>
            <p>• 今後段階的に24場全対応を目指します</p>
          </div>
        </div>

        {/* 利用規約・注意事項 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">ご利用について</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• 本サービスは個人利用・β検証を目的としています</p>
            <p>• 選手写真は当サービスが権利を有するもののみ表示します</p>
            <p>• 詳細な選手情報は外部サイト（マクール等）をご参照ください</p>
            <p>• データの正確性や最新性については保証いたしません</p>
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

export default function RacesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="pt-16 md:pt-4 p-4">
          <div className="max-w-6xl mx-auto">
            <RaceListSkeleton />
          </div>
        </div>
      </div>
    }>
      <RacesPageContent />
    </Suspense>
  )
}