'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import HamburgerMenu from '@/components/HamburgerMenu'

interface VenueStatus {
  id: number
  name: string
  region: string
  status: string
  dataStatus: string
  races: number
  nextRace: { race: number; time: string } | null
  isCompleted: boolean
  grade: string
  raceTitle: string
  day: string | null
  hasWomen: boolean
}

export default function Home() {
  const today = new Date().toISOString().split('T')[0]
  const [venues, setVenues] = useState<VenueStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayDate, setDisplayDate] = useState<string>(today)

  // リアルタイム開催状況を取得
  useEffect(() => {
    const fetchVenueStatus = async () => {
      try {
        setLoading(true)
        console.log('🔄 Fetching venue status...')

        const response = await fetch('/api/venues-status')
        const data = await response.json()

        if (data.success) {
          setVenues(data.venues)
          setDisplayDate(data.date || today)
          console.log(`✅ Loaded ${data.venues.length} venues for ${data.date}`)
        } else {
          throw new Error(data.error || 'Failed to fetch venue status')
        }
      } catch (err) {
        console.error('❌ Error fetching venue status:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')

        // エラー時はモックデータでフォールバック
        setVenues([
          { id: 12, name: '住之江', region: '関西', status: 'データなし', dataStatus: 'disconnected', races: 0, nextRace: null, isCompleted: false, grade: 'G1', raceTitle: 'グランプリ', day: null, hasWomen: true },
          { id: 2, name: '戸田', region: '関東', status: 'データなし', dataStatus: 'disconnected', races: 0, nextRace: null, isCompleted: false, grade: 'G3', raceTitle: '記念競走', day: null, hasWomen: false },
          { id: 11, name: 'びわこ', region: '関西', status: 'データなし', dataStatus: 'disconnected', races: 0, nextRace: null, isCompleted: false, grade: '一般', raceTitle: '一般競走', day: null, hasWomen: false },
          { id: 13, name: '尼崎', region: '関西', status: 'データなし', dataStatus: 'disconnected', races: 0, nextRace: null, isCompleted: false, grade: 'G2', raceTitle: '周年記念', day: null, hasWomen: true },
          { id: 1, name: '桐生', region: '関東', status: 'データなし', dataStatus: 'disconnected', races: 0, nextRace: null, isCompleted: false, grade: '一般', raceTitle: '一般競走', day: null, hasWomen: false },
          { id: 22, name: '福岡', region: '九州', status: 'データなし', dataStatus: 'disconnected', races: 0, nextRace: null, isCompleted: false, grade: 'G3', raceTitle: '企業杯', day: null, hasWomen: true }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchVenueStatus()

    // 5分ごとに更新
    const interval = setInterval(fetchVenueStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case '開催中': return 'bg-green-100 text-green-800 border-green-300'
      case '未開催': return 'bg-blue-100 text-blue-800 border-blue-300'
      case '開催終了': return 'bg-red-100 text-red-800 border-red-300'
      case 'データなし': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'SG': return 'bg-red-500 text-white'
      case 'G1': return 'bg-orange-500 text-white'
      case 'G2': return 'bg-blue-500 text-white'
      case 'G3': return 'bg-green-500 text-white'
      case '一般': return 'bg-gray-500 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        showBackButton={false}
        pageTitle="舟券王への道標"
      />

      <div className="pt-20 p-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-blue-500 rounded-full opacity-90"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl">🚤</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">舟券王への道標</h1>
            <p className="text-gray-600 mb-2">競艇場を選択してください</p>
            <p className="text-sm text-gray-500">{displayDate}</p>
          </div>

          {/* 競艇場一覧 */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              🚤 本日の開催競艇場
              <span className="ml-auto text-sm font-normal text-gray-500">
                {loading ? (
                  '取得中...'
                ) : (
                  <>
                    {venues.filter(v => v.dataStatus === 'connected').length}場データ連携済み・{venues.filter(v => v.status === '開催中').length}場開催中
                    {error && (
                      <span className="text-red-500 ml-2">⚠️</span>
                    )}
                  </>
                )}
              </span>
            </h2>

            {/* ローディング状態 */}
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">開催状況を確認中...</p>
              </div>
            )}

            {/* エラー状態 */}
            {error && !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-2">⚠️</span>
                  <p className="text-yellow-800">
                    リアルタイムデータの取得に失敗しました。モックデータで表示しています。
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {venues.map((venue) => (
                <Link
                  key={venue.id}
                  href={venue.dataStatus === 'connected' ? `/races?venue=${venue.id}` : '#'}
                  className={`block p-4 rounded-lg border-2 transition-all ${
                    venue.dataStatus === 'connected'
                      ? 'hover:border-blue-500 hover:shadow-md cursor-pointer'
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🌊</div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-lg text-gray-800">
                            {venue.name}
                          </h3>
                          <div className={`px-1.5 py-0.5 rounded text-xs font-bold ${getGradeColor(venue.grade)}`}>
                            {venue.grade}
                          </div>
                          {venue.hasWomen && (
                            <div className="text-pink-500 text-sm">♀</div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">#{venue.id} {venue.region}</p>
                        {venue.day && (
                          <p className="text-xs text-blue-600 font-medium">{venue.day}</p>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(venue.status)}`}>
                      {venue.status}
                    </div>
                  </div>

                  {venue.status === '開催中' && venue.nextRace && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <span>🏁</span>
                          <span className="text-gray-600">{venue.races}R</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>⏰</span>
                          <span className="text-blue-600 font-medium">
                            {venue.nextRace.race}R {venue.nextRace.time}
                          </span>
                        </div>
                      </div>
                      <div className="text-blue-600 font-medium">
                        レース一覧 →
                      </div>
                    </div>
                  )}

                  {venue.dataStatus === 'connected' && (venue.status === '未開催' || venue.status === '開催終了') && (
                    <div className="text-sm">
                      {venue.status === '開催終了' ? (
                        <div className="text-red-600 font-medium">
                          開催終了 →
                        </div>
                      ) : venue.isCompleted ? (
                        <div className="text-red-600 font-medium">
                          開催終了 →
                        </div>
                      ) : (
                        <div className="text-blue-600 font-medium">
                          データ連携済み・未開催 →
                        </div>
                      )}
                    </div>
                  )}

                  {venue.dataStatus !== 'connected' && (
                    <div className="text-sm text-gray-500">
                      データ未連携
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* クイックアクセス */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 クイックアクセス</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/unified"
                className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium text-gray-800">結果・成績</div>
                <div className="text-xs text-gray-600">予想vs実績分析</div>
              </Link>
              <Link
                href="/admin/import"
                className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-center"
              >
                <div className="text-2xl mb-2">🛠️</div>
                <div className="font-medium text-gray-800">データ管理</div>
                <div className="text-xs text-gray-600">6場一括取得</div>
              </Link>
            </div>
          </div>

          {/* フッター */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              対応競艇場のリアルデータを利用したAI予想システム
            </p>
            <p className="text-xs text-gray-400 mt-1">
              現在6場対応済み、手動データ取得運用中
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}