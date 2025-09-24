import { useState } from 'react'
import Link from 'next/link'
import { RaceListItem as RaceListItemType } from '@/lib/types'
import { generateWhyBrief } from '@/lib/why'
import EntryRow from './EntryRow'

interface RaceListItemProps {
  race: RaceListItemType
  isOpen: boolean
  onToggle: () => void
}

export default function RaceListItem({ race, isOpen, onToggle }: RaceListItemProps) {
  const [isLoading, setIsLoading] = useState(false)

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

  // 根拠生成（entries がある場合のみ）
  const whyBrief = race.entries ? generateWhyBrief(race.entries) : {
    icons: ['📊'],
    summary: 'データ準備中'
  }

  const handleToggle = async () => {
    if (!isOpen && race.entries) {
      setIsLoading(true)
      // 少し遅延を入れてスケルトンを見せる
      await new Promise(resolve => setTimeout(resolve, 300))
      setIsLoading(false)
    }
    onToggle()
  }

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
              {formatCloseTime(race.close_at)}
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

            {/* 根拠1行 */}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                {whyBrief.icons.map((icon, idx) => (
                  <span key={idx} className="text-sm">{icon}</span>
                ))}
              </div>
              <span className="text-sm text-gray-700 font-medium truncate">
                {whyBrief.summary}
              </span>
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
          {race.entries && race.entries.length > 0 ? (
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
                {race.entries
                  .sort((a, b) => a.lane - b.lane)
                  .map((entry) => (
                    <EntryRow
                      key={`${race.race_id}-${entry.lane}`}
                      entry={entry}
                      isLoading={isLoading}
                    />
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border p-4 text-center text-gray-500 text-sm">
              選手情報が準備されていません
            </div>
          )}
        </div>
      )}
    </div>
  )
}