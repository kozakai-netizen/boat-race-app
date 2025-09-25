'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SideMenuProps {
  onLegendClick?: () => void
  onFeedbackClick?: () => void
  showBackButton?: boolean
}

export default function SideMenu({ onLegendClick, onFeedbackClick, showBackButton = true }: SideMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

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
    }
  ]

  return (
    <>
      {/* サイドメニュー - 常時表示 */}
      <div
        className="fixed left-0 top-0 h-full z-50"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className={`h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-xl transition-all duration-300 ease-out ${
          isExpanded ? 'w-48' : 'w-16'
        }`}>
          {/* メニューアイテム */}
          <div className="flex flex-col items-start py-6 space-y-4 px-3">
            {menuItems.map((item, index) => (
              item.action && (
                <button
                  key={index}
                  onClick={item.action}
                  className={`flex items-center w-full rounded-xl transition-all duration-200 ${item.bgColor} group relative overflow-hidden ${
                    isExpanded ? 'px-3 py-3 justify-start' : 'w-10 h-10 justify-center'
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

          {/* 装飾的な縦線 */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-gradient-to-b from-transparent via-blue-300 to-transparent" />
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