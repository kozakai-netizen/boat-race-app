'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Forecast } from '@/lib/types'
import { parseRaceId, getVenueDisplayName } from '@/lib/raceId'
import RaceHeader from '@/components/RaceHeader'
import ForecastList from '@/components/ForecastList'
import FixedFirstTabs from '@/components/FixedFirstTabs'

interface RaceDetailProps {
  params: Promise<{ id: string }>
}

export default function RaceDetail({ params }: RaceDetailProps) {
  const [raceId, setRaceId] = useState<string>('')
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [raceResult, setRaceResult] = useState<any>(null)
  const [fixedFirst, setFixedFirst] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [fixedLoading, setFixedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle async params
  useEffect(() => {
    params.then((resolvedParams) => {
      setRaceId(resolvedParams.id)
    })
  }, [params])

  useEffect(() => {
    if (raceId) {
      fetchRaceData()
    }
  }, [raceId])

  const fetchRaceData = async () => {
    if (!raceId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch forecast data
      const forecastResponse = await fetch(`/api/forecast/${raceId}`)
      if (!forecastResponse.ok) {
        throw new Error('Failed to fetch forecast data')
      }
      const forecastData = await forecastResponse.json()
      setForecast(forecastData)

      // Fetch result data (if exists)
      try {
        const raceInfo = parseRaceId(raceId)
        const resultResponse = await fetch(`/api/results/suminoye?date=${raceInfo.date}`)
        if (resultResponse.ok) {
          const resultData = await resultResponse.json()
          const matchingResult = resultData.results?.find((r: any) => r.race_id === raceId)
          if (matchingResult) {
            setRaceResult(matchingResult)
          }
        }
      } catch (resultErr) {
        console.log('No result data available:', resultErr)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching race data:', err)
      setError('データの取得に失敗しました')
      setLoading(false)
    }
  }

  const fetchFixedFirstForecast = async (lane: number | null) => {
    if (!raceId) return

    setFixedLoading(true)

    try {
      const url = lane
        ? `/api/forecast/${raceId}?fixFirst=${lane}`
        : `/api/forecast/${raceId}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setForecast(data)
      }
    } catch (err) {
      console.error('Error fetching fixed first forecast:', err)
    } finally {
      setFixedLoading(false)
    }
  }

  const handleLaneSelect = (lane: number | null) => {
    setFixedFirst(lane)
    fetchFixedFirstForecast(lane)
  }

  const generateMockCloseAt = (raceInfo: any) => {
    const raceNo = parseInt(raceInfo.raceNo.replace('R', ''))
    const today = new Date()
    today.setHours(10 + raceNo, 45, 0, 0)
    return today.toISOString()
  }


  if (!raceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500">{error}</div>
            <button
              onClick={fetchRaceData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    )
  }

  const raceInfo = parseRaceId(raceId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ナビゲーション */}
        <div className="mb-4">
          <Link href="/suminoye" className="text-blue-600 hover:text-blue-800 text-sm">
            ← ホームに戻る
          </Link>
        </div>

        {/* レースヘッダー */}
        <RaceHeader
          raceId={raceId}
          venue={getVenueDisplayName(raceInfo.venue)}
          date={raceInfo.date}
          raceNo={raceInfo.raceNo}
          closeAt={generateMockCloseAt(raceInfo)}
          hasSuperPicks={forecast?.triples.some(t => t.super) || false}
        />

        {/* 1着固定タブ */}
        <FixedFirstTabs
          selectedLane={fixedFirst}
          onLaneSelect={handleLaneSelect}
          loading={fixedLoading}
        />

        {/* 予想リスト */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {fixedFirst ? `${fixedFirst}号艇 固定予想` : 'AI予想結果'}
            </h2>
            <button
              onClick={fetchRaceData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              🔄 更新
            </button>
          </div>

          <ForecastList
            triples={forecast?.triples || []}
            loading={loading}
            raceResult={raceResult}
          />
        </div>

        {/* 凡例 */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">凡例</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚀</span>
              <span>スピード</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">💨</span>
              <span>パワー</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🧱</span>
              <span>安定</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚡</span>
              <span>テクニック</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            <p>EV ≥ 1.25 かつ 確率 ≥ 4% で⭐SUPER表示</p>
          </div>
        </div>
      </div>
    </div>
  )
}