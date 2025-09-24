'use client'

import { useState } from 'react'
import { Feedback } from '@/lib/types'

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  currentPage: string
}

export default function FeedbackForm({ isOpen, onClose, currentPage }: FeedbackFormProps) {
  const [formData, setFormData] = useState<Partial<Feedback>>({
    page: currentPage,
    rating: undefined,
    confusing: '',
    request: '',
    comment: '',
    contact: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        // Reset form
        setFormData({
          page: currentPage,
          rating: undefined,
          confusing: '',
          request: '',
          comment: '',
          contact: '',
        })
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose()
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Feedback submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const isFormValid = formData.page && (
    formData.rating ||
    formData.confusing ||
    formData.request ||
    formData.comment
  )

  // Success screen
  if (submitStatus === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">フィードバック送信完了</h2>
          <p className="text-gray-600 text-sm">ご協力ありがとうございました！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">フィードバック</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              使いやすさ評価 <span className="text-gray-500">(任意)</span>
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className={`text-2xl transition ${
                    formData.rating && formData.rating >= star
                      ? 'text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">1=使いにくい ～ 5=使いやすい</p>
          </div>

          {/* Confusing points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分かりにくい点 <span className="text-gray-500">(任意)</span>
            </label>
            <textarea
              value={formData.confusing || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, confusing: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="どの部分が分かりにくかったですか？"
            />
          </div>

          {/* Feature requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              欲しい機能 <span className="text-gray-500">(任意)</span>
            </label>
            <textarea
              value={formData.request || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, request: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="追加してほしい機能があれば教えてください"
            />
          </div>

          {/* Free comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自由コメント <span className="text-gray-500">(任意)</span>
            </label>
            <textarea
              value={formData.comment || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="その他、ご意見・ご感想をお聞かせください"
            />
          </div>

          {/* Contact info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              連絡先 <span className="text-gray-500">(任意)</span>
            </label>
            <input
              type="text"
              value={formData.contact || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Twitter、メールアドレスなど（返信希望の場合）"
            />
          </div>

          {/* Error message */}
          {submitStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">送信に失敗しました。時間をおいて再試行してください。</p>
            </div>
          )}

          {/* Privacy notice */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              • いただいたフィードバックは開発改善のために使用されます<br/>
              • 匿名での送信も可能です<br/>
              • 連絡先は任意入力です
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '送信中...' : '送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Utility hook for managing feedback modal state
export function useFeedbackModal(currentPage: string) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return {
    isOpen,
    openModal,
    closeModal,
    FeedbackForm: () => (
      <FeedbackForm
        isOpen={isOpen}
        onClose={closeModal}
        currentPage={currentPage}
      />
    )
  }
}