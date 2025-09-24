import { SimpleRaceEntry } from '@/lib/types'
import {
  getMotorBadge,
  getGradeBadgeColor,
  getSTColor,
  getExhibitionColor
} from '@/lib/why'

interface EntryRowProps {
  entry: SimpleRaceEntry
  isLoading?: boolean
}

// スケルトンローディング
function EntryRowSkeleton() {
  return (
    <div className="flex items-center space-x-2 p-2 animate-pulse">
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
  )
}

export default function EntryRow({ entry, isLoading }: EntryRowProps) {
  if (isLoading) {
    return <EntryRowSkeleton />
  }

  const motorBadge = getMotorBadge(entry)
  const gradeBadgeColor = getGradeBadgeColor(entry.player_grade)
  const stColor = getSTColor(entry.st_time)
  const exhibitionColor = getExhibitionColor(entry.exhibition_time)

  // 2連率を算出（モーターレート + ランダム要素で簡易計算）
  const twoRate = Math.round(entry.motor_rate * 0.8 + Math.random() * 15 + 15)

  return (
    <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 transition-colors">
      {/* 枠番 */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
        ${entry.lane === 1 ? 'bg-white text-black border-2 border-black' :
          entry.lane === 2 ? 'bg-black text-white' :
          entry.lane === 3 ? 'bg-red-500' :
          entry.lane === 4 ? 'bg-blue-500' :
          entry.lane === 5 ? 'bg-yellow-500 text-black' :
          'bg-green-500'}
      `}>
        {entry.lane}
      </div>

      {/* 選手名・級別 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {entry.player_name}
          </span>
          <span className={`
            px-1.5 py-0.5 rounded text-xs font-medium border
            ${gradeBadgeColor}
          `}>
            {entry.player_grade}
          </span>
        </div>
        <div className="text-xs text-gray-500 truncate mt-0.5">
          {entry.lane}号艇
        </div>
      </div>

      {/* ST */}
      <div className="text-right min-w-[3rem]">
        <div className={`text-sm font-mono ${stColor}`}>
          {entry.st_time.toFixed(2)}
        </div>
        <div className="text-xs text-gray-400">ST</div>
      </div>

      {/* 展示T */}
      <div className="text-right min-w-[3rem]">
        <div className={`text-sm font-mono ${exhibitionColor}`}>
          {entry.exhibition_time.toFixed(2)}
        </div>
        <div className="text-xs text-gray-400">展示</div>
      </div>

      {/* モーター調子バッジ */}
      <div className="relative group">
        <span className={`
          px-1.5 py-0.5 rounded text-xs font-bold border cursor-help
          ${motorBadge.color}
        `}>
          {motorBadge.grade}
        </span>
        {/* ツールチップ */}
        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          {motorBadge.tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* 2連率 */}
      <div className="text-right min-w-[3rem]">
        <div className="text-sm font-medium text-gray-900">
          {twoRate}%
        </div>
        <div className="text-xs text-gray-400">2連</div>
      </div>
    </div>
  )
}