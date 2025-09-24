'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ResultsResponse } from '@/lib/types'
import { HIT_ICONS } from '@/lib/constants'
import ResultCard from '@/components/ResultCard'

function ResultsPageContent() {
  const searchParams = useSearchParams()
  const [resultsData, setResultsData] = useState<ResultsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchResultsData()
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResultsData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/results/suminoye?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setResultsData(data)
      } else {
        console.error('Failed to fetch results data')
        setResultsData(null)
      }
    } catch (error) {
      console.error('Error fetching results data:', error)
      setResultsData(null)
    } finally {
      setLoading(false)
    }
  }


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
                <h1 className="text-2xl font-bold text-gray-800">レース結果</h1>
                <p className="text-gray-600">{date} 住之江ボートレース</p>
              </div>
            </div>

            <button
              onClick={fetchResultsData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
            >
              🔄 更新
            </button>
          </div>

          {/* 成績サマリー */}
          {resultsData && resultsData.results.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {Object.entries(HIT_ICONS).map(([type, icon]) => {
                  const count = resultsData.results.filter(r => r.hit === type).length
                  return (
                    <div key={type} className="flex items-center justify-center space-x-2">
                      <span className="text-lg">{icon}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        )}

        {resultsData && !loading && (
          <div className="space-y-4">
            {resultsData.results.length > 0 ? (
              resultsData.results.map((result) => (
                <ResultCard key={result.race_id} result={result} />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>選択した日付の結果データが見つかりませんでした</p>
              </div>
            )}
          </div>
        )}

        {!resultsData && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-gray-500">データが見つかりませんでした</div>
            <p className="text-sm text-gray-400 mt-2">
              選択した日付のレース結果がありません
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4"><div className="bg-white rounded-lg shadow-lg p-6 text-center"><div className="text-gray-500">読み込み中...</div></div></div>}>
      <ResultsPageContent />
    </Suspense>
  )
}