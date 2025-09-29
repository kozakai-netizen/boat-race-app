'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ResultsResponse } from '@/lib/types'
import { HIT_ICONS } from '@/lib/constants'
import ResultCard from '@/components/ResultCard'
import HamburgerMenu from '@/components/HamburgerMenu'
import LegendModal, { useLegendModal } from '@/components/LegendModal'
import { useFeedbackModal } from '@/components/FeedbackForm'

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [resultsData, setResultsData] = useState<ResultsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState<'live' | 'demo'>('demo')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const { isOpen: legendOpen, openModal: openLegend, closeModal: closeLegend } = useLegendModal()
  const { openModal: openFeedback, FeedbackForm: FeedbackFormComponent } = useFeedbackModal('/suminoye/results')

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

  useEffect(() => {
    fetchResultsData()
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResultsData = async () => {
    setLoading(true)

    try {
      // LIVE モードの場合は先に LIVE API を試行
      if (dataMode === 'live') {
        try {
          console.log('🔄 Trying LIVE results...')
          const liveResponse = await fetch(`/api/live/results?date=${date}&venue=12`)

          if (liveResponse.ok) {
            const liveResults = await liveResponse.json()
            const headers = liveResponse.headers

            if (Array.isArray(liveResults) && liveResults.length > 0) {
              // LIVE データが取得できた場合
              console.log('✅ LIVE results available:', liveResults.length)

              // 既存形式に変換
              const convertedData = {
                results: liveResults.map(result => ({
                  race_id: result.race_id,
                  race_number: result.race_no,
                  win_triple: result.finish.join('-'),
                  payouts: {
                    trifecta: result.payout
                  },
                  popularity: result.popularity
                })),
                date: date,
                venue: 'suminoye'
              }

              setResultsData(convertedData)
              setDataSource('live')
              setLastUpdated(headers.get('X-Last-Updated') || new Date().toISOString())
              setLoading(false)
              return
            }
          }
        } catch (liveError) {
          console.warn('⚠️ LIVE results failed, falling back to DEMO:', liveError)
        }
      }

      // DEMO にフォールバック
      console.log('🔄 Using DEMO results...')
      const response = await fetch(`/api/results/suminoye?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setResultsData(data)
        setDataSource('demo')
        setLastUpdated(new Date().toISOString())
      } else {
        console.error('Failed to fetch demo results data')
        setResultsData(null)
        setDataSource('demo')
      }
    } catch (error) {
      console.error('Error fetching results data:', error)
      setResultsData(null)
      setDataSource('demo')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    // 手動更新（LIVE の場合はキャッシュもクリア）
    if (dataSource === 'live') {
      try {
        await fetch(`/api/revalidate?tag=results:${date}`)
        console.log('🔄 Cache cleared for LIVE results')
      } catch (error) {
        console.error('Failed to clear cache:', error)
      }
    }

    await fetchResultsData()
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        onLegendClick={openLegend}
        onFeedbackClick={openFeedback}
        showBackButton={true}
        pageTitle="レース結果"
      />

      {/* メインコンテンツ */}
      <div className="pt-20 p-4">
        <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-800">レース結果</h1>
                  {/* データソースバッジ */}
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    dataSource === 'live'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  }`}>
                    {dataSource === 'live' ? '[LIVE]' : '[DEMO]'}
                  </span>
                </div>
                <p className="text-gray-600">{date} 舟券王への道from住之江競艇</p>
                {lastUpdated && (
                  <p className="text-xs text-gray-500">
                    最終更新: {new Date(lastUpdated).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* 日付選択 */}
              <div className="flex items-center space-x-2">
                <label htmlFor="result-date" className="text-sm font-medium text-gray-700">
                  日付:
                </label>
                <input
                  type="date"
                  id="result-date"
                  value={date}
                  onChange={(e) => {
                    const newDate = e.target.value
                    const params = new URLSearchParams()
                    params.set('date', newDate)
                    router.push(`/suminoye/results?${params.toString()}`)
                  }}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`px-4 py-2 rounded text-sm transition ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? '⏳ 更新中...' : '🔄 更新'}
              </button>
            </div>
          </div>

          {/* データモード説明 */}
          <div className={`text-xs p-3 rounded-lg border mb-4 ${
            dataSource === 'live'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-2">
              <div className="font-medium">
                {dataSource === 'live' ? '🟢 リアルタイムデータ' : '🟡 デモデータ'}
              </div>
              <div className="flex-1 text-xs">
                {dataSource === 'live'
                  ? 'Boatrace Open APIから取得した実際のレース結果を表示しています。'
                  : 'デモ用の仮想データを表示しています。実際のレース結果ではありません。'
                }
              </div>
            </div>
          </div>

          {/* 成績サマリー */}
          {resultsData && resultsData.results.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {Object.entries(HIT_ICONS).map(([type, icon], index) => {
                  // Mock hit counts for simplified system
                  const mockCounts = { win: 2, inTop: 1, miss: 2, ref: 0 }
                  const count = mockCounts[type as keyof typeof mockCounts] || 0
                  return (
                    <div key={type} className="flex items-center justify-center space-x-2">
                      <span className="text-lg">{icon}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        )}

        {resultsData && !loading && (
          <div className="space-y-4">
            {resultsData.results.length > 0 ? (
              resultsData.results.map((result) => {
                // Transform Result interface to match ResultCard expectations
                const cardResult = {
                  race_id: result.race_id,
                  triple: result.win_triple || '',
                  payout: result.payouts?.trifecta || null,
                  popularity: null,
                  hit: 'ref' as const
                };
                return <ResultCard key={result.race_id} result={cardResult} />
              })
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>選択した日付の結果データが見つかりませんでした</p>
              </div>
            )}
          </div>
        )}

        {!resultsData && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">データが見つかりませんでした</div>
            <p className="text-sm text-gray-400 mt-2">
              選択した日付のレース結果がありません
            </p>
          </div>
        )}
        </div>
      </div>

      {/* モーダル */}
      <LegendModal isOpen={legendOpen} onClose={closeLegend} />
      <FeedbackFormComponent />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4"><div className="bg-white rounded-lg shadow-lg p-6 text-center"><div className="text-gray-500">読み込み中...</div></div></div>}>
      <ResultsPageContent />
    </Suspense>
  )
}