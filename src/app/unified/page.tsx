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

  // デモ予想データ生成
  const generateMockPredictions = (raceNo: number) => {
    const predictions = [
      { combo: '1-3-5', prob: 0.25, ev: 1.8 },
      { combo: '2-4-6', prob: 0.18, ev: 2.1 },
      { combo: '3-1-2', prob: 0.15, ev: 1.6 }
    ]
    return predictions
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
                const predictions = generateMockPredictions(raceNo)

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
                              {predictions.map((pred, idx) => (
                                <div
                                  key={pred.combo}
                                  className={`p-3 rounded-lg border ${
                                    pred.combo === result.triple
                                      ? 'bg-green-100 border-green-300'
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
                                      <div className="font-mono font-bold">
                                        {pred.combo}
                                      </div>
                                      {pred.combo === result.triple && (
                                        <div className="text-green-600 font-bold text-sm">
                                          ✅ 的中
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right text-sm">
                                      <div>確率: {(pred.prob * 100).toFixed(1)}%</div>
                                      <div>EV: {pred.ev.toFixed(1)}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
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