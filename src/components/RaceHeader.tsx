'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface RaceHeaderProps {
  venue: string
  date: string
  raceNo: string
  closeAt?: string
  weather?: {
    temp_c?: number
    wind_ms?: number
    condition?: string
  }
  hasSuperPicks: boolean
  selectedLane?: number | null
  onLaneSelect?: (lane: number | null) => void
  fixedLoading?: boolean
}

export default function RaceHeader({
  venue,
  date,
  raceNo,
  closeAt,
  weather,
  hasSuperPicks,
  selectedLane,
  onLaneSelect,
  fixedLoading
}: RaceHeaderProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isFixedModeExpanded, setIsFixedModeExpanded] = useState<boolean>(false)

  useEffect(() => {
    if (!closeAt) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const closeTime = new Date(closeAt)
      const diff = closeTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining('締切済')
        setIsOpen(false)
        return
      }

      setIsOpen(true)
      const minutes = Math.floor(diff / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        setTimeRemaining(`${hours}時間${remainingMinutes}分`)
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [closeAt])

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-surface-1 rounded-lg shadow-card p-3 mb-4 border border-ink-line">
      {/* デスクトップ表示 */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-full bg-brand text-white font-bold text-lg flex items-center justify-center">
              {raceNo.replace('R', '')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-1">
                {venue} {raceNo}
              </h1>
              <p className="text-sm text-ink-3">{date}</p>
            </div>
          </div>

          {/* バッジ群 */}
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isOpen
                ? 'bg-success-soft text-success'
                : 'bg-surface-3 text-ink-3'
            }`}>
              {isOpen ? '発売中' : '締切済'}
            </div>

            {closeAt && timeRemaining && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                isOpen
                  ? 'bg-brand-soft text-brand'
                  : 'bg-surface-3 text-ink-3'
              }`}>
                {timeRemaining}
              </div>
            )}

            {hasSuperPicks && (
              <div className="bg-warning-soft text-warning px-3 py-1 rounded-full text-xs font-medium flex items-center">
                ⭐ SUPER
              </div>
            )}
          </div>
        </div>

        {/* 右側情報 */}
        <div className="text-right">
          {closeAt && (
            <div className="text-sm">
              <div className="text-ink-3">締切</div>
              <div className="font-semibold text-ink-1">
                {formatTime(closeAt)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* モバイル表示 */}
      <div className="sm:hidden">
        {/* 1行目: レース情報と締切時間 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-brand text-white font-bold text-sm flex items-center justify-center">
              {raceNo.replace('R', '')}
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink-1">
                {venue} {raceNo}
              </h1>
              <p className="text-xs text-ink-3">{date}</p>
            </div>
          </div>

          {closeAt && (
            <div className="text-right">
              <div className="text-xs text-ink-3">締切</div>
              <div className="text-sm font-semibold text-ink-1">
                {formatTime(closeAt)}
              </div>
            </div>
          )}
        </div>

        {/* 2行目: バッジ群 */}
        <div className="flex items-center space-x-2 flex-wrap gap-1">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isOpen
              ? 'bg-success-soft text-success'
              : 'bg-surface-3 text-ink-3'
          }`}>
            {isOpen ? '発売中' : '締切済'}
          </div>

          {closeAt && timeRemaining && (
            <div className={`px-2 py-1 rounded-full text-xs font-bold ${
              isOpen
                ? 'bg-brand-soft text-brand'
                : 'bg-surface-3 text-ink-3'
            }`}>
              {timeRemaining}
            </div>
          )}

          {hasSuperPicks && (
            <div className="bg-warning-soft text-warning px-2 py-1 rounded-full text-xs font-medium flex items-center">
              ⭐ SUPER
            </div>
          )}
        </div>
      </div>

      {/* 天候情報行 */}
      {weather && (
        <div className="mt-3 pt-3 border-t border-ink-line">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-lg">🌤️</span>
              <span className="text-ink-2">{weather.condition || '晴れ'}</span>
            </div>

            {weather.temp_c && (
              <div className="flex items-center space-x-1">
                <span className="text-warning font-medium">{weather.temp_c}°C</span>
              </div>
            )}

            {weather.wind_ms && (
              <div className="flex items-center space-x-1">
                <span className="text-brand">💨 {weather.wind_ms}m/s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1着固定モード - モバイル対応アコーディオン */}
      {onLaneSelect && (
        <div className="mt-3 pt-3 border-t border-ink-line">
          {/* デスクトップ表示 */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-ink-2">1着固定モード</h4>
              {fixedLoading && (
                <div className="text-xs text-brand flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand mr-1"></div>
                  計算中
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onLaneSelect(null)}
                disabled={fixedLoading}
                className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                  selectedLane === null
                    ? 'bg-ink-1 text-surface-1'
                    : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                } ${fixedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                全表示
              </button>

              {[1, 2, 3, 4, 5, 6].map(lane => (
                <button
                  key={lane}
                  onClick={() => onLaneSelect(lane)}
                  disabled={fixedLoading}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                    selectedLane === lane
                      ? 'bg-brand text-white'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                  } ${fixedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {lane}
                </button>
              ))}
            </div>

            <div className="mt-1.5 text-xs text-ink-3">
              {selectedLane
                ? `${selectedLane}号艇を1着に固定した組み合わせを表示`
                : '全ての3連単組み合わせを期待値順で表示'
              }
            </div>

          </div>

          {/* モバイル表示 - アコーディオン */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsFixedModeExpanded(!isFixedModeExpanded)}
              className="flex items-center justify-between w-full py-2"
            >
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-ink-2">1着固定モード</h4>
                {selectedLane && (
                  <span className="px-2 py-0.5 bg-brand text-white rounded text-xs font-medium">
                    {selectedLane}号艇
                  </span>
                )}
                {fixedLoading && (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-brand"></div>
                )}
              </div>
              {isFixedModeExpanded ? (
                <ChevronUpIcon className="h-4 w-4 text-ink-3" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 text-ink-3" />
              )}
            </button>

            {isFixedModeExpanded && (
              <div className="pb-2">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <button
                    onClick={() => onLaneSelect(null)}
                    disabled={fixedLoading}
                    className={`py-2 rounded text-xs font-medium transition ${
                      selectedLane === null
                        ? 'bg-ink-1 text-surface-1'
                        : 'bg-surface-2 text-ink-2'
                    } ${fixedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    全表示
                  </button>

                  {[1, 2, 3].map(lane => (
                    <button
                      key={lane}
                      onClick={() => onLaneSelect(lane)}
                      disabled={fixedLoading}
                      className={`py-2 rounded text-xs font-medium transition ${
                        selectedLane === lane
                          ? 'bg-brand text-white'
                          : 'bg-surface-2 text-ink-2'
                      } ${fixedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {lane}号艇
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[4, 5, 6].map(lane => (
                    <button
                      key={lane}
                      onClick={() => onLaneSelect(lane)}
                      disabled={fixedLoading}
                      className={`py-2 rounded text-xs font-medium transition ${
                        selectedLane === lane
                          ? 'bg-brand text-white'
                          : 'bg-surface-2 text-ink-2'
                      } ${fixedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {lane}号艇
                    </button>
                  ))}
                </div>

                <div className="text-xs text-ink-3">
                  {selectedLane
                    ? `${selectedLane}号艇を1着に固定`
                    : '全組み合わせを期待値順で表示'
                  }
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}