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
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { isAdmin } = useAuth()

  const menuItems = [
    ...(showBackButton ? [{
      icon: '←',
      label: '戻る',
      action: () => {
        router.back()
        setIsOpen(false)
      }
    }] : []),
    {
      icon: '❓',
      label: '凡例',
      action: () => {
        onLegendClick?.()
        setIsOpen(false)
      }
    },
    {
      icon: '💬',
      label: 'フィードバック',
      action: () => {
        onFeedbackClick?.()
        setIsOpen(false)
      }
    },
    ...(isAdmin ? [{
      icon: '⚙️',
      label: '管理画面',
      action: () => {
        router.push('/admin')
        setIsOpen(false)
      }
    }] : [])
  ]

  return (
    <>
      {/* ハンバーガーメニューボタン */}
      <div className="fixed top-6 left-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && isOpen) {
              setIsOpen(false)
            }
          }}
          aria-expanded={isOpen}
          aria-controls="side-menu-panel"
          aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
          className="w-12 h-12 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-1.5 hover:shadow-xl transition-all duration-200 group focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <span className={`block h-0.5 w-6 bg-gray-600 transition-all duration-200 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block h-0.5 w-6 bg-gray-600 transition-all duration-200 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 w-6 bg-gray-600 transition-all duration-200 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* サイドメニューパネル */}
      <div
        id="side-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="サイドメニュー"
        className={`fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-sm border-r border-gray-200 shadow-2xl z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      >
        {/* ヘッダー */}
        <div className="px-6 py-8 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  router.push('/suminoye')
                  setIsOpen(false)
                }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                title="ホームに戻る"
                aria-label="ホームに戻る"
              >
                <span className="text-white text-lg">🚤</span>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">舟券王への道</h2>
                <p className="text-sm text-gray-500">from住之江競艇</p>
              </div>
            </div>

          </div>
        </div>

        {/* メニューアイテム */}
        <div className="px-4 py-6 space-y-2">
          {menuItems.map((item, index) => (
            item.action && (
              <button
                key={index}
                onClick={item.action}
                className="flex items-center w-full px-4 py-3 text-left rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              >
                <span className="text-xl mr-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {item.label}
                </span>
              </button>
            )
          ))}
        </div>
      </div>

      {/* グレーオーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-[1px] z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}