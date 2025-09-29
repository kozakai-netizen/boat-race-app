'use client'

import { useState } from 'react'
import HamburgerMenu from '@/components/HamburgerMenu'
import {
  fetchProgramsApiData,
  analyzeExperimentData,
  generateDateRange,
  formatExperimentReport,
  type ExperimentDataPoint,
  type ExperimentSummary
} from '@/lib/experiment/programsApiExperiment'
import { getTestTargetStadiums } from '@/lib/data/stadiumMapping'

export default function ProgramsApiExperimentPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentDay, setCurrentDay] = useState(0)
  const [totalDays, setTotalDays] = useState(7)
  const [dataPoints, setDataPoints] = useState<ExperimentDataPoint[]>([])
  const [summary, setSummary] = useState<ExperimentSummary | null>(null)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const runExperiment = async () => {
    setIsRunning(true)
    setError('')
    setProgress('')
    setDataPoints([])
    setSummary(null)
    setCurrentDay(0)

    try {
      // 過去7日間のデータを取得
      const today = new Date()
      const startDate = new Date(today)
      startDate.setDate(today.getDate() - totalDays + 1)

      const dates = generateDateRange(startDate.toISOString().split('T')[0], totalDays)
      const newDataPoints: ExperimentDataPoint[] = []

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i]
        setCurrentDay(i + 1)
        setProgress(`${date}のデータを取得中...`)

        try {
          const dataPoint = await fetchProgramsApiData(date)
          newDataPoints.push(dataPoint)
          setDataPoints([...newDataPoints])

          if (dataPoint.error) {
            console.warn(`Failed to fetch data for ${date}: ${dataPoint.error}`)
          } else {
            console.log(`Successfully fetched data for ${date}: ${dataPoint.stadiums.length} stadiums`)
          }

          // API負荷軽減のため1秒待機
          if (i < dates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (dayError) {
          console.error(`Error fetching ${date}:`, dayError)
          newDataPoints.push({
            date,
            timestamp: new Date().toISOString(),
            stadiums: [],
            error: dayError instanceof Error ? dayError.message : 'Unknown error'
          })
        }
      }

      // 分析実行
      setProgress('データを分析中...')
      const analysisResult = analyzeExperimentData(newDataPoints)
      setSummary(analysisResult)
      setProgress('実験完了！')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Experiment failed')
    } finally {
      setIsRunning(false)
    }
  }

  const testTargets = getTestTargetStadiums()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <HamburgerMenu
        showBackButton={true}
        pageTitle="Programs API実証実験"
      />

      <div className="pt-20 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              🧪 Programs API実証実験
            </h1>

            {/* 実験概要 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-2">📋 実験目的</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Programs APIの会場番号マッピングを確認</li>
                <li>• データ取得の安定性を検証（{totalDays}日間）</li>
                <li>• 選手データの品質評価</li>
                <li>• 実装可能性の判定</li>
              </ul>
            </div>

            {/* 対象会場 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-yellow-800 mb-2">🎯 実証対象会場</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {testTargets.map(stadium => (
                  <div key={stadium.id} className="flex items-center space-x-2">
                    <span className="text-yellow-700">{stadium.name}</span>
                    {stadium.programsApiId && (
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded text-xs">
                        API#{stadium.programsApiId}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 実験実行 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">🚀 実験実行</h3>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">期間:</label>
                  <select
                    value={totalDays}
                    onChange={(e) => setTotalDays(Number(e.target.value))}
                    disabled={isRunning}
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={3}>3日間</option>
                    <option value={7}>7日間</option>
                    <option value={14}>14日間</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={runExperiment}
                  disabled={isRunning}
                  className={`px-6 py-3 rounded font-medium text-white transition ${
                    isRunning
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isRunning ? '🔄 実験実行中...' : '🧪 実験開始'}
                </button>
              </div>

              {/* 進捗表示 */}
              {isRunning && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <div className="text-sm text-blue-800">
                      {progress} ({currentDay}/{totalDays})
                    </div>
                  </div>
                  <div className="mt-2 bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentDay / totalDays) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <span className="text-red-500 text-xl mr-2">❌</span>
                  <div>
                    <h3 className="font-medium text-red-800">実験エラー</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* データ収集状況 */}
            {dataPoints.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 データ収集状況</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dataPoints.map((point) => (
                    <div
                      key={point.date}
                      className={`border rounded p-3 text-sm ${
                        point.error
                          ? 'bg-red-50 border-red-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="font-medium">
                        {point.date}
                        <span className={`ml-2 text-xs ${
                          point.error ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {point.error ? '❌' : '✅'}
                        </span>
                      </div>
                      {point.error ? (
                        <div className="text-red-700 text-xs mt-1">{point.error}</div>
                      ) : (
                        <div className="text-green-700 text-xs mt-1">
                          {point.stadiums.length}会場のデータ取得
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 分析結果 */}
            {summary && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">📈 実験結果サマリー</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summary.totalDaysCollected}
                      </div>
                      <div className="text-sm text-green-700">データ収集成功日数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.keys(summary.stadiumMapping).length}
                      </div>
                      <div className="text-sm text-green-700">検出された会場数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(summary.dataQuality.racerDataCompleteness * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-green-700">選手データ完全性</div>
                    </div>
                  </div>

                  {/* 会場マッピング */}
                  <div className="mb-4">
                    <h4 className="font-medium text-green-800 mb-2">🏟️ 検出された会場</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(summary.stadiumMapping).map(([stadiumId, info]) => (
                        <div key={stadiumId} className="bg-white rounded p-2 text-sm">
                          <span className="font-medium">Stadium {stadiumId}: {info.confirmedName}</span>
                          <div className="text-xs text-gray-600">
                            {info.appearanceDays}日出現 · {info.totalRaces}レース
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 推奨事項 */}
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">💡 推奨事項</h4>
                    <ul className="space-y-1">
                      {summary.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-green-700 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 詳細レポート */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 詳細レポート</h3>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white rounded p-3 overflow-auto max-h-96">
                    {formatExperimentReport(summary)}
                  </pre>
                </div>
              </div>
            )}

            {/* 使用方法説明 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-medium text-blue-800 mb-2">💡 使用方法</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>実験開始</strong>: 過去{totalDays}日間のPrograms APIデータを順次取得</li>
                <li>• <strong>安全な実行</strong>: API負荷軽減のため1秒間隔で実行</li>
                <li>• <strong>結果分析</strong>: 会場マッピング・データ品質を自動評価</li>
                <li>• <strong>次のステップ</strong>: 結果に基づき実装可否を判定</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}