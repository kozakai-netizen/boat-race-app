'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

interface SideMenuProps {
  onLegendClick?: () => void
  onFeedbackClick?: () => void
  showBackButton?: boolean
}

export default function SideMenu({ onLegendClick, onFeedbackClick, showBackButton = true }: SideMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { isAdmin } = useAuth()

  const iconComponents = {
    ArrowLeftIcon,
    InformationCircleIcon,
    ChatBubbleLeftEllipsisIcon,
    Cog6ToothIcon
  }

  const menuItems = [
    ...(showBackButton ? [{
      icon: 'ArrowLeftIcon',
      label: '戻る',
      action: () => {
        router.back()
        setIsOpen(false)
      }
    }] : []),
    {
      icon: 'InformationCircleIcon',
      label: '凡例',
      action: () => {
        onLegendClick?.()
        setIsOpen(false)
      }
    },
    {
      icon: 'ChatBubbleLeftEllipsisIcon',
      label: 'フィードバック',
      action: () => {
        onFeedbackClick?.()
        setIsOpen(false)
      }
    },
    ...(isAdmin ? [{
      icon: 'Cog6ToothIcon',
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
          className="w-12 h-12 bg-surface-1 border border-ink-line rounded-xl shadow-card flex flex-col items-center justify-center space-y-1.5 hover:shadow-hover transition-all duration-200 group focus:ring-2 focus:ring-brand-ring focus:outline-none"
        >
          <span className={`block h-0.5 w-6 bg-ink-2 transition-all duration-200 ${isOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block h-0.5 w-6 bg-ink-2 transition-all duration-200 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block h-0.5 w-6 bg-ink-2 transition-all duration-200 ${isOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* サイドメニューパネル */}
      <div
        id="side-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="サイドメニュー"
        className={`fixed top-0 left-0 h-full w-80 bg-surface-1 border-r border-ink-line shadow-hover z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setIsOpen(false)
          }
        }}
      >
        {/* ヘッダー */}
        <div className="px-6 py-8 border-b border-ink-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  router.push('/suminoye')
                  setIsOpen(false)
                }}
                className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center hover:opacity-90 transition-all duration-200 focus:ring-2 focus:ring-brand-ring focus:outline-none"
                title="ホームに戻る"
                aria-label="ホームに戻る"
              >
                <HomeIcon className="w-5 h-5 text-white" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-ink-1">競艇予想システム</h2>
                <p className="text-sm text-ink-3">住之江専用</p>
              </div>
            </div>

          </div>
        </div>

        {/* メニューアイテム */}
        <div className="px-4 py-6 space-y-1">
          {menuItems.map((item, index) => {
            const IconComponent = iconComponents[item.icon as keyof typeof iconComponents]
            return (
              item.action && (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex items-center w-full px-4 py-3 text-left rounded-lg hover:bg-surface-2 transition-all duration-200 group"
                >
                  <IconComponent className="w-5 h-5 text-ink-3 mr-4 group-hover:text-brand transition-colors" />
                  <span className="text-sm font-medium text-ink-2 group-hover:text-ink-1">
                    {item.label}
                  </span>
                </button>
              )
            )
          })}
        </div>

        {/* テーマ切り替え */}
        <div className="px-4 py-4 border-t border-ink-line">
          <div className="mb-2">
            <span className="text-xs text-ink-4 uppercase tracking-wide">テーマ設定</span>
          </div>
          <ThemeToggle variant="dropdown" />
        </div>
      </div>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink-1/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}