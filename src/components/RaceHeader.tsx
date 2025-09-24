'use client'

import { useState, useEffect } from 'react'

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
}

export default function RaceHeader({
  venue,
  date,
  raceNo,
  closeAt,
  weather,
  hasSuperPicks
}: RaceHeaderProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)

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
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      {/* メイン情報行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
              {raceNo.replace('R', '')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {venue === 'suminoe' ? '住之江' : venue} {raceNo}
              </h1>
              <p className="text-sm text-gray-600">{date}</p>
            </div>
          </div>

          {/* バッジ群 */}
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isOpen
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isOpen ? '発売中' : '締切済'}
            </div>

            {closeAt && timeRemaining && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                isOpen
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {timeRemaining}
              </div>
            )}

            {hasSuperPicks && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                ⭐ SUPER
              </div>
            )}
          </div>
        </div>

        {/* 右側情報 */}
        <div className="text-right">
          {closeAt && (
            <div className="text-sm">
              <div className="text-gray-500">締切</div>
              <div className="font-semibold text-gray-800">
                {formatTime(closeAt)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 天候情報行 */}
      {weather && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-lg">🌤️</span>
              <span className="text-gray-600">{weather.condition || '晴れ'}</span>
            </div>

            {weather.temp_c && (
              <div className="flex items-center space-x-1">
                <span className="text-orange-600 font-medium">{weather.temp_c}°C</span>
              </div>
            )}

            {weather.wind_ms && (
              <div className="flex items-center space-x-1">
                <span className="text-blue-600">💨 {weather.wind_ms}m/s</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}