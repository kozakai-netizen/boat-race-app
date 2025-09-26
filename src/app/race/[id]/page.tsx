'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Forecast, Result } from '@/lib/types'
import { parseRaceId, getVenueDisplayName, type RaceIdInfo } from '@/lib/raceId'
import RaceHeader from '@/components/RaceHeader'
import ForecastList from '@/components/ForecastList'
import RaceEntries from '@/components/RaceEntries'
import HamburgerMenu from '@/components/HamburgerMenu'
import { useLegendModal } from '@/components/LegendModal'
import { useFeedbackModal } from '@/components/FeedbackForm'
import { useUrlSync } from '@/hooks/useUrlSync'
import { RaceDetailSkeleton } from '@/components/ui/SkeletonLoader'

const LegendModal = dynamic(() => import('@/components/LegendModal').then(mod => ({ default: mod.default })), {
  loading: () => null
})

const ShareButton = dynamic(() => import('@/components/ShareButton'), {
  loading: () => <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
})

interface RaceDetailProps {
  params: Promise<{ id: string }>
}

export default function RaceDetail({ params }: RaceDetailProps) {
  const [raceId, setRaceId] = useState<string>('')
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [raceResult, setRaceResult] = useState<Result | null>(null)
  const [fixedFirst, setFixedFirst] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [fixedLoading, setFixedLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getStateFromUrl, updateUrl } = useUrlSync()
  const { isOpen: legendOpen, openModal: openLegend, closeModal: closeLegend } = useLegendModal()
  const { openModal: openFeedback, FeedbackForm: FeedbackFormComponent } = useFeedbackModal(`/race/${raceId}`)

  // Handle async params
  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params
      setRaceId(resolvedParams.id)
    }
    initParams()
  }, [params])

  // Initialize state from URL on component mount
  useEffect(() => {
    const urlState = getStateFromUrl()
    if (urlState.fixedFirst !== undefined) {
      setFixedFirst(urlState.fixedFirst)
    }
  }, [getStateFromUrl])

  const fetchRaceData = useCallback(async () => {
    if (!raceId) return

    setLoading(true)
    setError(null)

    try {
      const raceInfo = parseRaceId(raceId)

      // Parallel data fetching for better performance
      const [forecastResult, resultResult] = await Promise.allSettled([
        fetch(`/api/forecast/${raceId}`).then(res => res.ok ? res.json() : null),
        fetch(`/api/results/suminoye?date=${raceInfo.date}`).then(res => res.ok ? res.json() : null)
      ])

      // Handle forecast data
      if (forecastResult.status === 'fulfilled' && forecastResult.value) {
        setForecast(forecastResult.value)
      } else {
        console.error('Failed to fetch forecast data')
        setError('予想データの取得に失敗しました')
      }

      // Handle result data
      if (resultResult.status === 'fulfilled' && resultResult.value) {
        const matchingResult = resultResult.value.results?.find((r: Result) => r.race_id === raceId)
        if (matchingResult) {
          setRaceResult(matchingResult)
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching race data:', err)
      setError('データの取得に失敗しました')
      setLoading(false)
    }
  }, [raceId])

  useEffect(() => {
    if (raceId) {
      fetchRaceData()
    }
  }, [raceId, fetchRaceData])

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
    updateUrl({ fixedFirst: lane })
    fetchFixedFirstForecast(lane)
  }

  const generateMockCloseAt = (raceInfo: RaceIdInfo) => {
    const raceNo = parseInt(raceInfo.raceNo.replace('R', ''))
    const today = new Date()
    today.setHours(10 + raceNo, 45, 0, 0)
    return today.toISOString()
  }


  if (!raceId || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="pt-16 md:pt-4 p-4">
          <div className="max-w-6xl mx-auto">
            <RaceDetailSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-surface-1 rounded-lg shadow-card p-6 text-center border border-ink-line">
            <div className="text-error">{error}</div>
            <button
              onClick={fetchRaceData}
              className="mt-4 bg-brand text-white px-4 py-2 rounded hover:bg-brand transition"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        onLegendClick={openLegend}
        onFeedbackClick={openFeedback}
        showBackButton={true}
        pageTitle={`${getVenueDisplayName(raceInfo.venue)} ${raceInfo.raceNo}`}
      />

      {/* メインコンテンツ */}
      <div className="pt-20 p-4">
        <div className="max-w-6xl mx-auto">

        {/* レースヘッダー */}
        <RaceHeader
          venue={getVenueDisplayName(raceInfo.venue)}
          date={raceInfo.date}
          raceNo={raceInfo.raceNo}
          closeAt={generateMockCloseAt(raceInfo)}
          hasSuperPicks={forecast?.triples.some(t => t.super) || false}
          selectedLane={fixedFirst}
          onLaneSelect={handleLaneSelect}
          fixedLoading={fixedLoading}
        />

        {/* 予想結果と選手一覧 - 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 予想リスト */}
          <div className="bg-surface-1 rounded-lg shadow-card p-4 border border-ink-line">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink-1">
                {fixedFirst ? `${fixedFirst}号艇 固定予想` : '予想結果'}
              </h2>
              <div className="flex items-center space-x-2">
                <ShareButton />
                <button
                  onClick={fetchRaceData}
                  className="px-3 py-1.5 bg-brand text-white rounded-lg hover:bg-brand transition text-sm"
                >
                  🔄 更新
                </button>
              </div>
            </div>

            <ForecastList
              triples={forecast?.triples || []}
              loading={loading}
              raceResult={raceResult && raceResult.win_triple ? {
                triple: raceResult.win_triple,
                payout: raceResult.payouts?.trifecta || null,
                popularity: null
              } : undefined}
              urlSyncProps={{
                getStateFromUrl,
                updateUrl,
              }}
            />
          </div>

          {/* 選手一覧 */}
          <RaceEntries raceId={raceId} />
        </div>

        {/* 凡例 */}
        <div className="mt-6 bg-surface-1 rounded-xl shadow-hover p-4 border border-ink-line">
          <h3 className="text-sm font-semibold text-ink-1 mb-3">凡例</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🚀</span>
              <span className="text-ink-2">スピード優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">💨</span>
              <span className="text-ink-2">パワー優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">🧱</span>
              <span className="text-ink-2">安定性優位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚡</span>
              <span className="text-ink-2">テクニック優位</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-ink-3">
            <p>EV ≥ 1.25 かつ 確率 ≥ 4% で⭐SUPER表示</p>
          </div>
        </div>
        </div>
      </div>

      {/* モーダル */}
      <LegendModal isOpen={legendOpen} onClose={closeLegend} />
      <FeedbackFormComponent />
    </div>
  )
}