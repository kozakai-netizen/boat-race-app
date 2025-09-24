'use client'

import { useState } from 'react'
import { useUrlSync } from '@/hooks/useUrlSync'

interface ShareButtonProps {
  className?: string
}

export default function ShareButton({ className = '' }: ShareButtonProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const { copyShareUrl } = useUrlSync()

  const handleCopy = async () => {
    const success = await copyShareUrl()
    setCopyStatus(success ? 'copied' : 'error')

    // Reset status after 2 seconds
    setTimeout(() => {
      setCopyStatus('idle')
    }, 2000)
  }

  const getButtonText = () => {
    switch (copyStatus) {
      case 'copied':
        return '✅ コピー完了'
      case 'error':
        return '❌ コピー失敗'
      default:
        return '🔗 リンクをコピー'
    }
  }

  const getButtonClass = () => {
    const baseClass = `px-3 py-1 rounded-lg text-xs font-medium transition-colors ${className}`

    switch (copyStatus) {
      case 'copied':
        return `${baseClass} bg-green-100 text-green-700`
      case 'error':
        return `${baseClass} bg-red-100 text-red-700`
      default:
        return `${baseClass} bg-gray-100 text-gray-700 hover:bg-gray-200`
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={copyStatus !== 'idle'}
      className={getButtonClass()}
    >
      {getButtonText()}
    </button>
  )
}