'use client'

import { useState } from 'react'
import { Feedback } from '@/lib/types'

// Hook for managing feedback modal state
export function useFeedbackModal(currentPage: string) {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  const FeedbackForm = ({ ...props }: Record<string, unknown>) => (
    <FeedbackFormComponent
      isOpen={isOpen}
      onClose={closeModal}
      currentPage={currentPage}
      {...props}
    />
  )

  return { isOpen, openModal, closeModal, FeedbackForm }
}

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  currentPage: string
}

function FeedbackFormComponent({ isOpen, onClose, currentPage }: FeedbackFormProps) {
  const [formData, setFormData] = useState<Partial<Feedback>>({
    page: currentPage,
    rating: undefined,
    comment: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsSubmitting(true)

    try {
      const feedbackData: Feedback = {
        rating: formData.rating!,
        comment: formData.comment || '',
        page: formData.page!,
        timestamp: new Date().toISOString(),
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setTimeout(() => {
          onClose()
          setFormData({
            page: currentPage,
            rating: undefined,
            comment: '',
          })
          setSubmitStatus('idle')
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.rating && formData.comment

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">フィードバック</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {submitStatus === 'success' ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-gray-700">フィードバックをありがとうございました！</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                評価 (1-5) <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating }))}
                    className={`w-8 h-8 rounded-full text-sm font-medium ${
                      formData.rating === rating
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                コメント <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.comment || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="ご意見やご感想をお聞かせください"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className={`px-4 py-2 text-sm rounded-lg ${
                  isFormValid && !isSubmitting
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? '送信中...' : '送信'}
              </button>
            </div>

            {submitStatus === 'error' && (
              <div className="text-red-600 text-sm text-center">
                送信に失敗しました。もう一度お試しください。
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default FeedbackFormComponent