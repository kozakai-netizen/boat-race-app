'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'

const themes = [
  { value: 'light' as const, label: '🌞 ライト', icon: '☀️' },
  { value: 'dark' as const, label: '🌙 ダーク', icon: '🌙' },
  { value: 'system' as const, label: '🖥️ システム', icon: '⚙️' }
]

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'dropdown'
  showLabel?: boolean
}

export function ThemeToggle({ variant = 'button', showLabel = true }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Prevent hydration mismatch by rendering a placeholder
    return (
      <div className="w-9 h-9 bg-surface-2 rounded-lg animate-pulse" />
    )
  }

  if (variant === 'icon') {
    const currentTheme = themes.find(t => t.value === theme) || themes[0]

    return (
      <button
        onClick={() => {
          const currentIndex = themes.findIndex(t => t.value === theme)
          const nextTheme = themes[(currentIndex + 1) % themes.length]
          setTheme(nextTheme.value)
        }}
        className="w-9 h-9 rounded-lg bg-surface-2 hover:bg-surface-3 flex items-center justify-center transition-colors"
        title={`現在: ${currentTheme.label}`}
      >
        <span className="text-lg">{currentTheme.icon}</span>
      </button>
    )
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="appearance-none bg-surface-2 border border-ink-line rounded-lg px-3 py-2 pr-8 text-sm text-ink-2 hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        >
          {themes.map((themeOption) => (
            <option key={themeOption.value} value={themeOption.value}>
              {themeOption.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-ink-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }

  // Default button variant
  return (
    <div className="flex items-center space-x-1 bg-surface-2 rounded-lg p-1">
      {themes.map((themeOption) => (
        <button
          key={themeOption.value}
          onClick={() => setTheme(themeOption.value)}
          className={`px-3 py-1.5 text-xs rounded-md transition-all ${
            theme === themeOption.value
              ? 'bg-surface-1 text-ink-1 shadow-sm'
              : 'text-ink-3 hover:text-ink-2 hover:bg-surface-3'
          }`}
        >
          <span className="mr-1">{themeOption.icon}</span>
          {showLabel && themeOption.value !== 'system' && (
            <span className="hidden sm:inline">
              {themeOption.value === 'light' ? 'ライト' : 'ダーク'}
            </span>
          )}
          {showLabel && themeOption.value === 'system' && (
            <span className="hidden sm:inline">システム</span>
          )}
        </button>
      ))}

      {/* Current resolved theme indicator */}
      <div className="ml-2 px-2 py-1 text-xs text-ink-4 border-l border-ink-line">
        {resolvedTheme === 'dark' ? '🌙' : '☀️'}
      </div>
    </div>
  )
}