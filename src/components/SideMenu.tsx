'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface SideMenuProps {
  onLegendClick?: () => void
  onFeedbackClick?: () => void
  showBackButton?: boolean
}

export default function SideMenu({ onLegendClick, onFeedbackClick, showBackButton = true }: SideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandTimer, setExpandTimer] = useState<NodeJS.Timeout | null>(null)
  const [collapseTimer, setCollapseTimer] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const { isAdmin } = useAuth()

  const handleMouseEnter = () => {
    // 閉じるタイマーをクリア
    if (collapseTimer) {
      clearTimeout(collapseTimer)
      setCollapseTimer(null)
    }

    // 遅延展開
    if (!isExpanded && !expandTimer) {
      const timer = setTimeout(() => {
        setIsExpanded(true)
        setExpandTimer(null)
      }, 200)
      setExpandTimer(timer)
    }
  }

  const handleMouseLeave = () => {
    // 展開タイマーをクリア
    if (expandTimer) {
      clearTimeout(expandTimer)
      setExpandTimer(null)
    }

    // 遅延閉じる
    if (isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false)
        setCollapseTimer(null)
      }, 400)
      setCollapseTimer(timer)
    }
  }

  // メニュー項目定義
  const menuItems = [
    ...(showBackButton ? [{
      icon: '←',
      label: '戻る',
      action: () => router.back(),
      bgColor: 'hover:bg-gray-100'
    }] : []),
    {
      icon: '❓',
      label: '凡例',
      action: onLegendClick,
      bgColor: 'hover:bg-blue-50'
    },
    {
      icon: '💬',
      label: 'フィードバック',
      action: onFeedbackClick,
      bgColor: 'hover:bg-green-50'
    },
    ...(isAdmin ? [{
      icon: '⚙️',
      label: '管理画面',
      action: () => router.push('/admin'),
      bgColor: 'hover:bg-orange-50'
    }] : [])
  ]

  return (
    <>
      {/* サイドメニュー - デスクトップのみ表示 */}
      <div
        className="hidden md:block fixed left-0 top-0 h-full z-50"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 広いホバーエリア（透明） */}
        <div className="absolute -right-5 top-0 w-5 h-full" />

        <div className={`h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-xl transition-all duration-300 ease-out ${
          isExpanded ? 'w-48' : 'w-12'
        }`}>
          {/* メニューアイテム */}
          <div className="flex flex-col items-start py-6 space-y-4 px-3">
            {menuItems.map((item, index) => (
              item.action && (
                <button
                  key={index}
                  onClick={item.action}
                  className={`flex items-center w-full rounded-xl transition-all duration-200 ${item.bgColor} group relative overflow-hidden ${
                    isExpanded ? 'px-3 py-3 justify-start' : 'w-8 h-8 justify-center'
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  {/* アイコン */}
                  <span className={`text-gray-700 group-hover:scale-110 transition-transform flex-shrink-0 ${
                    isExpanded ? 'text-base mr-3' : 'text-lg'
                  }`}>
                    {item.icon}
                  </span>

                  {/* テキスト - 展開時のみ表示 */}
                  <span className={`text-sm font-medium text-gray-700 transition-all duration-300 whitespace-nowrap ${
                    isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 absolute'
                  }`}>
                    {item.label}
                  </span>

                  {/* 縮小時のツールチップ */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {item.label}
                    </div>
                  )}
                </button>
              )
            ))}
          </div>

          {/* 装飾的な縦線とヒント */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-gradient-to-b from-transparent via-blue-300 to-transparent" />

          {/* 隠れメニューがあることを示すヒント */}
          {!isExpanded && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8">
              <div className="w-full h-full bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400 rounded-r-full opacity-60 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* 背景オーバーレイ（モバイル展開時） */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/5 z-30 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}