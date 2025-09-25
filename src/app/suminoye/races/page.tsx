'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { RacesResponse } from '@/lib/types'
import RaceListItem from '@/components/RaceListItem'
import SideMenu from '@/components/SideMenu'
import MobileHeader from '@/components/MobileHeader'
import LegendModal, { useLegendModal } from '@/components/LegendModal'
import { useFeedbackModal } from '@/components/FeedbackForm'

function RacesPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [racesData, setRacesData] = useState<RacesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuperOnly, setShowSuperOnly] = useState(false)
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [expandedRaces, setExpandedRaces] = useState<Set<string>>(new Set())

  const { isOpen: legendOpen, openModal: openLegend, closeModal: closeLegend } = useLegendModal()
  const { openModal: openFeedback, FeedbackForm: FeedbackFormComponent } = useFeedbackModal('/suminoye/races')

  // 外部リンク表示フラグ
  const enableExternalLinks = process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_LINKS === 'true'

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const grade = searchParams.get('grade') || 'normal'

  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

  useEffect(() => {
    fetchRacesData()
  }, [date, grade]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRacesData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/races/suminoye?date=${date}&grade=${grade}`)
      if (response.ok) {
        const data = await response.json()
        setRacesData(data)
      } else {
        console.error('Failed to fetch races data')
        setRacesData(null)
      }
    } catch (error) {
      console.error('Error fetching races data:', error)
      setRacesData(null)
    } finally {
      setLoading(false)
    }
  }

  const isRaceOpen = useCallback((closeAt: string) => {
    const now = new Date()
    const closeTime = new Date(closeAt)
    return now < closeTime
  }, [])

  const toggleRaceExpansion = useCallback((raceId: string) => {
    setExpandedRaces(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(raceId)) {
        newExpanded.delete(raceId)
      } else {
        newExpanded.add(raceId)
      }
      return newExpanded
    })
  }, [])

  const filteredRaces = useMemo(() => {
    return racesData?.races.filter(race => {
      if (showSuperOnly && !race.has_super) return false
      if (showOpenOnly && !isRaceOpen(race.close_at)) return false
      return true
    }) || []
  }, [racesData?.races, showSuperOnly, showOpenOnly, isRaceOpen])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ARC風サイドメニュー - デスクトップのみ */}
      <SideMenu
        onLegendClick={openLegend}
        onFeedbackClick={openFeedback}
        showBackButton={true}
      />

      {/* モバイル用ヘッダー */}
      <MobileHeader
        onLegendClick={openLegend}
        onFeedbackClick={openFeedback}
        showBackButton={true}
      />

      {/* メインコンテンツ - モバイルは上部マージン */}
      <div className="pt-16 md:pt-4 p-4">
        <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="flex items-center space-x-2 md:hidden">
                <button
                  onClick={() => router.back()}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1"
                >
                  <span>←</span>
                  <span>戻る</span>
                </button>
                <Link href="/suminoye" className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1">
                  <span>🏠</span>
                  <span>ホーム</span>
                </Link>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">レース一覧</h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {date} ({grade === 'major' ? '重賞' : '一般戦'})
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* DATA_MODEバッジ */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                dataMode === 'live'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              }`}>
                {dataMode === 'live' ? '[LIVE]' : '[DEMO]'}
              </div>

              {racesData && (
                <div className="text-right text-sm text-gray-600">
                  全{racesData.races.length}レース
                </div>
              )}
            </div>
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

          {/* データモード説明 */}
          <div className={`text-xs p-3 rounded-lg border ${
            dataMode === 'live'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-2">
              <div className="font-medium">
                {dataMode === 'live' ? '🟢 本番モード' : '🟡 デモモード'}
              </div>
              <div className="flex-1 text-xs">
                {dataMode === 'live'
                  ? '実際のレースデータを使用しています。選手写真は権利を有するもののみ表示されます。'
                  : 'デモ用の仮想データを使用しています。選手写真は表示されません。'
                }
                {enableExternalLinks && '選手の詳細情報は外部サイト（マクール）でご確認いただけます。'}
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        )}

        {racesData && !loading && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* レース一覧ヘッダー */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  レース一覧 ({filteredRaces.length}R)
                </h2>
                <div className="text-sm text-gray-600">
                  クリックで選手情報を表示
                </div>
              </div>
            </div>

            {/* レース一覧 */}
            <div>
              {filteredRaces.map((race) => (
                <RaceListItem
                  key={race.race_id}
                  race={race}
                  isOpen={expandedRaces.has(race.race_id)}
                  onToggle={() => toggleRaceExpansion(race.race_id)}
                />
              ))}
            </div>

            {filteredRaces.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                条件に合うレースが見つかりませんでした
              </div>
            )}
          </div>
        )}

        {!racesData && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">データが見つかりませんでした</div>
            <p className="text-sm text-gray-400 mt-2">
              選択した日付・グレードのレース情報がありません
            </p>
          </div>
        )}

        {/* 凡例 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">凡例</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⭐</span>
              <span>SUPER PICKS（高EV予想）</span>
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
              <span>AI予想・分析</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              💡 アイコンが多く表示されているレースほど、複数の要素で優位性がある狙い目のレースです
            </p>
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
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4"><div className="bg-white rounded-lg shadow-lg p-6 text-center"><div className="text-gray-500">読み込み中...</div></div></div>}>
      <RacesPageContent />
    </Suspense>
  )
}