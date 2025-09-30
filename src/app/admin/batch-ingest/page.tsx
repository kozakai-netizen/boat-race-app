'use client'

import { useState } from 'react'

export default function BatchIngestPage() {
  const [startDate, setStartDate] = useState('2025-09-01')
  const [endDate, setEndDate] = useState('2025-09-29')
  const [venueId, setVenueId] = useState(12) // 住之江
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [progress, setProgress] = useState<string>('')

  const handleBatchIngest = async () => {
    if (!confirm(`${startDate}から${endDate}まで、会場${venueId}のデータを取得しますか？`)) {
      return
    }

    setIsLoading(true)
    setResults(null)
    setProgress('取得開始...')

    try {
      const response = await fetch('/api/batch-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          venueId,
          adminToken: process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'boat_admin_2025'
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.summary)
        setProgress('完了！')
      } else {
        setProgress(`エラー: ${data.error}`)
      }

    } catch (error) {
      setProgress(`取得エラー: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          📚 過去データ遡及取得
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">取得設定</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                競艇場
              </label>
              <select
                value={venueId}
                onChange={(e) => setVenueId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value={1}>桐生</option>
                <option value={2}>戸田</option>
                <option value={11}>びわこ</option>
                <option value={12}>住之江</option>
                <option value={13}>尼崎</option>
                <option value={22}>福岡</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleBatchIngest}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? '取得中...' : '遡及取得開始'}
          </button>

          {progress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">{progress}</p>
            </div>
          )}
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">取得結果</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {results.totalDays}
                </div>
                <div className="text-sm text-blue-700">処理日数</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {results.successDays}
                </div>
                <div className="text-sm text-green-700">成功日数</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {results.totalRaces}
                </div>
                <div className="text-sm text-purple-700">総レース数</div>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {results.errorDays}
                </div>
                <div className="text-sm text-red-700">エラー日数</div>
              </div>
            </div>

            {results.results && results.results.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left">日付</th>
                      <th className="px-4 py-2 text-left">レース数</th>
                      <th className="px-4 py-2 text-left">新規追加</th>
                      <th className="px-4 py-2 text-left">更新</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.slice(0, 10).map((result: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{result.date}</td>
                        <td className="px-4 py-2">{result.racesFound}</td>
                        <td className="px-4 py-2">{result.inserted}</td>
                        <td className="px-4 py-2">{result.updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.results.length > 10 && (
                  <p className="text-sm text-gray-600 mt-2">
                    ...他{results.results.length - 10}日分
                  </p>
                )}
              </div>
            )}

            {results.errors && results.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-red-600 mb-2">エラー詳細</h3>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  {results.errors.slice(0, 5).map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-700">
                      {error.date}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}