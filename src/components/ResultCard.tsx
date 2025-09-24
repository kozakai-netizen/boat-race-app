'use client'

import { useState } from 'react'
import { HIT_ICONS } from '@/lib/constants'
import { parseRaceId, getVenueDisplayName } from '@/lib/raceId'
import Link from 'next/link'

interface Result {
  race_id: string
  triple: string
  payout: number | null
  popularity: number | null
  hit: 'win' | 'inTop' | 'miss' | 'ref'
}

interface ResultCardProps {
  result: Result
  expanded?: boolean
}

export default function ResultCard({ result, expanded = false }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)

  const raceInfo = parseRaceId(result.race_id)

  const getHitStatusColor = () => {
    switch (result.hit) {
      case 'win':
        return 'border-green-500 bg-green-50'
      case 'inTop':
        return 'border-blue-500 bg-blue-50'
      case 'miss':
        return 'border-red-500 bg-red-50'
      case 'ref':
        return 'border-gray-500 bg-gray-50'
      default:
        return 'border-gray-300 bg-white'
    }
  }

  const getHitStatusText = () => {
    switch (result.hit) {
      case 'win': return '予想的中'
      case 'inTop': return 'TOP5内'
      case 'miss': return '予想外れ'
      case 'ref': return '予想なし'
      default: return '不明'
    }
  }

  const formatPayout = (payout: number | null) => {
    if (!payout) return '--円'
    return payout.toLocaleString() + '円'
  }

  return (
    <div className={`rounded-lg border-2 p-4 transition-all ${getHitStatusColor()}`}>
      <div className="flex items-center justify-between">
        {/* 左側：レース基本情報 */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
              {raceInfo.raceNo.replace('R', '')}
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {getVenueDisplayName(raceInfo.venue)} {raceInfo.raceNo}
              </div>
              <div className="text-xs text-gray-600">
                {raceInfo.date}
              </div>
            </div>
          </div>

          {/* 結果 */}
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-gray-800">
              {result.triple}
            </div>
            <div className="text-xs text-gray-600">3連単</div>
          </div>

          {/* 的中状況 */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {HIT_ICONS[result.hit]}
            </span>
            <div>
              <div className="text-sm font-medium text-gray-800">
                {getHitStatusText()}
              </div>
              {result.popularity && (
                <div className="text-xs text-gray-600">
                  {result.popularity}番人気
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側：払戻・アクション */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {formatPayout(result.payout)}
            </div>
            <div className="text-xs text-gray-600">払戻金</div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/race/${result.race_id}`}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
            >
              詳細
            </Link>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition"
            >
              {isExpanded ? '折りたたむ' : '展開'}
            </button>
          </div>
        </div>
      </div>

      {/* 展開コンテンツ */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">レース情報</h4>
              <div className="space-y-1 text-gray-600">
                <div>レースID: {result.race_id}</div>
                <div>会場: {getVenueDisplayName(raceInfo.venue)}</div>
                <div>開催日: {raceInfo.date}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">結果詳細</h4>
              <div className="space-y-1 text-gray-600">
                <div>3連単: {result.triple}</div>
                <div>払戻: {formatPayout(result.payout)}</div>
                <div>人気: {result.popularity ? `${result.popularity}番人気` : 'データなし'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">予想結果</h4>
              <div className="space-y-1">
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${
                  result.hit === 'win'
                    ? 'bg-green-100 text-green-800'
                    : result.hit === 'inTop'
                    ? 'bg-blue-100 text-blue-800'
                    : result.hit === 'miss'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <span>{HIT_ICONS[result.hit]}</span>
                  <span>{getHitStatusText()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}