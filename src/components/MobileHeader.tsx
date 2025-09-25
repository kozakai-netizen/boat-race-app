'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface MobileHeaderProps {
  onLegendClick?: () => void
  onFeedbackClick?: () => void
  showBackButton?: boolean
}

export default function MobileHeader({ onLegendClick, onFeedbackClick, showBackButton = true }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { isAdmin } = useAuth()

  const menuItems = [
    ...(showBackButton ? [{
      icon: '←',
      label: '戻る',
      action: () => {
        router.back()
        setIsMenuOpen(false)
      }
    }] : []),
    {
      icon: '🏠',
      label: 'ホーム',
      action: () => {
        router.push('/suminoye')
        setIsMenuOpen(false)
      }
    },
    {
      icon: '❓',
      label: '凡例',
      action: () => {
        onLegendClick?.()
        setIsMenuOpen(false)
      }
    },
    {
      icon: '💬',
      label: 'フィードバック',
      action: () => {
        onFeedbackClick?.()
        setIsMenuOpen(false)
      }
    },
    ...(isAdmin ? [{
      icon: '⚙️',
      label: '管理画面',
      action: () => {
        router.push('/admin')
        setIsMenuOpen(false)
      }
    }] : [])
  ]

  return (
    <>
      {/* モバイル用ヘッダー */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🚤</span>
            <span className="text-sm font-medium text-gray-800">舟券王への道</span>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <div className={`w-5 h-4 flex flex-col justify-between transform transition-all duration-200 ${isMenuOpen ? 'rotate-45' : ''}`}>
              <span className={`block h-0.5 bg-gray-600 transform transition duration-200 ${isMenuOpen ? 'rotate-90 translate-y-1.5' : ''}`}></span>
              <span className={`block h-0.5 bg-gray-600 transition duration-200 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 bg-gray-600 transform transition duration-200 ${isMenuOpen ? '-rotate-90 -translate-y-1.5' : ''}`}></span>
            </div>
          </button>
        </div>

        {/* ドロップダウンメニュー */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
            <div className="py-2">
              {menuItems.map((item, index) => (
                item.action && (
                  <button
                    key={index}
                    onClick={item.action}
                    className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </button>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* オーバーレイ */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </>
  )
}