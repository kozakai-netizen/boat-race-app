'use client'

import { useState, useEffect } from 'react'

interface ResultData {
  race_id: string
  triple: string
  payout: number | null
  popularity: number | null
  settled_at: string | null
  parsed: {
    date: string
    venue: number
    race_no: number
  }
}

interface RealResultsProps {
  date?: string      // "2025-07-15"
  venue?: number     // 1-24
  limit?: number     // 表示件数制限
}

export default function RealResults({ date, venue, limit = 20 }: RealResultsProps) {
  const [results, setResults] = useState<ResultData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 競艇場名取得
  const getVenueName = (venueId: number) => {
    const venues: Record<number, string> = {
      1: '桐生', 2: '戸田', 3: '江戸川', 4: '平和島', 5: '多摩川', 6: '浜名湖',
      7: '蒲郡', 8: '常滑', 9: '津', 10: '三国', 11: 'びわこ', 12: '住之江',
      13: '尼崎', 14: '鳴門', 15: '丸亀', 16: '児島', 17: '宮島', 18: '徳山',
      19: '下関', 20: '若松', 21: '芦屋', 22: '福岡', 23: '唐津', 24: '大村'
    }
    return venues[venueId] || `競艇場${venueId}`
  }

  // データ取得
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        setError(null)

        // クエリパラメータ構築
        const params = new URLSearchParams()
        if (date) params.append('date', date)
        if (venue) params.append('venue', venue.toString())

        console.log(`🔍 Fetching real results: date=${date}, venue=${venue}`)

        const response = await fetch(`/api/results?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch results')
        }

        console.log(`✅ Received ${data.count} real results`)
        setResults(data.results.slice(0, limit))

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        console.error('❌ Failed to fetch real results:', errorMessage)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [date, venue, limit])

  // ローディング表示
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-surface-2 h-16 rounded-lg"></div>
        ))}
      </div>
    )
  }

  // エラー表示
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-red-500 text-xl mr-2">❌</span>
          <div>
            <h3 className="font-medium text-red-800">データ取得エラー</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // データなし表示
  if (results.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-yellow-500 text-xl mr-2">📊</span>
          <div>
            <h3 className="font-medium text-yellow-800">データなし</h3>
            <p className="text-yellow-700 text-sm mt-1">
              指定された条件（日付: {date || '全て'}, 会場: {venue ? getVenueName(venue) : '全て'}）に一致する結果データが見つかりませんでした。
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 結果表示
  return (
    <div className="space-y-3">
      {/* ヘッダー情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-800 font-medium">📊 リアルデータ表示中</span>
            <span className="text-blue-600 text-sm ml-2">
              {date && `${date} `}
              {venue && `${getVenueName(venue)} `}
              ({results.length}件)
            </span>
          </div>
          <div className="text-xs text-blue-600">
            Supabase連携
          </div>
        </div>
      </div>

      {/* 結果一覧 */}
      {results.map((result) => (
        <div key={result.race_id} className="bg-surface-1 border border-ink-line rounded-lg p-4 hover:shadow-card transition-shadow">
          <div className="flex items-center justify-between">
            {/* レース情報 */}
            <div className="flex items-center space-x-3">
              <div className="bg-brand text-white px-2 py-1 rounded text-sm font-bold">
                {getVenueName(result.parsed.venue)}
              </div>
              <div className="text-ink-1 font-medium">
                {result.parsed.race_no}R
              </div>
              <div className="text-ink-3 text-sm">
                {result.parsed.date}
              </div>
            </div>

            {/* 結果情報 */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-ink-1 font-bold text-lg">
                  {result.triple}
                </div>
                <div className="text-ink-3 text-xs">
                  3連単
                </div>
              </div>

              {result.payout && (
                <div className="text-right">
                  <div className="text-brand font-bold text-lg">
                    ¥{result.payout.toLocaleString()}
                  </div>
                  <div className="text-ink-3 text-xs">
                    払戻金
                  </div>
                </div>
              )}

              {result.popularity && (
                <div className="text-right">
                  <div className="text-ink-2 font-medium">
                    {result.popularity}番人気
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 確定時刻 */}
          {result.settled_at && (
            <div className="text-ink-3 text-xs mt-2 pt-2 border-t border-ink-line">
              確定: {new Date(result.settled_at).toLocaleString('ja-JP')}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}