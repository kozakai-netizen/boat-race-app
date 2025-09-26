'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  InformationCircleIcon,
  ArrowUpTrayIcon,
  ChatBubbleLeftIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline'

interface HamburgerMenuProps {
  onLegendClick?: () => void
  onFeedbackClick?: () => void
  onDataImportClick?: () => void
  showBackButton?: boolean
  pageTitle?: string
}

const NavItem = ({
  icon,
  label,
  onClick,
  href,
  className = ""
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
  className?: string
}) => {
  const Component = href ? 'a' : 'button'

  return (
    <Component
      {...(href ? { href } : {})}
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-ink-2 rounded-lg hover:bg-brand-soft hover:text-brand transition-colors duration-200 ${className}`}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </Component>
  )
}

const Sidebar = ({
  isOpen,
  onClose,
  onLegendClick,
  onFeedbackClick,
  onDataImportClick,
  showBackButton
}: {
  isOpen: boolean
  onClose: () => void
  onLegendClick?: () => void
  onFeedbackClick?: () => void
  onDataImportClick?: () => void
  showBackButton?: boolean
}) => {
  const handleItemClick = (action?: () => void) => {
    if (action) action()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Menu */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-72 bg-surface-1 shadow-hover z-50 flex flex-col border-r border-ink-line"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ink-line">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-ink-1">競艇予想システム</span>
                <span className="text-xs text-ink-3">住之江専用</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-surface-2 transition-colors"
                aria-label="メニューを閉じる"
              >
                <XMarkIcon className="w-6 h-6 text-ink-3" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-4 space-y-2">
              {showBackButton && (
                <NavItem
                  icon={<ChevronLeftIcon className="w-6 h-6" />}
                  label="戻る"
                  onClick={() => {
                    window.history.back()
                    onClose()
                  }}
                />
              )}
              <NavItem
                icon={<HomeIcon className="w-6 h-6" />}
                label="ホーム"
                href="/suminoye"
                onClick={onClose}
              />
              <NavItem
                icon={<InformationCircleIcon className="w-6 h-6" />}
                label="凡例"
                onClick={() => handleItemClick(onLegendClick)}
              />
              <NavItem
                icon={<ArrowUpTrayIcon className="w-6 h-6" />}
                label="データ取り込み"
                onClick={() => handleItemClick(onDataImportClick)}
              />
              <NavItem
                icon={<ChatBubbleLeftIcon className="w-6 h-6" />}
                label="フィードバック"
                onClick={() => handleItemClick(onFeedbackClick)}
              />
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-ink-line">
              <span className="text-sm font-medium text-ink-3">データモード</span>
              <div className="mt-2 bg-surface-2 p-1 rounded-lg">
                <div className="w-full text-center px-4 py-2 rounded-md bg-surface-1 shadow-card text-sm font-medium text-brand border border-ink-line">
                  {process.env.NEXT_PUBLIC_DATA_MODE === 'live' ? 'ライブ' : 'デモ'}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function HamburgerMenu({
  onLegendClick,
  onFeedbackClick,
  onDataImportClick,
  showBackButton = false,
  pageTitle = "レース情報"
}: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-30 bg-surface-1/80 backdrop-blur-lg border-b border-ink-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-full hover:bg-surface-2 transition-colors"
              aria-label="メニューを開く"
            >
              <Bars3Icon className="w-6 h-6 text-ink-2" />
            </button>
            <div className="font-bold text-lg text-ink-1">
              {pageTitle}
            </div>
            <div className="w-10">{/* Spacer */}</div>
          </div>
        </div>
      </header>

      <Sidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onLegendClick={onLegendClick}
        onFeedbackClick={onFeedbackClick}
        onDataImportClick={onDataImportClick}
        showBackButton={showBackButton}
      />
    </>
  )
}