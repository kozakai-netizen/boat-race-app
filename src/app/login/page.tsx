'use client'

import Link from 'next/link'

export default function LoginSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ログイン選択</h1>
          <p className="text-gray-600">どちらにログインしますか？</p>
        </div>

        <div className="space-y-4">
          {/* 一般ユーザー向け */}
          <Link href="/suminoye" className="block">
            <div className="border-2 border-blue-200 hover:border-blue-400 rounded-lg p-6 transition-all duration-200 hover:shadow-lg group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                  <span className="text-2xl">🏁</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition">
                    住之江ボートレース予想
                  </h3>
                  <p className="text-gray-600 text-sm">
                    レース情報・予想・結果を確認
                  </p>
                </div>
                <div className="text-blue-400 group-hover:text-blue-600 transition">
                  <span className="text-xl">→</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 管理者向け */}
          <Link href="/admin/login" className="block">
            <div className="border-2 border-orange-200 hover:border-orange-400 rounded-lg p-6 transition-all duration-200 hover:shadow-lg group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition">
                    管理画面
                  </h3>
                  <p className="text-gray-600 text-sm">
                    選手・レース・結果の管理
                  </p>
                </div>
                <div className="text-orange-400 group-hover:text-orange-600 transition">
                  <span className="text-xl">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            住之江ボートレース予想システム v2025
          </p>
        </div>
      </div>
    </div>
  )
}