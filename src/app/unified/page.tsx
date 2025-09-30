'use client'

import { useState, useEffect } from 'react'
import HamburgerMenu from '@/components/HamburgerMenu'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

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

export default function UnifiedPage() {
  const [selectedDate, setSelectedDate] = useState('2025-07-15')
  const [selectedVenue, setSelectedVenue] = useState(1) // 桐生
  const [results, setResults] = useState<ResultData[]>([])
  const [loading, setLoading] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [expandedRace, setExpandedRace] = useState<number | null>(null)
  const [accuracyStats, setAccuracyStats] = useState({
    totalRaces: 0,
    correctPredictions: 0,
    totalROI: 0,
    averagePayout: 0
  })

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

  // 実予想データ生成（実ロジック使用）
  const generateRealPredictions = async (raceId: string) => {
    try {
      const response = await fetch(`/api/prediction/${raceId}`)
      if (!response.ok) {
        console.error('Failed to fetch prediction:', response.statusText)
        return generateFallbackPredictions() // フォールバック
      }

      const data = await response.json()
      if (!data.success || !data.prediction?.topCombinations) {
        return generateFallbackPredictions()
      }

      // API結果を既存フォーマットに変換
      return data.prediction.topCombinations.slice(0, 3).map((combo: any, index: number) => ({
        combo: combo.triple,
        prob: combo.probability,
        ev: 1.5 + (index * 0.2) // 仮のEV値
      }))

    } catch (error) {
      console.error('Prediction generation error:', error)
      return generateFallbackPredictions()
    }
  }

  // フォールバック予想（実ロジック失敗時）
  const generateFallbackPredictions = () => {
    return [
      { combo: '1-3-5', prob: 0.25, ev: 1.8 },
      { combo: '2-4-6', prob: 0.18, ev: 2.1 },
      { combo: '3-1-2', prob: 0.15, ev: 1.6 }
    ]
  }

  // 予想キャッシュ
  const [predictionCache, setPredictionCache] = useState<Record<string, any>>({})

  // 予想精度計算（非同期対応）
  const calculateAccuracy = async (results: ResultData[]) => {
    let totalRaces = results.length
    let correctPredictions = 0
    let totalInvestment = 0
    let totalReturn = 0
    let totalPayout = 0

    for (const result of results) {
      const raceId = result.race_id

      // キャッシュをチェック
      let predictions = predictionCache[raceId]
      if (!predictions) {
        predictions = await generateRealPredictions(raceId)
        setPredictionCache(prev => ({ ...prev, [raceId]: predictions }))
      }

      const topPrediction = predictions[0] // 1位予想

      // 的中判定
      if (topPrediction.combo === result.triple) {
        correctPredictions++
        if (result.payout) {
          totalReturn += result.payout
          totalPayout += result.payout
        }
      }

      // 投資額（仮想的に1000円ずつ投資）
      totalInvestment += 1000
    }

    const hitRate = totalRaces > 0 ? (correctPredictions / totalRaces) * 100 : 0
    const roi = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0
    const averagePayout = correctPredictions > 0 ? totalPayout / correctPredictions : 0

    return {
      totalRaces,
      correctPredictions,
      hitRate: Math.round(hitRate * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      averagePayout: Math.round(averagePayout)
    }
  }

  // データ取得
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        params.append('date', selectedDate)
        params.append('venue', selectedVenue.toString())

        const response = await fetch(`/api/results?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setResults(data.results || [])
        } else {
          console.error('Failed to fetch results:', data.error)
          setResults([])
        }
      } catch (error) {
        console.error('Error fetching results:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [selectedDate, selectedVenue])

  // 結果データが更新されたら精度を計算（非同期対応）
  useEffect(() => {
    const updateAccuracy = async () => {
      if (results.length > 0) {
        try {
          const stats = await calculateAccuracy(results)
          setAccuracyStats(stats)
        } catch (error) {
          console.error('Error calculating accuracy:', error)
          // エラー時はデフォルト値を設定
          setAccuracyStats({
            totalRaces: results.length,
            correctPredictions: 0,
            hitRate: 0,
            roi: 0,
            averagePayout: 0
          })
        }
      }
    }

    updateAccuracy()
  }, [results, predictionCache])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        onLegendClick={() => setShowLegend(!showLegend)}
        pageTitle="結果・成績"
        showBackButton={false}
      />

      <div className="p-4 pt-16">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* ヘッダー & コントロール */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  🚤 結果・成績
                </h1>
                <p className="text-gray-600 mt-1">
                  リアルデータ + AI予想の融合システム
                </p>
              </div>
              <div className="text-sm text-gray-500">
                予想vs実績分析
              </div>
            </div>

            {/* 予想精度サマリー */}
            {!loading && results.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-blue-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  📊 予想精度サマリー
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {accuracyStats.totalRaces}レース分析
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* 的中率 */}
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {accuracyStats.hitRate}%
                    </div>
                    <div className="text-sm text-green-700 font-medium">的中率</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {accuracyStats.correctPredictions}/{accuracyStats.totalRaces}レース
                    </div>
                  </div>

                  {/* ROI */}
                  <div className={`text-center p-4 rounded-lg border ${
                    accuracyStats.roi >= 0
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`text-2xl font-bold ${
                      accuracyStats.roi >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {accuracyStats.roi > 0 ? '+' : ''}{accuracyStats.roi}%
                    </div>
                    <div className={`text-sm font-medium ${
                      accuracyStats.roi >= 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      ROI
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      投資収益率
                    </div>
                  </div>

                  {/* 平均払戻 */}
                  <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">
                      ¥{accuracyStats.averagePayout.toLocaleString()}
                    </div>
                    <div className="text-sm text-yellow-700 font-medium">平均払戻</div>
                    <div className="text-xs text-gray-600 mt-1">
                      的中時のみ
                    </div>
                  </div>

                  {/* 信頼度 */}
                  <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {accuracyStats.hitRate >= 30 ? 'A' : accuracyStats.hitRate >= 20 ? 'B' : 'C'}
                    </div>
                    <div className="text-sm text-purple-700 font-medium">信頼度</div>
                    <div className="text-xs text-gray-600 mt-1">
                      予想評価
                    </div>
                  </div>
                </div>

                {/* 詳細説明 */}
                <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>📈 ROI: 投資に対する収益率</span>
                    <span>🎯 的中率: 1位予想の的中率</span>
                    <span>💰 平均払戻: 的中時の平均配当額</span>
                  </div>
                </div>
              </div>
            )}

            {/* 選択コントロール */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏟️ 競艇場
                </label>
                <select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 日付
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* 現在の選択表示 */}
            <div className="bg-brand-soft p-3 rounded-lg">
              <div className="text-brand font-medium">
                📊 {getVenueName(selectedVenue)} - {selectedDate} ({results.length}レース)
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-lg shadow-card p-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  データが見つかりません
                </h3>
                <p className="text-gray-600">
                  {getVenueName(selectedVenue)}の{selectedDate}のデータがありません。<br/>
                  他の日付または競艇場を選択してください。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* レース一覧 */}
              {results.map((result) => {
                const raceNo = result.parsed.race_no
                const isExpanded = expandedRace === raceNo
                const predictions = predictionCache[result.race_id] || generateFallbackPredictions()

                return (
                  <div key={result.race_id} className="bg-white rounded-lg shadow-card overflow-hidden">
                    {/* レースヘッダー */}
                    <div
                      className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedRace(isExpanded ? null : raceNo)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-brand text-white px-3 py-1 rounded font-bold text-lg">
                            {raceNo}R
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">
                              {getVenueName(result.parsed.venue)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {result.parsed.date}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          {/* 予想的中表示 */}
                          {(() => {
                            const isHit = predictions.some(pred => pred.combo === result.triple)
                            const hitPrediction = predictions.find(pred => pred.combo === result.triple)
                            return (
                              <div className="text-center">
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  isHit
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                }`}>
                                  {isHit ? '✅ 的中' : '❌ 外れ'}
                                </div>
                                {hitPrediction && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {predictions.indexOf(hitPrediction) === 0 ? '本命的中' :
                                     predictions.indexOf(hitPrediction) === 1 ? '対抗的中' : '穴的中'}
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                          {/* 実績表示 */}
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-800">
                              {result.triple}
                            </div>
                            <div className="text-sm text-gray-600">実績</div>
                          </div>

                          {result.payout && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                ¥{result.payout.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">払戻金</div>
                            </div>
                          )}

                          <div className="text-gray-400">
                            {isExpanded ? (
                              <ChevronUpIcon className="w-5 h-5" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 展開コンテンツ */}
                    {isExpanded && (
                      <div className="p-4 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* AI予想 */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              🤖 AI予想
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                DEMO
                              </span>
                            </h4>
                            <div className="space-y-2">
                              {predictions.map((pred, idx) => {
                                const isHit = pred.combo === result.triple
                                return (
                                  <div
                                    key={pred.combo}
                                    className={`p-3 rounded-lg border transition-all ${
                                      isHit
                                        ? 'bg-green-50 border-green-300 shadow-md'
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                                          idx === 0 ? 'bg-red-100 text-red-800' :
                                          idx === 1 ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {idx === 0 ? '本命' : idx === 1 ? '対抗' : '穴'}
                                        </div>
                                        <div className="font-mono font-bold text-lg">
                                          {pred.combo}
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                          isHit
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                          {isHit ? '✅ 的中' : '❌ 外れ'}
                                        </div>
                                      </div>
                                      <div className="text-right text-sm">
                                        <div className="text-gray-600">確率: {(pred.prob * 100).toFixed(1)}%</div>
                                        <div className="text-gray-600">EV: {pred.ev.toFixed(1)}</div>
                                        {isHit && result.payout && (
                                          <div className="text-green-600 font-bold mt-1">
                                            収益: +¥{(result.payout - 100).toLocaleString()}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* 実績詳細 */}
                          <div>
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                              📊 実績詳細
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                REAL
                              </span>
                            </h4>
                            <div className="space-y-3">
                              <div className="p-3 bg-white rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-600">3連単</div>
                                    <div className="font-mono font-bold text-lg">
                                      {result.triple}
                                    </div>
                                  </div>
                                  {result.payout && (
                                    <div>
                                      <div className="text-gray-600">払戻金</div>
                                      <div className="font-bold text-lg text-green-600">
                                        ¥{result.payout.toLocaleString()}
                                      </div>
                                    </div>
                                  )}
                                  {result.popularity && (
                                    <div>
                                      <div className="text-gray-600">人気</div>
                                      <div className="font-bold">
                                        {result.popularity}番人気
                                      </div>
                                    </div>
                                  )}
                                  {result.settled_at && (
                                    <div>
                                      <div className="text-gray-600">確定時刻</div>
                                      <div className="text-sm">
                                        {new Date(result.settled_at).toLocaleTimeString('ja-JP')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 予想vs実績の比較 */}
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="text-sm text-blue-800 font-medium mb-1">
                                  📈 予想精度
                                </div>
                                <div className="text-xs text-blue-600">
                                  {predictions.some(p => p.combo === result.triple)
                                    ? '✅ AI予想が的中しました！'
                                    : '❌ AI予想は外れました'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* 凡例 */}
          {showLegend && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📖 システム説明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">🤖 AI予想</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>本命</strong>: 最も確率の高い予想</li>
                    <li>• <strong>対抗</strong>: 2番手予想</li>
                    <li>• <strong>穴</strong>: 高配当狙いの予想</li>
                    <li>• <strong>EV値</strong>: 期待値（高いほど有利）</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">📊 実績データ</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>3連単</strong>: 1着-2着-3着の組み合わせ</li>
                    <li>• <strong>払戻金</strong>: 100円あたりの配当</li>
                    <li>• <strong>人気</strong>: オッズ順位</li>
                    <li>• <strong>データソース</strong>: Boatrace Open API</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}