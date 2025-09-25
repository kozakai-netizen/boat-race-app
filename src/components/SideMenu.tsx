'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SideMenuProps {
  onLegendClick?: () => void
  onFeedbackClick?: () => void
  showBackButton?: boolean
}

export default function SideMenu({ onLegendClick, onFeedbackClick, showBackButton = true }: SideMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
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

  // マウス位置でメニューの表示制御
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isNearLeftEdge = e.clientX <= 20
      setIsHovering(isNearLeftEdge)
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ホバー状態でメニュー表示
  useEffect(() => {
    if (isHovering) {
      setIsOpen(true)
    } else {
      // 少し遅延してから閉じる（誤操作防止）
      const timer = setTimeout(() => setIsOpen(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isHovering])

  return (
    <>
      {/* トリガーエリア（透明） */}
      <div
        className="fixed left-0 top-0 w-5 h-full z-40 bg-transparent"
        onMouseEnter={() => setIsHovering(true)}
      />

      {/* サイドメニュー */}
      <div
        className={`fixed left-0 top-0 h-full z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="h-full w-16 bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-xl">
          {/* メニューアイテム */}
          <div className="flex flex-col items-center py-6 space-y-4">
            {menuItems.map((item, index) => (
              item.action && (
                <button
                  key={index}
                  onClick={item.action}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-200 ${item.bgColor} group relative`}
                  title={item.label}
                >
                  <span className="text-gray-700 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>

                  {/* ツールチップ */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                </button>
              )
            ))}
          </div>

          {/* 装飾的な縦線 */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-0.5 bg-gradient-to-b from-transparent via-blue-300 to-transparent" />
        </div>
      </div>

      {/* 背景オーバーレイ（モバイル用） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-30 md:hidden"
          onClick={() => {
            setIsOpen(false)
            setIsHovering(false)
          }}
        />
      )}
    </>
  )
}