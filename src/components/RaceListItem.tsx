import { useState, useMemo, memo, useEffect } from 'react'
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

  return (
    <div className="border-b border-gray-100">
      {/* レースヘッダー */}
      <div
        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!raceIsOpen ? 'opacity-60' : ''}`}
        onClick={handleToggle}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
          {/* Race Number */}
          <div className="col-span-1">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
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
            {/* 既存アイコン */}
            <div className="flex items-center space-x-1">
              {race.icons.map((icon, idx) => (
                <span key={idx} className="text-lg">{icon}</span>
              ))}
            </div>

            {/* 根拠1行 - API側で計算済みの場合は表示、未取得の場合はプレースホルダー */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {entriesData?.why_brief ? (
                <>
                  <div className="flex items-center space-x-1">
                    {entriesData.why_brief.icons.map((icon, idx) => (
                      <span key={idx} className="text-sm">{icon}</span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {entriesData.why_brief.summary}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">📊</span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium truncate">
                    {isOpen && isLoading ? '分析中...' : 'クリックで分析'}
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
              <div className="text-xs text-gray-400">
                {isOpen ? '▲' : '▼'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 展開コンテンツ - 選手情報 */}
      {isOpen && (
        <div className="px-4 pb-4 bg-gray-50">
          {isLoading && (
            <div className="bg-white rounded-lg border overflow-hidden">
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
            <div className="bg-white rounded-lg border p-4 text-center text-red-500 text-sm">
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
            <div className="bg-white rounded-lg border overflow-hidden">
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
          )}

          {!isLoading && !fetchError && (!entriesData?.entries || entriesData.entries.length === 0) && (
            <div className="bg-white rounded-lg border p-4 text-center text-gray-500 text-sm">
              選手情報が準備されていません
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default RaceListItem