'use client'

import Link from 'next/link'

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full text-center">
        {/* ロゴ */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-500 to-blue-500 rounded-full opacity-90"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <span className="text-3xl">🚤</span>
            </div>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">舟券王への道from住之江競艇</h1>

        {/* 機能紹介 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">主な機能</h3>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li>• 📋 レース一覧・出走情報表示</li>
            <li>• 🎯 AI による 3連単予想（EV値ベース）</li>
            <li>• ⭐ SUPER PICK 機能</li>
            <li>• 🔧 1着固定予想モード</li>
            <li>• 📊 レース結果・的中状況確認</li>
            <li>• 🌤️ 天候・水面状況表示</li>
          </ul>
        </div>

        {/* アクション選択案内 */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mb-3">
            🎯
          </div>
          <p className="text-gray-600 text-sm">
            下のボタンからご利用になりたい機能を選択してください
          </p>
        </div>

        {/* アクション選択 */}
        <div className="space-y-4">
          {/* メイン選択肢 */}
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/suminoye"
              className="block w-full bg-blue-600 text-white py-4 px-4 rounded-lg hover:bg-blue-700 transition font-medium shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">🚤</span>
                <span>舟券王への道を始める</span>
              </div>
            </Link>

            <Link
              href="/admin/login"
              className="block w-full bg-orange-500 text-white py-4 px-4 rounded-lg hover:bg-orange-600 transition font-medium shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">⚙️</span>
                <span>管理画面</span>
              </div>
            </Link>
          </div>

          {/* サブ選択肢 */}
          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-3 text-center">ダイレクトアクセス</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Link
                href="/suminoye/races"
                className="block bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition text-center"
              >
                📋 レース一覧
              </Link>
              <Link
                href="/suminoye/results"
                className="block bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition text-center"
              >
                📊 結果確認
              </Link>
            </div>
            <Link
              href="/login"
              className="block w-full bg-gray-50 text-gray-600 py-2 px-3 rounded text-xs hover:bg-gray-100 transition text-center border"
            >
              🔐 ログイン選択画面
            </Link>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            住之江競艇場公式データを利用したAI予想システム
          </p>
          <p className="text-xs text-gray-400 mt-1">
            データベース接続にはSupabaseの設定が必要です
          </p>
        </div>
      </div>
    </div>
  )
}