'use client'

import { useState } from 'react'
import RealResults from '@/components/RealResults'
import HamburgerMenu from '@/components/HamburgerMenu'

export default function ResultsPage() {
  const [selectedDate, setSelectedDate] = useState('2025-07-15')
  const [selectedVenue, setSelectedVenue] = useState<number | null>(1) // 桐生
  const [showLegend, setShowLegend] = useState(false)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu
        onLegendClick={() => setShowLegend(!showLegend)}
        pageTitle="結果表示"
        showBackButton={true}
      />

      <div className="p-4 pt-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800">
                📊 レース結果データ
              </h1>
              <div className="text-sm text-gray-600">
                Phase 2 - リアルデータ表示
              </div>
            </div>

            {/* フィルタ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏟️ 競艇場
                </label>
                <select
                  value={selectedVenue || ''}
                  onChange={(e) => setSelectedVenue(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">全ての競艇場</option>
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

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedDate('')
                    setSelectedVenue(null)
                  }}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                >
                  🔄 フィルタクリア
                </button>
              </div>
            </div>

            {/* 現在の条件表示 */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>表示条件:</strong>
                {selectedDate && ` 日付=${selectedDate}`}
                {selectedVenue && ` 会場=${getVenueName(selectedVenue)}`}
                {!selectedDate && !selectedVenue && ' 全データ'}
              </div>
            </div>
          </div>

          {/* 結果表示 */}
          <div className="bg-white rounded-lg shadow-card p-6">
            <RealResults
              date={selectedDate || undefined}
              venue={selectedVenue || undefined}
              limit={50}
            />
          </div>

          {/* 凡例 */}
          {showLegend && (
            <div className="bg-white rounded-lg shadow-card p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📖 凡例</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">表示項目</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>3連単</strong>: 1着-2着-3着の組み合わせ</li>
                    <li>• <strong>払戻金</strong>: 100円あたりの配当</li>
                    <li>• <strong>人気</strong>: オッズ順位</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">データソース</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• <strong>Boatrace Open API</strong></li>
                    <li>• <strong>Supabase</strong> データベース</li>
                    <li>• <strong>リアルタイム更新</strong> (手動取得)</li>
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