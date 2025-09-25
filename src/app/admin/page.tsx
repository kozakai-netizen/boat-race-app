'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  races: number
  players: number
  results: number
  photos: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    races: 0,
    players: 0,
    results: 0,
    photos: 0
  })
  const [loading, setLoading] = useState(true)
  const [dataMode, setDataMode] = useState<string>('')

  useEffect(() => {
    setDataMode(process.env.NEXT_PUBLIC_DATA_MODE || 'mock')
    // TODO: Fetch actual stats from API
    setTimeout(() => {
      setStats({
        races: 156,
        players: 48,
        results: 142,
        photos: 12
      })
      setLoading(false)
    }, 500)
  }, [])

  const cards = [
    { name: 'レース数', value: stats.races, href: '/admin/races', color: 'bg-blue-500' },
    { name: '選手数', value: stats.players, href: '/admin/players', color: 'bg-green-500' },
    { name: '結果数', value: stats.results, href: '/admin/results', color: 'bg-yellow-500' },
    { name: '写真数', value: stats.photos, href: '/admin/photos', color: 'bg-purple-500' },
  ]

  const quickActions = [
    { name: '新しいレースを追加', href: '/admin/races', icon: '🏁' },
    { name: '選手を登録', href: '/admin/players', icon: '🏊‍♂️' },
    { name: '選手CSVインポート', href: '/admin/import/players', icon: '📊' },
    { name: '結果を入力', href: '/admin/results', icon: '🏆' },
    { name: '写真をアップロード', href: '/admin/photos/upload', icon: '📸' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => router.back()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1"
            >
              <span>←</span>
              <span>戻る</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            管理画面ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            舟券王への道のデータ管理
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            dataMode === 'live'
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {dataMode === 'live' ? '🔴 本番モード' : '🟡 デモモード'}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.name} href={card.href}>
            <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition">
              <div>
                <div className={`absolute ${card.color} rounded-md p-3`}>
                  <div className="w-6 h-6 text-white font-bold flex items-center justify-center">
                    {card.name.charAt(0)}
                  </div>
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {card.name}
                </p>
              </div>
              <div className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">
                  {loading ? '...' : card.value.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{action.icon}</div>
                  <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {action.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            システム状態
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">データモード</span>
              <span className={`text-sm font-medium ${
                dataMode === 'live' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {dataMode === 'live' ? 'LIVE' : 'DEMO'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">データベース接続</span>
              <span className="text-sm font-medium text-green-600">正常</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ストレージ</span>
              <span className="text-sm font-medium text-green-600">正常</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            最近の活動
          </h2>
          <p className="text-sm text-gray-500">
            活動ログ機能は今後実装予定です。
          </p>
        </div>
      </div>
    </div>
  )
}