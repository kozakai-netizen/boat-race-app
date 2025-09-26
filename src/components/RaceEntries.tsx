'use client'

import { useState, useEffect, memo } from 'react'
import { SimpleRaceEntry } from '@/lib/types'

interface RaceEntriesProps {
  raceId: string
}

interface EntriesResponse {
  entries: SimpleRaceEntry[]
  why_brief?: {
    icons: string[]
    summary: string
  }
}

const GradeBadge = memo(({ grade, color }: { grade: string, color: string }) => (
  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${color}`}>
    {grade}
  </span>
))
GradeBadge.displayName = 'GradeBadge'

const MotorBadge = memo(({ badge }: { badge: { grade: '◎' | '○' | '△', color: string, tooltip: string } }) => (
  <div className="relative group">
    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${badge.color}`}>
      {badge.grade}
    </span>
    <div className="hidden sm:block absolute bottom-full mb-1 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      {badge.tooltip}
    </div>
  </div>
))
MotorBadge.displayName = 'MotorBadge'

function RaceEntries({ raceId }: RaceEntriesProps) {
  const [entries, setEntries] = useState<SimpleRaceEntry[]>([])
  const [whyBrief, setWhyBrief] = useState<{icons: string[], summary: string} | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntries = async () => {
      if (!raceId) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/race-entries?raceId=${raceId}`)
        if (!response.ok) {
          throw new Error('選手情報の取得に失敗しました')
        }

        const data: EntriesResponse = await response.json()
        setEntries(data.entries)
        setWhyBrief(data.why_brief || null)
      } catch (err) {
        console.error('Error fetching entries:', err)
        setError('選手情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [raceId])

  if (loading) {
    return (
      <div className="bg-surface-1 rounded-lg shadow-card p-6 border border-ink-line">
        <h3 className="text-lg font-semibold text-ink-1 mb-4">出場選手</h3>
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-surface-3 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-3 rounded w-20 mb-1"></div>
                  <div className="h-3 bg-surface-3 rounded w-16"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-surface-3 rounded w-8"></div>
                  <div className="h-6 bg-surface-3 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface-1 rounded-lg shadow-card p-6 border border-ink-line">
        <h3 className="text-lg font-semibold text-ink-1 mb-4">出場選手</h3>
        <div className="text-center py-8">
          <div className="text-error mb-2">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-brand hover:text-brand-soft"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 rounded-lg shadow-card p-4 border border-ink-line">
      <h3 className="text-lg font-semibold text-ink-1 mb-4">出場選手</h3>

      {/* レース根拠 */}
      {whyBrief && (
        <div className="mb-4 p-3 bg-surface-2 rounded-md">
          <div className="flex items-center space-x-2">
            {whyBrief.icons.map((icon, index) => (
              <span key={index} className="text-lg">{icon}</span>
            ))}
            <div className="text-sm text-ink-2">{whyBrief.summary}</div>
          </div>
        </div>
      )}

      {/* 選手一覧テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-line">
              <th className="text-left py-2 px-2 text-ink-2 font-medium">艇番</th>
              <th className="text-left py-2 px-2 text-ink-2 font-medium">選手名</th>
              <th className="text-left py-2 px-2 text-ink-2 font-medium">級別</th>
              <th className="text-left py-2 px-2 text-ink-2 font-medium">ST</th>
              <th className="text-left py-2 px-2 text-ink-2 font-medium">展示</th>
              <th className="text-left py-2 px-2 text-ink-2 font-medium">機力</th>
              <th className="text-left py-2 px-2 text-ink-2 font-medium">2着率</th>
              <th className="text-left py-2 px-2 text-ink-2 font-medium">3着率</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.lane} className="border-b border-ink-line hover:bg-surface-2">
                <td className="py-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-brand text-white font-bold text-sm flex items-center justify-center">
                    {entry.lane}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <div className="font-medium text-ink-1">{entry.player_name}</div>
                </td>
                <td className="py-3 px-2">
                  <GradeBadge grade={entry.player_grade} color={entry.grade_badge_color} />
                </td>
                <td className="py-3 px-2">
                  <span className={`font-mono font-medium ${entry.st_color}`}>
                    {entry.st_time.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span className={`font-mono font-medium ${entry.exhibition_color}`}>
                    {entry.exhibition_time.toFixed(2)}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-ink-2">{entry.motor_rate.toFixed(1)}%</span>
                    <MotorBadge badge={entry.motor_badge} />
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className="font-mono text-ink-2">{entry.two_rate}%</span>
                </td>
                <td className="py-3 px-2">
                  <span className="font-mono text-ink-2">{entry.three_rate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル用カード表示 */}
      <div className="md:hidden space-y-3 mt-4">
        {entries.map((entry) => (
          <div key={entry.lane} className="p-3 bg-surface-2 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-brand text-white font-bold text-sm flex items-center justify-center">
                  {entry.lane}
                </div>
                <div>
                  <div className="font-medium text-ink-1">{entry.player_name}</div>
                  <GradeBadge grade={entry.player_grade} color={entry.grade_badge_color} />
                </div>
              </div>
              <MotorBadge badge={entry.motor_badge} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-3">ST:</span>
                <span className={`font-mono font-medium ${entry.st_color}`}>
                  {entry.st_time.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">展示:</span>
                <span className={`font-mono font-medium ${entry.exhibition_color}`}>
                  {entry.exhibition_time.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">機力:</span>
                <span className="font-mono text-ink-2">{entry.motor_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">2着率:</span>
                <span className="font-mono text-ink-2">{entry.two_rate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(RaceEntries)