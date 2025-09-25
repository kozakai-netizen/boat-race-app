'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { VenueResponse } from '@/lib/types'
import LegendModal, { useLegendModal } from '@/components/LegendModal'
import { useFeedbackModal } from '@/components/FeedbackForm'

export default function SuminoyeHome() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedGrade, setSelectedGrade] = useState<'normal' | 'major'>('normal')
  const [venueData, setVenueData] = useState<VenueResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const { isOpen: legendOpen, openModal: openLegend, closeModal: closeLegend } = useLegendModal()
  const { openModal: openFeedback, FeedbackForm: FeedbackFormComponent } = useFeedbackModal('/suminoye')

  useEffect(() => {
    fetchVenueData()
  }, [selectedDate, selectedGrade]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchVenueData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/venues/suminoye?date=${selectedDate}&grade=${selectedGrade}`)
      if (response.ok) {
        const data = await response.json()
        setVenueData(data)
      } else {
        console.error('Failed to fetch venue data')
        setVenueData(null)
      }
    } catch (error) {
      console.error('Error fetching venue data:', error)
      setVenueData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatNextCloseTime = (closeAt: string | null) => {
    if (!closeAt) return null
    const date = new Date(closeAt)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center relative">
            <div className="absolute top-0 left-0">
              <button
                onClick={() => router.back()}
                className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition text-sm"
              >
                ← 戻る
              </button>
            </div>
            <div className="absolute top-0 right-0 flex items-center space-x-2">
              <button
                onClick={openLegend}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
              >
                凡例
              </button>
              <button
                onClick={openFeedback}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
              >
                💬 フィードバック
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🚤 住之江ボートレース</h1>
            <p className="text-gray-600">AIによる競艇予想システム</p>
          </div>

          {/* 日付・グレード選択 */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="date" className="text-sm font-medium text-gray-700">
                日付:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedGrade('normal')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  selectedGrade === 'normal'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                一般戦
              </button>
              <button
                onClick={() => setSelectedGrade('major')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  selectedGrade === 'major'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                重賞
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        )}

        {venueData && !loading && (
          <>
            {/* 天候・基本情報 */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 天候 */}
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {venueData.weather_summary ? getWeatherIcon(venueData.weather_summary) : '📊'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {venueData.weather_summary?.condition || 'データなし'}
                  </div>
                  {venueData.weather_summary && (
                    <div className="text-xs text-gray-500 mt-1">
                      {venueData.weather_summary.temp_c && `${venueData.weather_summary.temp_c}°C`}
                      {venueData.weather_summary.wind_ms && ` 風${venueData.weather_summary.wind_ms}m/s`}
                    </div>
                  )}
                </div>

                {/* SUPER PICKS */}
                <div className="text-center">
                  <div className="text-2xl mb-2">⭐</div>
                  <div className="text-lg font-semibold text-yellow-600">
                    {venueData.super_picks_count}件
                  </div>
                  <div className="text-sm text-gray-600">SUPER PICKS</div>
                </div>

                {/* 次の締切 */}
                <div className="text-center">
                  <div className="text-2xl mb-2">⏰</div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatNextCloseTime(venueData.next_close_at) || '--:--'}
                  </div>
                  <div className="text-sm text-gray-600">次の締切</div>
                </div>
              </div>
            </div>

            {/* ナビゲーション */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href={`/suminoye/races?date=${selectedDate}&grade=${selectedGrade}`}>
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">📋 レース一覧</h3>
                      <p className="text-gray-600 text-sm">
                        本日の全レース・出走情報・AI予想を確認
                      </p>
                    </div>
                    <div className="text-3xl text-blue-600">→</div>
                  </div>
                </div>
              </Link>

              <Link href={`/suminoye/results?date=${selectedDate}`}>
                <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">📊 結果・成績</h3>
                      <p className="text-gray-600 text-sm">
                        レース結果・的中状況・払戻金を確認
                      </p>
                    </div>
                    <div className="text-3xl text-green-600">→</div>
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}

        {!venueData && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">データが見つかりませんでした</div>
            <p className="text-sm text-gray-400 mt-2">
              選択した日付・グレードのレース情報がありません
            </p>
          </div>
        )}
      </div>

      {/* モーダル */}
      <LegendModal isOpen={legendOpen} onClose={closeLegend} />
      <FeedbackFormComponent />
    </div>
  )
}

function getWeatherIcon(weather: { temp_c: number | null; wind_ms: number | null; condition: string }): string {
  const { temp_c, wind_ms } = weather

  if (wind_ms && wind_ms >= 5) return '🌪️'
  if (wind_ms && wind_ms >= 3) return '💨'
  if (temp_c && temp_c >= 25) return '☀️'
  if (temp_c && temp_c <= 10) return '🌨️'

  return '🌤️'
}