'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const validToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin123'

    if (token === validToken) {
      // Set cookie for authentication
      document.cookie = `admin-token=${token}; path=/; max-age=86400` // 24 hours
      router.push('/admin')
    } else {
      setError('無効なトークンです')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">管理画面ログイン</h1>
          <p className="text-gray-600 mt-2">アクセストークンを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              アクセストークン
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="トークンを入力"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a
            href="/login"
            className="text-orange-600 hover:text-orange-800 text-sm block"
          >
            ← ログイン選択に戻る
          </a>
          <a
            href="/suminoye"
            className="text-blue-600 hover:text-blue-800 text-sm block"
          >
            ← ホームに戻る
          </a>
        </div>
      </div>
    </div>
  )
}