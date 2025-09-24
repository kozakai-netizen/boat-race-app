'use client'

import { useState } from 'react'

interface LegendModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LegendModal({ isOpen, onClose }: LegendModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">凡例</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Prediction Icons */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">予想アイコン</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🚀</span>
                <span className="text-gray-800">スピード - 高速スタート・スピード型</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">💨</span>
                <span className="text-gray-800">パワー - 加速力・パワー型</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">🧱</span>
                <span className="text-gray-800">安定 - 堅実・安定型</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">⚡</span>
                <span className="text-gray-800">テクニック - 技術・展示タイム</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">🎯</span>
                <span className="text-gray-800">精密 - 高勝率・的確性</span>
              </div>
            </div>
          </div>

          {/* Result Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">結果ステータス</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🎯</span>
                <span className="text-gray-800">的中 - 完全一致</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">⭕</span>
                <span className="text-gray-800">TOP5内 - 上位内着</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">❌</span>
                <span className="text-gray-800">不的中 - 予想外れ</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg">△</span>
                <span className="text-gray-800">参考 - レース未確定</span>
              </div>
            </div>
          </div>

          {/* Special Badges */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">特別表示</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  ⭐ SUPER
                </div>
                <span className="text-gray-800">高期待値予想（EV ≥ 1.25 かつ 確率 ≥ 4%）</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                  発売中
                </div>
                <span className="text-gray-800">舟券発売中</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                  締切済
                </div>
                <span className="text-gray-800">舟券発売終了</span>
              </div>
            </div>
          </div>

          {/* Understanding Guide */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">使い方のヒント</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• アイコンは予想の根拠を表しています</li>
              <li>• EV値が高いほど期待値が大きい予想です</li>
              <li>• SUPER表示は特に注目の予想です</li>
              <li>• 1着固定タブで特定の艇を軸にできます</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

// Utility hook for managing modal state
export function useLegendModal() {
  const [isOpen, setIsOpen] = useState(false)

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)

  return { isOpen, openModal, closeModal }
}