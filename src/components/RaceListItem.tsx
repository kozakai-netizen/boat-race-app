import { useState, useMemo, memo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { RaceListItem as RaceListItemType } from '@/lib/types'
import EntryRow from './EntryRow'

interface RaceListItemProps {
  race: RaceListItemType
  isOpen: boolean
  onToggle: () => void
}

interface RaceEntriesResponse {
  entries: Array<{
    lane: number
    player_name: string
    player_grade: string
    st_time: number
    exhibition_time: number
    motor_rate: number
    motor_condition: string
    motor_description: string
    // API側で計算済みのデータ
    motor_badge: {
      grade: '◎' | '○' | '△'
      color: string
      tooltip: string
    }
    grade_badge_color: string
    st_color: string
    exhibition_color: string
    two_rate: number
  }>
  why_brief: {
    icons: string[]
    summary: string
  }
}

const RaceListItem = memo(function RaceListItem({ race, isOpen, onToggle }: RaceListItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [entriesData, setEntriesData] = useState<RaceEntriesResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const raceItemRef = useRef<HTMLDivElement>(null)

  // 重い計算をuseMemoでキャッシュ
  const computedValues = useMemo(() => {
    const formatCloseTime = (closeAt: string) => {
      const date = new Date(closeAt)
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const isRaceOpen = (closeAt: string) => {
      const now = new Date()
      const closeTime = new Date(closeAt)
      return now < closeTime
    }

    const raceIsOpen = isRaceOpen(race.close_at)

    return {
      closeTime: formatCloseTime(race.close_at),
      raceIsOpen
    }
  }, [race.close_at])

  // エントリーデータの取得
  useEffect(() => {
    if (isOpen && !entriesData && !isLoading) {
      fetchEntriesData()
    }
  }, [isOpen, entriesData, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // 展開時の自動スクロール
  useEffect(() => {
    if (isOpen && raceItemRef.current) {
      // 少し遅延をかけて、展開アニメーションが始まってからスクロール
      setTimeout(() => {
        raceItemRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 150)
    }
  }, [isOpen])

  const fetchEntriesData = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      // 少し遅延を入れてスケルトンを見せる
      await new Promise(resolve => setTimeout(resolve, 200))

      const response = await fetch(`/api/race-entries?raceId=${race.race_id}`)

      if (!response.ok) {
        throw new Error('エントリーデータの取得に失敗しました')
      }

      const data = await response.json()
      setEntriesData(data)
    } catch (error) {
      console.error('Error fetching entries:', error)
      setFetchError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async () => {
    onToggle()
  }

  const { closeTime, raceIsOpen } = computedValues

  // 初期根拠情報を生成
  const generateInitialReason = (icons: string[]) => {
    if (icons.length === 0) return "通常レース"

    const iconMap: { [key: string]: string } = {
      '🚀': 'スピード',
      '💨': 'パワー',
      '🧱': '安定',
      '⚡': 'テクニック'
    }

    const reasons = icons.map(icon => iconMap[icon]).filter(Boolean)
    if (reasons.length === 0) return "特色レース"

    if (reasons.length === 1) return `${reasons[0]}重視の狙い目`
    if (reasons.length === 2) return `${reasons[0]}・${reasons[1]}の複合優位`
    if (reasons.length >= 3) return `多角的優位（${reasons.length}要素）`

    return "注目レース"
  }

  return (
    <div
      ref={raceItemRef}
      className={`
        transition-all duration-300 relative
        ${isOpen
          ? 'border-2 border-blue-500 shadow-2xl bg-white rounded-lg m-2 z-10'
          : raceIsOpen
            ? 'border-b border-gray-100 shadow-sm bg-white hover:bg-gray-50 opacity-70'
            : 'border-b border-gray-200 shadow-sm bg-gray-50 hover:bg-gray-100 opacity-85'
        }
      `}>
      {/* レースヘッダー */}
      <div
        className={`
          p-4 cursor-pointer transition-all duration-300
          ${isOpen
            ? 'bg-gray-100 border-l-4 border-l-blue-500 shadow-sm'
            : 'hover:bg-gray-50'
          }
          ${!raceIsOpen ? 'opacity-75' : ''}
        `}
        onClick={handleToggle}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Race Number */}
          <div className="col-span-1">
            <div className={`
              w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-all duration-300
              ${isOpen
                ? 'bg-blue-600 text-white shadow-lg scale-110'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}>
              {race.race_no}
            </div>
          </div>

          {/* Close Time */}
          <div className="col-span-2">
            <div className="text-sm font-medium text-gray-800">
              {closeTime}
            </div>
            <div className={`text-xs ${raceIsOpen ? 'text-green-600' : 'text-red-600'}`}>
              {raceIsOpen ? '発売中' : '締切済'}
            </div>
          </div>

          {/* Super Pick */}
          <div className="col-span-1">
            {race.has_super && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                ⭐
              </div>
            )}
          </div>

          {/* Icons + Why Brief */}
          <div className="col-span-5 flex items-center space-x-3">
            {/* 固定位置アイコン - 加点要素として表示 */}
            <div className="flex items-center w-24">
              <span className={`text-lg transition-all duration-200 w-6 text-center ${race.icons.includes('🚀') ? 'opacity-100 scale-110' : 'opacity-10 grayscale'}`}>🚀</span>
              <span className={`text-lg transition-all duration-200 w-6 text-center ${race.icons.includes('💨') ? 'opacity-100 scale-110' : 'opacity-10 grayscale'}`}>💨</span>
              <span className={`text-lg transition-all duration-200 w-6 text-center ${race.icons.includes('🧱') ? 'opacity-100 scale-110' : 'opacity-10 grayscale'}`}>🧱</span>
              <span className={`text-lg transition-all duration-200 w-6 text-center ${race.icons.includes('⚡') ? 'opacity-100 scale-110' : 'opacity-10 grayscale'}`}>⚡</span>
            </div>

            {/* 根拠1行 - 常に表示 */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {entriesData?.why_brief ? (
                <div className="flex-1 min-w-0">
                  {/* 詳細分析結果 */}
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center space-x-1">
                      {entriesData.why_brief.icons.map((icon, idx) => (
                        <span key={idx} className="text-base">{icon}</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-900 font-bold truncate bg-yellow-100 px-3 py-1.5 rounded-md border border-yellow-200">
                      {entriesData.why_brief.summary}
                    </span>
                  </div>

                  {/* 初期推定（下段） */}
                  <div className="flex items-center space-x-1">
                    <span className="text-base">🎯</span>
                    <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded border border-gray-200">
                      初期推定: {generateInitialReason(race.icons)}
                    </span>
                  </div>
                </div>
              ) : isOpen && isLoading ? (
                <>
                  <div className="flex items-center space-x-1">
                    <span className="text-base">📊</span>
                  </div>
                  <span className="text-sm text-blue-600 font-semibold truncate bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200">
                    AI詳細分析中...
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-1">
                    <span className="text-base">🎯</span>
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-200 font-medium">
                      推定
                    </span>
                  </div>
                  <span className="text-sm text-gray-800 font-medium truncate bg-gray-100 px-3 py-1.5 rounded-md border border-gray-300">
                    {generateInitialReason(race.icons)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Exhibition Summary + Actions */}
          <div className="col-span-3 flex items-center justify-between">
            {/* Exhibition Summary */}
            <div className="text-xs text-gray-600 flex-1">
              {race.exhibition_summary?.left_right_gap_max && (
                <div>左右差: {race.exhibition_summary.left_right_gap_max.toFixed(2)}s</div>
              )}
              {race.exhibition_summary?.outer_inner_gap_min && (
                <div>外内差: {race.exhibition_summary.outer_inner_gap_min.toFixed(2)}s</div>
              )}
              {!race.exhibition_summary?.left_right_gap_max && !race.exhibition_summary?.outer_inner_gap_min && (
                <div className="text-gray-400">展示データなし</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-2">
              <Link
                href={`/race/${race.race_id}`}
                className="inline-block bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition"
                onClick={(e) => e.stopPropagation()}
              >
                詳細
              </Link>
              <div className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                <span className="text-gray-400">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 展開コンテンツ - 選手情報 */}
      {isOpen && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-blue-200 animate-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-4 mx-4 bg-white rounded-lg shadow-md border border-blue-100 my-4 ml-8 relative">
            {/* 展開インジケーター：より目立つように */}
            <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full shadow-md"></div>
            {/* 角の装飾 */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full opacity-20"></div>
            {isLoading && (
              <div className="rounded-lg border overflow-hidden">
              {/* ヘッダー */}
              <div className="bg-gray-100 px-4 py-2 border-b">
                <div className="flex items-center space-x-2 text-xs font-medium text-gray-600">
                  <span className="w-8">枠</span>
                  <span className="flex-1">選手情報</span>
                  <span className="w-12 text-center">ST</span>
                  <span className="w-12 text-center">展示</span>
                  <span className="w-8 text-center">機力</span>
                  <span className="w-12 text-center">2連率</span>
                </div>
              </div>

              {/* スケルトンローディング */}
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center space-x-2 p-2 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded"></div>
                    <div className="w-12 h-6 bg-gray-200 rounded"></div>
                    <div className="w-8 h-6 bg-gray-200 rounded"></div>
                    <div className="w-12 h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              </div>
            )}

            {!isLoading && fetchError && (
              <div className="rounded-lg border p-4 text-center text-red-500 text-sm">
                {fetchError}
                <button
                  onClick={fetchEntriesData}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  再試行
                </button>
              </div>
            )}

            {!isLoading && !fetchError && entriesData?.entries && entriesData.entries.length > 0 && (
              <>
                {/* デスクトップ: テーブル形式 */}
                <div className="hidden sm:block rounded-lg border overflow-hidden">
                  {/* ヘッダー */}
                  <div className="bg-gray-100 px-4 py-2 border-b">
                    <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 min-w-max">
                      <span className="w-8">枠</span>
                      <span className="flex-1 min-w-24">選手情報</span>
                      <span className="w-12 text-center">ST</span>
                      <span className="w-12 text-center">展示</span>
                      <span className="w-8 text-center">機力</span>
                      <span className="w-12 text-center">2連率</span>
                    </div>
                  </div>

                  {/* エントリー行 */}
                  <div className="divide-y divide-gray-100">
                    {entriesData.entries
                      .sort((a, b) => a.lane - b.lane)
                      .map((entry) => (
                        <EntryRow
                          key={`${race.race_id}-${entry.lane}`}
                          entry={entry}
                        />
                      ))}
                  </div>
                </div>

                {/* モバイル: カード形式 */}
                <div className="sm:hidden space-y-2">
                  {entriesData.entries
                    .sort((a, b) => a.lane - b.lane)
                    .map((entry) => (
                      <EntryRow
                        key={`${race.race_id}-${entry.lane}`}
                        entry={entry}
                      />
                    ))}
                </div>
              </>
            )}

            {!isLoading && !fetchError && (!entriesData?.entries || entriesData.entries.length === 0) && (
              <div className="rounded-lg border p-4 text-center text-gray-500 text-sm">
                選手情報が準備されていません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default RaceListItem