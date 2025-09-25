import { memo } from 'react'
import Image from 'next/image'

interface EntryRowProps {
  entry: {
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
    // 外部リンクと画像用
    photo_path?: string
    external_url?: string
  }
}

const EntryRow = memo(function EntryRow({ entry }: EntryRowProps) {
  // 外部リンク表示フラグ
  const enableExternalLinks = process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_LINKS === 'true'

  // デフォルトの外部URL（マクール一覧）
  const defaultExternalUrl = 'https://sp.macour.jp/boatracer/'
  const externalUrl = entry.external_url || defaultExternalUrl

  return (
    <>
      {/* デスクトップ: テーブル形式 */}
      <div className="hidden sm:flex items-center space-x-2 p-2 hover:bg-surface-2 transition-colors min-w-max">
      {/* 枠番 */}
      <div className={`
        w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
        ${entry.lane === 1 ? 'bg-white text-black border-2 border-black' :
          entry.lane === 2 ? 'bg-black text-white' :
          entry.lane === 3 ? 'bg-red-500' :
          entry.lane === 4 ? 'bg-blue-500' :
          entry.lane === 5 ? 'bg-yellow-500 text-black' :
          'bg-green-500'}
      `}>
        {entry.lane}
      </div>

      {/* 選手写真（あれば） */}
      <div className="flex-shrink-0">
        {entry.photo_path ? (
          <Image
            src={entry.photo_path}
            alt={`${entry.player_name}の写真`}
            width={32}
            height={32}
            className="rounded-full object-cover"
            loading="lazy"
            priority={false}
          />
        ) : (
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-surface-3 flex items-center justify-center">
            <span className="text-xs text-ink-3 font-bold">
              {entry.player_name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* 選手名・級別・外部リンク */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0">
          {/* 上段：選手名 + 級別 */}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm text-ink-1 truncate">
              {entry.player_name}
            </span>
            <span className={`
              px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0
              ${entry.grade_badge_color}
            `}>
              {entry.player_grade}
            </span>
          </div>

          {/* 下段：号艇 + 外部リンク */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-ink-3 flex-shrink-0">
              {entry.lane}号艇
            </span>
            {enableExternalLinks && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${entry.player_name}の詳細情報（外部サイト）`}
                className="text-xs text-brand hover:opacity-90 hover:underline transition flex-shrink-0 flex items-center space-x-1"
              >
                <span>{entry.external_url ? '詳しく見る' : '選手情報（マクール）'}</span>
                <span className="text-xs">↗</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ST */}
      <div className="text-right min-w-[2rem] sm:min-w-[3rem] flex-shrink-0">
        <div className={`text-xs sm:text-sm font-mono ${entry.st_color}`}>
          {entry.st_time.toFixed(2)}
        </div>
        <div className="text-xs text-ink-4">ST</div>
      </div>

      {/* 展示T */}
      <div className="text-right min-w-[2rem] sm:min-w-[3rem] flex-shrink-0">
        <div className={`text-xs sm:text-sm font-mono ${entry.exhibition_color}`}>
          {entry.exhibition_time.toFixed(2)}
        </div>
        <div className="text-xs text-ink-4">展示</div>
      </div>

      {/* モーター調子バッジ */}
      <div className="relative group flex-shrink-0">
        <span className={`
          px-1.5 py-0.5 rounded text-xs font-bold border cursor-help
          ${entry.motor_badge.color}
        `}>
          {entry.motor_badge.grade}
        </span>

        {/* デスクトップ: ツールチップ */}
        <div className="hidden sm:block absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-ink-1 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          {entry.motor_badge.tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-ink-1"></div>
        </div>

        {/* モバイル: 括弧書き */}
        <div className="sm:hidden text-xs text-ink-3 mt-0.5 text-center">
          ({entry.motor_rate}%)
        </div>
      </div>

      {/* 2連率 */}
      <div className="text-right min-w-[2rem] sm:min-w-[3rem] flex-shrink-0">
        <div className="text-xs sm:text-sm font-medium text-ink-1">
          {entry.two_rate}%
        </div>
        <div className="text-xs text-ink-4">2連</div>
      </div>
    </div>

      {/* モバイル: 極コンパクト1行レイアウト */}
      <div className="sm:hidden bg-surface-1 border border-ink-line rounded-md p-1 my-0.5 shadow-card">
        <div className="flex items-center justify-between">
          {/* 左側：枠番 + 選手名 + 級別 */}
          <div className="flex items-center space-x-1.5 flex-1 min-w-0">
            {/* 枠番 */}
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
              ${entry.lane === 1 ? 'bg-white text-black border border-black' :
                entry.lane === 2 ? 'bg-black text-white' :
                entry.lane === 3 ? 'bg-red-500' :
                entry.lane === 4 ? 'bg-blue-500' :
                entry.lane === 5 ? 'bg-yellow-500 text-black' :
                'bg-green-500'}
            `}>
              {entry.lane}
            </div>

            {/* 選手名（8文字でトランケート） */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1">
                <span className="font-medium text-ink-1 truncate text-xs max-w-[4rem]">
                  {entry.player_name}
                </span>
                <span className={`
                  px-1 py-0.5 rounded text-xs font-medium border flex-shrink-0
                  ${entry.grade_badge_color}
                `}>
                  {entry.player_grade}
                </span>
              </div>
            </div>
          </div>

          {/* 右側：データ（4列コンパクト） */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* ST */}
            <div className="text-center min-w-[1.8rem]">
              <div className={`text-xs font-mono leading-tight ${entry.st_color}`}>
                {entry.st_time.toFixed(2)}
              </div>
            </div>

            {/* 展示 */}
            <div className="text-center min-w-[1.8rem]">
              <div className={`text-xs font-mono leading-tight ${entry.exhibition_color}`}>
                {entry.exhibition_time.toFixed(2)}
              </div>
            </div>

            {/* 機力 */}
            <div className="text-center min-w-[1.2rem]">
              <span className={`
                px-0.5 py-0.5 rounded text-xs font-bold border
                ${entry.motor_badge.color}
              `}>
                {entry.motor_badge.grade}
              </span>
            </div>

            {/* 2連率 */}
            <div className="text-center min-w-[1.5rem]">
              <div className="text-xs font-medium text-ink-1 leading-tight">
                {Math.round(entry.two_rate)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

export default EntryRow