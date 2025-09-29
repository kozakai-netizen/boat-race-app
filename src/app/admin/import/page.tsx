'use client'

import { useState } from 'react'
import HamburgerMenu from '@/components/HamburgerMenu'

export default function AdminImportPage() {
  const [loading, setLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState(12) // デフォルト住之江
  const [error, setError] = useState('')
  const [batchError, setBatchError] = useState('')

  const handleManualImport = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN

      const response = await fetch('/api/cron/daily-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken || 'boat_admin_2025'
        },
        body: JSON.stringify({
          date: date || undefined,
          venue: venue
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchImport = async () => {
    setBatchLoading(true)
    setBatchError('')
    setBatchResults([])

    const venues = [2, 12, 13] // 戸田、住之江、尼崎
    const targetDate = date || undefined

    try {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN
      const results: any[] = []

      for (const venueId of venues) {
        try {
          const response = await fetch('/api/cron/daily-ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Token': adminToken || 'boat_admin_2025'
            },
            body: JSON.stringify({
              date: targetDate,
              venue: venueId
            })
          })

          const data = await response.json()
          results.push({
            venue: venueId,
            venueName: getVenueName(venueId),
            success: response.ok,
            data: response.ok ? data : null,
            error: response.ok ? null : data.error
          })

          // API負荷軽減のため1秒待機
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (err) {
          results.push({
            venue: venueId,
            venueName: getVenueName(venueId),
            success: false,
            data: null,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      setBatchResults(results)
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBatchLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const getVenueName = (venueId: number) => {
    const venues: Record<number, string> = {
      1: '桐生', 2: '戸田', 3: '江戸川', 4: '平和島', 5: '多摩川', 6: '浜名湖',
      7: '蒲郡', 8: '常滑', 9: '津', 10: '三国', 11: 'びわこ', 12: '住之江',
      13: '尼崎', 14: '鳴門', 15: '丸亀', 16: '児島', 17: '宮島', 18: '徳山',
      19: '下関', 20: '若松', 21: '芦屋', 22: '福岡', 23: '唐津', 24: '大村'
    }
    return venues[venueId] || `競艇場${venueId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        showBackButton={true}
        pageTitle="データ管理"
      />

      <div className="pt-20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              🛠️ データ取得管理
            </h1>

          <div className="space-y-6">
            {/* 手動データ取得セクション */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-4">📥 手動データ取得</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    日付:
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                    max={today}
                  />
                  <span className="text-xs text-gray-500">
                    空欄の場合は前日データを取得
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    競艇場:
                  </label>
                  <select
                    value={venue}
                    onChange={(e) => setVenue(Number(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value={1}>桐生 (#1)</option>
                    <option value={2}>戸田 (#2)</option>
                    <option value={3}>江戸川 (#3)</option>
                    <option value={4}>平和島 (#4)</option>
                    <option value={5}>多摩川 (#5)</option>
                    <option value={6}>浜名湖 (#6)</option>
                    <option value={7}>蒲郡 (#7)</option>
                    <option value={8}>常滑 (#8)</option>
                    <option value={9}>津 (#9)</option>
                    <option value={10}>三国 (#10)</option>
                    <option value={11}>びわこ (#11)</option>
                    <option value={12}>住之江 (#12)</option>
                    <option value={13}>尼崎 (#13)</option>
                    <option value={14}>鳴門 (#14)</option>
                    <option value={15}>丸亀 (#15)</option>
                    <option value={16}>児島 (#16)</option>
                    <option value={17}>宮島 (#17)</option>
                    <option value={18}>徳山 (#18)</option>
                    <option value={19}>下関 (#19)</option>
                    <option value={20}>若松 (#20)</option>
                    <option value={21}>芦屋 (#21)</option>
                    <option value={22}>福岡 (#22)</option>
                    <option value={23}>唐津 (#23)</option>
                    <option value={24}>大村 (#24)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setDate(yesterday)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  昨日
                </button>
                <button
                  onClick={() => setDate(today)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  今日
                </button>
                <button
                  onClick={() => setDate('')}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  クリア
                </button>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleManualImport}
                  disabled={loading || batchLoading}
                  className={`px-6 py-3 rounded font-medium text-white ${
                    loading || batchLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? '🔄 取得中...' : '🚀 単一会場取得'}
                </button>

                <button
                  onClick={handleBatchImport}
                  disabled={loading || batchLoading}
                  className={`px-6 py-3 rounded font-medium text-white ${
                    loading || batchLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {batchLoading ? '🔄 一括取得中...' : '⚡ 3場一括取得'}
                </button>
              </div>

              <div className="mt-2 text-xs text-gray-600">
                <strong>3場一括取得:</strong> 戸田・住之江・尼崎のデータを順次取得します（約3分）
              </div>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-red-500 text-xl mr-2">❌</span>
                  <div>
                    <h3 className="font-medium text-red-800">エラーが発生しました</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 一括取得エラー表示 */}
            {batchError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-red-500 text-xl mr-2">❌</span>
                  <div>
                    <h3 className="font-medium text-red-800">一括取得でエラーが発生しました</h3>
                    <p className="text-red-700 text-sm mt-1">{batchError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 結果表示 */}
            {result && (
              <div className={`border rounded-lg p-4 ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start">
                  <span className={`text-xl mr-2 ${
                    result.success ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {result.success ? '✅' : '⚠️'}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {result.success ? 'データ取得完了' : 'データ取得完了（一部エラー）'}
                    </h3>

                    <div className="mt-2 text-sm space-y-1">
                      <div><strong>日付:</strong> {result.date}</div>
                      <div><strong>会場:</strong> {getVenueName(result.venue)} (#{result.venue})</div>
                      <div><strong>取得件数:</strong> {result.data_fetched}件</div>
                      <div><strong>DB保存:</strong> {result.records_inserted}件</div>
                      <div><strong>更新:</strong> {result.records_updated}件</div>
                      <div><strong>API成功:</strong> {result.api_success ? 'Yes' : 'No'}</div>
                      {result.errors && result.errors.length > 0 && (
                        <div><strong>エラー:</strong> {result.errors.join(', ')}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 一括取得結果表示 */}
            {batchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">⚡ 3場一括取得結果</h3>
                {batchResults.map((result, index) => (
                  <div
                    key={result.venue}
                    className={`border rounded-lg p-4 ${
                      result.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className={`text-xl mr-2 ${
                        result.success ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {result.success ? '✅' : '❌'}
                      </span>
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.venueName} (#{result.venue})
                        </h4>

                        {result.success && result.data ? (
                          <div className="mt-2 text-sm space-y-1">
                            <div><strong>日付:</strong> {result.data.date}</div>
                            <div><strong>取得件数:</strong> {result.data.data_fetched}件</div>
                            <div><strong>DB保存:</strong> {result.data.records_inserted}件</div>
                            <div><strong>更新:</strong> {result.data.records_updated}件</div>
                          </div>
                        ) : (
                          <p className="text-red-700 text-sm mt-1">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    <strong>合計:</strong> {batchResults.filter(r => r.success).length}/{batchResults.length}会場成功
                  </div>
                </div>
              </div>
            )}

            {/* 説明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">💡 使用方法</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>単一会場取得:</strong> 選択した競艇場のデータを取得</li>
                <li>• <strong>3場一括取得:</strong> 戸田・住之江・尼崎のデータを順次取得（約3分）</li>
                <li>• 取得したデータはresultテーブルに自動保存されます</li>
                <li>• 既存データがある場合は上書き更新されます</li>
                <li>• 日付を指定しない場合は前日のデータを取得します</li>
                <li>• API負荷軽減のため、一括取得では会場間に1秒の待機時間があります</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}