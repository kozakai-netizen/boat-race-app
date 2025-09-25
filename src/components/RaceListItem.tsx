import { useState, useMemo, memo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { RaceListItem as RaceListItemType } from '@/lib/types'
import EntryRow from './EntryRow'
import { Num } from '@/components/ui/Num'

interface RaceListItemProps {
  race: RaceListItemType
  isOpen: boolean
  onToggle: () => void
}

interface RaceEntriesResponse {
  entries: Array<{
    lane: number
    player_name: string
    player_grade: string
    st_time: number
    exhibition_time: number
    motor_rate: number
    motor_condition: string
    motor_description: string
    // API側で計算済みのデータ
    motor_badge: {
      grade: '◎' | '○' | '△'
      color: string
      tooltip: string
    }
    grade_badge_color: string
    st_color: string
    exhibition_color: string
    two_rate: number
    three_rate: number
    // 外部リンクと画像用（データ取り込み用）
    photo_path?: string
    external_url?: string
  }>
  why_brief: {
    icons: string[]
    summary: string
  }
}

const RaceListItem = memo(function RaceListItem({ race, isOpen, onToggle }: RaceListItemProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [entriesData, setEntriesData] = useState<RaceEntriesResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const raceItemRef = useRef<HTMLDivElement>(null)

  // 重い計算をuseMemoでキャッシュ
  const computedValues = useMemo(() => {
    const formatCloseTime = (closeAt: string) => {
      const date = new Date(closeAt)
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const isRaceOpen = (closeAt: string) => {
      const now = new Date()
      const closeTime = new Date(closeAt)
      return now < closeTime
    }

    const raceIsOpen = isRaceOpen(race.close_at)

    return {
      closeTime: formatCloseTime(race.close_at),
      raceIsOpen
    }
  }, [race.close_at])

  // エントリーデータの取得
  useEffect(() => {
    if (isOpen && !entriesData && !isLoading) {
      fetchEntriesData()
    }
  }, [isOpen, entriesData, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // 展開時の自動スクロール
  useEffect(() => {
    if (isOpen && raceItemRef.current) {
      // 少し遅延をかけて、展開アニメーションが始まってからスクロール
      setTimeout(() => {
        raceItemRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 150)
    }
  }, [isOpen])

  const fetchEntriesData = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      const response = await fetch(`/api/race-entries?raceId=${race.race_id}`)

      if (!response.ok) {
        throw new Error('エントリーデータの取得に失敗しました')
      }

      const data = await response.json()
      setEntriesData(data)
    } catch (error) {
      console.error('Error fetching entries:', error)
      setFetchError(error instanceof Error ? error.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async () => {
    onToggle()
  }

  const { closeTime, raceIsOpen } = computedValues

  // 初期根拠情報を生成
  const generateInitialReason = (icons: string[]) => {
    if (icons.length === 0) return "通常レース"

    const iconMap: { [key: string]: string } = {
      '🚀': 'スピード',
      '💨': 'パワー',
      '🧱': '安定',
      '⚡': 'テクニック'
    }

    const reasons = icons.map(icon => iconMap[icon]).filter(Boolean)
    if (reasons.length === 0) return "特色レース"

    if (reasons.length === 1) return `${reasons[0]}重視の狙い目`
    if (reasons.length === 2) return `${reasons[0]}・${reasons[1]}の複合優位`
    if (reasons.length >= 3) return `多角的優位（${reasons.length}要素）`

    return "注目レース"
  }

  return (
    <div
      ref={raceItemRef}
      className={`
        transition-all duration-300 relative
        ${isOpen
          ? 'border border-brand shadow-hover bg-surface-1 rounded-xl m-2 z-10'
          : raceIsOpen
            ? 'border-b border-ink-line bg-surface-1 hover:bg-surface-2'
            : 'border-b border-ink-line bg-surface-2 hover:bg-surface-3 opacity-85'
        }
      `}>
      {/* レースヘッダー */}
      <div
        className={`
          p-4 cursor-pointer transition-all duration-300 min-h-[44px] flex items-center
          ${isOpen
            ? 'bg-surface-2 border-l-4 border-l-brand shadow-card'
            : 'hover:bg-surface-2'
          }
          ${!raceIsOpen ? 'opacity-75' : ''}
        `}
        onClick={handleToggle}
      >
        {/* デスクトップ: フレックスレイアウト */}
        <div className="hidden sm:flex items-center justify-between py-1">
          {/* 左側: レース情報 */}
          <div className="flex items-center space-x-4">
            {/* Race Number */}
            <div className={`
              w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center transition-all duration-300 flex-shrink-0
              ${isOpen
                ? 'bg-brand text-white shadow-hover scale-110'
                : 'bg-brand text-white hover:opacity-90'
              }
            `}>
              {race.race_no}
            </div>

            {/* Close Time */}
            <div className="flex-shrink-0">
              <div className="text-sm font-medium text-ink-1">
                {closeTime}
              </div>
              <div className={`text-xs ${raceIsOpen ? 'text-success' : 'text-error'}`}>
                {raceIsOpen ? '発売中' : '締切済'}
              </div>
            </div>

            {/* Super Pick */}
            <div className="flex-shrink-0">
              {race.has_super && (
                <div className="bg-warning-soft text-warning px-2 py-1 rounded-md text-xs font-medium">
                  ⭐
                </div>
              )}
            </div>
          </div>

          {/* 固定位置アイコン - 加点要素として表示 */}
          <div className="flex items-center space-x-1 mx-4">
            <span className={`text-xl transition-all duration-200 ${race.icons.includes('🚀') ? 'opacity-100 scale-110' : 'opacity-30 grayscale'}`}>🚀</span>
            <span className={`text-xl transition-all duration-200 ${race.icons.includes('💨') ? 'opacity-100 scale-110' : 'opacity-30 grayscale'}`}>💨</span>
            <span className={`text-xl transition-all duration-200 ${race.icons.includes('🧱') ? 'opacity-100 scale-110' : 'opacity-30 grayscale'}`}>🧱</span>
            <span className={`text-xl transition-all duration-200 ${race.icons.includes('⚡') ? 'opacity-100 scale-110' : 'opacity-30 grayscale'}`}>⚡</span>
          </div>

          {/* 根拠表示（簡潔版） - 常に表示 */}
          <div className="flex-1 min-w-0">
            {isOpen && isLoading ? (
              <span className="text-sm text-brand bg-brand-soft px-2 py-1 rounded border border-brand">
                分析中...
              </span>
            ) : entriesData?.why_brief ? (
              <span className="text-sm text-ink-1 font-medium bg-warning-soft px-2 py-1 rounded border border-warning truncate">
                {entriesData.why_brief.summary}
              </span>
            ) : (
              <span className="text-sm text-ink-2 bg-surface-2 px-2 py-1 rounded border border-ink-line truncate">
                {generateInitialReason(race.icons)}
              </span>
            )}
          </div>

          {/* 右側: アクション */}
          <div className="flex items-center space-x-3">
            {/* 展示サマリー */}
            <div className="text-xs text-ink-3 text-right">
              {race.exhibition_summary?.left_right_gap_max && (
                <div>左右差: {race.exhibition_summary.left_right_gap_max.toFixed(2)}s</div>
              )}
              {race.exhibition_summary?.outer_inner_gap_min && (
                <div>外内差: {race.exhibition_summary.outer_inner_gap_min.toFixed(2)}s</div>
              )}
            </div>

            {/* 詳細ボタン + 矢印 */}
            <div className="flex items-center space-x-2">
              <Link
                href={`/race/${race.race_id}`}
                className="bg-brand text-white px-3 py-1 rounded-lg text-xs font-medium hover:opacity-90 transition"
                onClick={(e) => e.stopPropagation()}
              >
                詳細
              </Link>
              <div className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                <span className="text-ink-4">▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* モバイル専用シンプルカード */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            {/* 左側: レース番号 + 時刻 */}
            <div className="flex items-center space-x-3">
              <div className={`
                w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center
                ${isOpen ? 'bg-brand text-white shadow-hover scale-110' : 'bg-brand text-white'}
              `}>
                {race.race_no}
              </div>
              <div>
                <div className="text-sm font-medium text-ink-1">{closeTime}</div>
                <div className={`text-xs ${raceIsOpen ? 'text-success' : 'text-error'}`}>
                  {raceIsOpen ? '発売中' : '締切済'}
                </div>
              </div>
            </div>

            {/* 右側: アイコン + 詳細ボタン + 矢印 */}
            <div className="flex items-center space-x-2">
              {/* 固定アイコン表示（モバイル） */}
              <div className="flex items-center space-x-0.5">
                <span className={`text-lg transition-all duration-200 ${race.icons.includes('🚀') ? 'opacity-100 scale-110' : 'opacity-40'}`}>🚀</span>
                <span className={`text-lg transition-all duration-200 ${race.icons.includes('💨') ? 'opacity-100 scale-110' : 'opacity-40'}`}>💨</span>
                <span className={`text-lg transition-all duration-200 ${race.icons.includes('🧱') ? 'opacity-100 scale-110' : 'opacity-40'}`}>🧱</span>
                <span className={`text-lg transition-all duration-200 ${race.icons.includes('⚡') ? 'opacity-100 scale-110' : 'opacity-40'}`}>⚡</span>
              </div>

              {/* 詳細ボタン */}
              <Link
                href={`/race/${race.race_id}`}
                className="bg-brand text-white px-2 py-1 rounded text-xs font-medium hover:opacity-90 transition"
                onClick={(e) => e.stopPropagation()}
              >
                詳細
              </Link>

              {/* 展開矢印 */}
              <div className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                <span className="text-ink-4">▼</span>
              </div>
            </div>
          </div>

          {/* モバイル：推定情報（1行のみ） */}
          <div className="mt-2 flex items-center space-x-2">
            {isOpen && isLoading ? (
              <>
                <span className="text-sm">📊</span>
                <span className="text-xs text-brand font-medium bg-brand-soft px-2 py-1 rounded-md border border-brand flex-1">
                  AI詳細分析中...
                </span>
              </>
            ) : entriesData?.why_brief ? (
              <>
                <div className="flex items-center space-x-1">
                  {entriesData.why_brief.icons.slice(0, 2).map((icon, idx) => (
                    <span key={idx} className="text-sm">{icon}</span>
                  ))}
                </div>
                <span className="text-xs text-ink-1 font-medium truncate bg-warning-soft px-2 py-1 rounded-md border border-warning flex-1">
                  {entriesData.why_brief.summary}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm">🎯</span>
                <span className="text-xs text-ink-2 font-medium bg-surface-2 px-2 py-1 rounded-md border border-ink-line flex-1 truncate">
                  {generateInitialReason(race.icons)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="bg-gradient-to-r from-brand-soft to-surface-2 border-t border-brand animate-in slide-in-from-top-2 duration-300">
          <div className="px-6 py-4 mx-4 bg-surface-1 rounded-lg shadow-hover border border-brand my-4 ml-8 relative">
            {/* 展開インジケーター：より目立つように */}
            <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-gradient-to-b from-brand to-brand rounded-full shadow-md"></div>
            {/* 角の装飾 */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand rounded-full opacity-20"></div>
            {isLoading && (
              <div className="rounded-lg border border-ink-line overflow-hidden">
              {/* ヘッダー */}
              <div className="bg-surface-2 px-4 py-2 border-b border-ink-line">
                <div className="flex items-center space-x-2 text-xs font-medium text-ink-3">
                  <span className="w-8">枠</span>
                  <span className="flex-1">選手情報</span>
                  <span className="w-12 text-center">ST</span>
                  <span className="w-12 text-center">展示</span>
                  <span className="w-8 text-center">機力</span>
                  <span className="w-12 text-center">2連率</span>
                  <span className="w-12 text-center">3連率</span>
                </div>
              </div>

              {/* スケルトンローディング */}
              <div className="divide-y divide-ink-line">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center space-x-2 p-2 animate-pulse">
                    <div className="w-8 h-8 bg-surface-3 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-surface-3 rounded mb-1"></div>
                      <div className="h-3 bg-surface-3 rounded w-3/4"></div>
                    </div>
                    <div className="w-12 h-6 bg-surface-3 rounded"></div>
                    <div className="w-12 h-6 bg-surface-3 rounded"></div>
                    <div className="w-8 h-6 bg-surface-3 rounded"></div>
                    <div className="w-12 h-6 bg-surface-3 rounded"></div>
                    <div className="w-12 h-6 bg-surface-3 rounded"></div>
                  </div>
                ))}
              </div>
              </div>
            )}

            {!isLoading && fetchError && (
              <div className="rounded-lg border border-error-soft p-4 text-center text-error text-sm bg-error-soft">
                {fetchError}
                <button
                  onClick={fetchEntriesData}
                  className="ml-2 text-brand hover:opacity-90 underline"
                >
                  再試行
                </button>
              </div>
            )}

            {!isLoading && !fetchError && entriesData?.entries && entriesData.entries.length > 0 && (
              <>
                {/* デスクトップ: テーブル形式 */}
                <div className="hidden sm:block rounded-lg border border-ink-line overflow-hidden">
                  {/* ヘッダー */}
                  <div className="bg-surface-2 px-4 py-2 border-b border-ink-line">
                    <div className="flex items-center space-x-2 text-xs font-medium text-ink-3 min-w-max">
                      <span className="w-8">枠</span>
                      <span className="flex-1 min-w-24">選手情報</span>
                      <span className="w-12 text-center">ST</span>
                      <span className="w-12 text-center">展示</span>
                      <span className="w-8 text-center">機力</span>
                      <span className="w-12 text-center">2連率</span>
                      <span className="w-12 text-center">3連率</span>
                    </div>
                  </div>

                  {/* エントリー行 */}
                  <div className="divide-y divide-ink-line">
                    {entriesData.entries
                      .sort((a, b) => a.lane - b.lane)
                      .map((entry) => (
                        <EntryRow
                          key={`${race.race_id}-${entry.lane}`}
                          entry={entry}
                        />
                      ))}
                  </div>
                </div>

                {/* モバイル: カード形式 */}
                <div className="sm:hidden space-y-1 px-2">
                  {entriesData.entries
                    .sort((a, b) => a.lane - b.lane)
                    .map((entry) => (
                      <EntryRow
                        key={`${race.race_id}-${entry.lane}`}
                        entry={entry}
                      />
                    ))}
                </div>
              </>
            )}

            {!isLoading && !fetchError && (!entriesData?.entries || entriesData.entries.length === 0) && (
              <div className="rounded-lg border border-ink-line p-4 text-center text-ink-3 text-sm bg-surface-2">
                選手情報が準備されていません
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export default RaceListItem