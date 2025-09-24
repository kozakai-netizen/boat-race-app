'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { RacesResponse } from '@/lib/types'

function RacesPageContent() {
  const searchParams = useSearchParams()
  const [racesData, setRacesData] = useState<RacesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuperOnly, setShowSuperOnly] = useState(false)
  const [showOpenOnly, setShowOpenOnly] = useState(false)

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
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-1">R</div>
                <div className="col-span-2">締切</div>
                <div className="col-span-1">⭐</div>
                <div className="col-span-3">特徴</div>
                <div className="col-span-3">展示差</div>
                <div className="col-span-2">アクション</div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredRaces.map((race) => {
                const isOpen = isRaceOpen(race.close_at)

                return (
                  <div key={race.race_id} className={`p-4 hover:bg-gray-50 ${!isOpen ? 'opacity-60' : ''}`}>
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
                        <div className={`text-xs ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                          {isOpen ? '発売中' : '締切済'}
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

                      {/* Icons */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-1">
                          {race.icons.map((icon, idx) => (
                            <span key={idx} className="text-lg">{icon}</span>
                          ))}
                        </div>
                      </div>

                      {/* Exhibition Summary */}
                      <div className="col-span-3">
                        <div className="text-xs text-gray-600">
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
                      </div>

                      {/* Actions */}
                      <div className="col-span-2">
                        <Link
                          href={`/race/${race.race_id}`}
                          className="inline-block bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium hover:bg-blue-700 transition"
                        >
                          詳細を見る
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
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