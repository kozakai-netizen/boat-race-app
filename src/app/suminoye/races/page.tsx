'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { RacesResponse } from '@/lib/types'
import RaceListItem from '@/components/RaceListItem'

function RacesPageContent() {
  const searchParams = useSearchParams()
  const [racesData, setRacesData] = useState<RacesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuperOnly, setShowSuperOnly] = useState(false)
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [expandedRaces, setExpandedRaces] = useState<Set<string>>(new Set())

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const grade = searchParams.get('grade') || 'normal'

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

  const isRaceOpen = (closeAt: string) => {
    const now = new Date()
    const closeTime = new Date(closeAt)
    return now < closeTime
  }

  const toggleRaceExpansion = (raceId: string) => {
    const newExpanded = new Set(expandedRaces)
    if (newExpanded.has(raceId)) {
      newExpanded.delete(raceId)
    } else {
      newExpanded.add(raceId)
    }
    setExpandedRaces(newExpanded)
  }

  const filteredRaces = racesData?.races.filter(race => {
    if (showSuperOnly && !race.has_super) return false
    if (showOpenOnly && !isRaceOpen(race.close_at)) return false
    return true
  }) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/suminoye" className="text-blue-600 hover:text-blue-800">
                ← ホームに戻る
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">レース一覧</h1>
                <p className="text-gray-600">
                  {date} ({grade === 'major' ? '重賞' : '一般戦'})
                </p>
              </div>
            </div>

            {racesData && (
              <div className="text-right text-sm text-gray-600">
                全{racesData.races.length}レース
              </div>
            )}
          </div>

          {/* フィルター */}
          <div className="flex flex-wrap gap-4">
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
      </div>
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