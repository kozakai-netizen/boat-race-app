'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RaceListItem as RaceListItemType, Forecast, ForecastTriple } from '@/lib/types'
import {
  ClockIcon,
  RocketLaunchIcon,
  BoltIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

interface ImprovedRaceCardProps {
  race: RaceListItemType
  forecast?: Forecast
  isLoading?: boolean
}

const IconWithTooltip = ({ icon, tooltip }: { icon: React.ReactNode, tooltip: string }) => (
  <div className="relative group">
    <div className="text-ink-3 hover:text-brand transition-colors">
      {icon}
    </div>
    {/* モバイル対応: ツールチップの代わりに小さな文字を下に表示 */}
    <div className="hidden sm:block absolute bottom-full mb-2 w-max px-2 py-1 text-xs text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      {tooltip}
    </div>
    <div className="sm:hidden text-[10px] text-ink-4 text-center mt-0.5">
      {tooltip}
    </div>
  </div>
)

const PredictionBadge = ({ triple, isMain = false }: { triple: ForecastTriple, isMain?: boolean }) => {
  if (isMain) {
    return (
      <div className="bg-brand-soft border-2 border-brand rounded-lg px-4 py-3">
        <div className="text-2xl font-black text-brand tracking-wider font-mono text-center">
          {triple.combo}
        </div>
        <div className="flex items-center justify-center space-x-3 mt-1">
          <span className="text-sm font-bold text-ink-2">
            {typeof triple.odds === 'number' ? triple.odds.toFixed(1) : triple.odds}倍
          </span>
          <span className="text-sm font-semibold text-ink-3">
            {(triple.prob * 100).toFixed(1)}%
          </span>
          {triple.super && (
            <span className="bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded text-xs font-bold">
              SUPER
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 border border-ink-line rounded-md p-2.5 flex justify-between items-center hover:border-brand transition-colors">
      <span className="font-mono font-bold text-ink-2">{triple.combo}</span>
      <div className="text-right">
        <div className="text-xs font-semibold text-ink-2">
          {typeof triple.odds === 'number' ? triple.odds.toFixed(1) : triple.odds}倍
        </div>
        <div className="text-xs text-ink-3">{(triple.prob * 100).toFixed(1)}%</div>
      </div>
    </div>
  )
}

export default function ImprovedRaceCard({ race, forecast, isLoading }: ImprovedRaceCardProps) {
  const [showAllPredictions, setShowAllPredictions] = useState(false)

  // レース時間のフォーマット
  const formatTime = (closeAt: string) => {
    const date = new Date(closeAt)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // ステータスの判定
  const getStatus = () => {
    const now = new Date()
    const closeTime = new Date(race.close_at)
    return closeTime > now ? '発売中' : '締切'
  }

  // アイコンの生成
  const getRationaleIcons = (): React.ReactElement[] => {
    const icons: React.ReactElement[] = []
    if (race.icons.includes('🚀')) {
      icons.push(<IconWithTooltip key="speed" icon={<RocketLaunchIcon className="w-5 h-5" />} tooltip="スピード" />)
    }
    if (race.icons.includes('💨')) {
      icons.push(<IconWithTooltip key="power" icon={<BoltIcon className="w-5 h-5" />} tooltip="パワー" />)
    }
    if (race.icons.includes('⚡')) {
      icons.push(<IconWithTooltip key="tech" icon={<BoltIcon className="w-5 h-5" />} tooltip="テクニック" />)
    }
    return icons
  }

  const status = getStatus()
  const topPrediction = forecast?.triples[0]
  const secondaryPredictions = forecast?.triples.slice(1, showAllPredictions ? undefined : 3) || []
  const remainingCount = forecast ? Math.max(0, forecast.triples.length - 4) : 0

  return (
    <div className="bg-surface-1 rounded-lg shadow-card border border-ink-line p-4 transition-all duration-300 hover:shadow-hover hover:border-brand">
      <div className="flex justify-between items-start mb-4">
        {/* 左側: レース情報 */}
        <div className="flex flex-col items-start space-y-2">
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-5 h-5 text-ink-3" />
            <span className="text-xl font-bold text-ink-1">{formatTime(race.close_at)}</span>
            <span className="text-sm text-ink-3">{race.race_number}R</span>
          </div>
          <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
            status === '発売中'
              ? 'text-green-700 bg-green-100'
              : 'text-gray-700 bg-gray-100'
          }`}>
            {status}
          </span>
          <h3 className="text-sm font-medium text-ink-2 line-clamp-2">{race.title}</h3>
        </div>

        {/* 右側: メイン予想 */}
        {topPrediction && (
          <div className="flex flex-col items-end">
            <span className="text-xs text-ink-3 mb-1">本命予想</span>
            <PredictionBadge triple={topPrediction} isMain />
          </div>
        )}
      </div>

      {/* 中段: 根拠とアイコン */}
      {forecast && (
        <div className="flex justify-between items-center bg-surface-2 rounded-md px-3 py-2 mb-4">
          <div className="flex-1">
            <span className="text-sm font-medium text-ink-2">
              {race.has_super ? 'スーパー戦略の狙い目' : 'バランス型の複合優位'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {getRationaleIcons()}
          </div>
        </div>
      )}

      {/* 下段: セカンダリ予想 */}
      {secondaryPredictions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-ink-3">対抗・穴予想</span>
            {remainingCount > 0 && (
              <button
                onClick={() => setShowAllPredictions(!showAllPredictions)}
                className="flex items-center text-xs text-brand hover:text-brand-soft transition-colors"
              >
                {showAllPredictions ? (
                  <>
                    <span>閉じる</span>
                    <ChevronUpIcon className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>他{remainingCount}件</span>
                    <ChevronDownIcon className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {secondaryPredictions.map((prediction, index) => (
              <PredictionBadge key={`${prediction.combo}-${index}`} triple={prediction} />
            ))}
          </div>
        </div>
      )}

      {/* ローディング状態 */}
      {isLoading && (
        <div className="text-center py-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-brand"></div>
          <span className="text-xs text-ink-3 ml-2">予想を計算中...</span>
        </div>
      )}

      {/* 詳細リンク */}
      <div className="mt-4 pt-3 border-t border-ink-line">
        <Link
          href={`/race/${race.race_id}`}
          className="text-sm text-brand hover:text-brand-soft font-medium transition-colors"
        >
          詳細を見る →
        </Link>
      </div>
    </div>
  )
}