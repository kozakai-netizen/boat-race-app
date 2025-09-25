'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { AdminResult, AdminResultsResponse, ResultSearchParams } from '@/lib/types'
import Link from 'next/link'
import { ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const ITEMS_PER_PAGE = 20

export default function AdminResultsPage() {
  // State管理
  const [results, setResults] = useState<AdminResult[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 検索・フィルタ状態
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [hasResultFilter, setHasResultFilter] = useState<'true' | 'false' | ''>('')
  const [sortBy, setSortBy] = useState<'race_id' | 'settled_at' | 'payout' | 'popularity' | 'updated_at'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 新規作成・編集モーダル
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResult, setEditingResult] = useState<AdminResult | null>(null)
  const [formData, setFormData] = useState({
    race_id: '',
    triple: '',
    payout: '',
    popularity: '',
    settled_at: ''
  })

  // データ取得（デバウンス付き）
  const fetchResults = useCallback(async (
    page: number = currentPage,
    q: string = searchTerm,
    hasResult: string = hasResultFilter,
    from: string = dateFrom,
    to: string = dateTo
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy,
        sortOrder,
      })

      if (q.trim()) params.append('q', q.trim())
      if (hasResult) params.append('hasResult', hasResult)
      if (from) params.append('dateFrom', from)
      if (to) params.append('dateTo', to)

      const response = await fetch(`/api/admin/results?${params}`)

      if (!response.ok) {
        throw new Error('結果データの取得に失敗しました')
      }

      const data: AdminResultsResponse = await response.json()
      setResults(data.results)
      setTotal(data.total)
      setCurrentPage(page)

    } catch (err) {
      console.error('Error fetching results:', err)
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchTerm, hasResultFilter, dateFrom, dateTo, sortBy, sortOrder])

  // デバウンス検索
  const debouncedSearch = useMemo(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchResults(1, searchTerm, hasResultFilter, dateFrom, dateTo)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, hasResultFilter, dateFrom, dateTo, fetchResults])

  useEffect(() => {
    return debouncedSearch
  }, [debouncedSearch])

  // ソート変更
  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    const newOrder = sortBy === newSortBy && sortOrder === 'desc' ? 'asc' : 'desc'
    setSortBy(newSortBy)
    setSortOrder(newOrder)
  }, [sortBy, sortOrder])

  useEffect(() => {
    fetchResults(1)
  }, [sortBy, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps

  // 初回読み込み
  useEffect(() => {
    fetchResults(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // モーダル管理
  const openCreateModal = () => {
    setEditingResult(null)
    setFormData({
      race_id: '',
      triple: '',
      payout: '',
      popularity: '',
      settled_at: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (result: AdminResult) => {
    setEditingResult(result)
    setFormData({
      race_id: result.race_id,
      triple: result.triple,
      payout: result.payout?.toString() || '',
      popularity: result.popularity?.toString() || '',
      settled_at: result.settled_at ? new Date(result.settled_at).toISOString().slice(0, 16) : ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingResult(null)
  }

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const submitData = {
        race_id: formData.race_id,
        triple: formData.triple,
        payout: formData.payout ? parseInt(formData.payout) : null,
        popularity: formData.popularity ? parseInt(formData.popularity) : null,
        settled_at: formData.settled_at ? new Date(formData.settled_at).toISOString() : null
      }

      const url = editingResult
        ? `/api/admin/results/${editingResult.id}`
        : '/api/admin/results'
      const method = editingResult ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '保存に失敗しました')
      }

      closeModal()
      fetchResults(currentPage)

    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 削除
  const handleDelete = async (result: AdminResult) => {
    if (!confirm(`レース ${result.race_id} の結果を削除しますか？`)) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/results/${result.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '削除に失敗しました')
      }

      fetchResults(currentPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // ページネーション
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                管理パネルに戻る
              </Link>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              結果を追加
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">レース結果管理</h1>
          <p className="text-gray-600 mt-2">レース結果の登録・編集・削除を行います</p>
        </div>

        {/* 検索・フィルタ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* レースID検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                レースID検索
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="suminoe-20250925-01R"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* 日付範囲 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 結果入力済みフィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                結果入力済み
              </label>
              <select
                value={hasResultFilter}
                onChange={(e) => setHasResultFilter(e.target.value as 'true' | 'false' | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">全て</option>
                <option value="true">入力済み</option>
                <option value="false">未入力</option>
              </select>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              閉じる
            </button>
          </div>
        )}

        {/* 結果一覧テーブル */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              結果一覧 ({total}件)
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              結果が見つかりませんでした
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('race_id')}
                    >
                      レースID {sortBy === 'race_id' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      3連複
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('payout')}
                    >
                      払戻金 {sortBy === 'payout' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('popularity')}
                    >
                      人気 {sortBy === 'popularity' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSortChange('settled_at')}
                    >
                      確定日時 {sortBy === 'settled_at' && (sortOrder === 'desc' ? '↓' : '↑')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      的中/総予想
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.race_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {result.triple}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.payout ? `¥${result.payout.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.popularity ? `${result.popularity}番人気` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.settled_at
                          ? new Date(result.settled_at).toLocaleString('ja-JP')
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.hit_count !== undefined && result.total_forecasts !== undefined
                          ? `${result.hit_count}/${result.total_forecasts}`
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(result)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(result)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {total}件中 {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, total)}〜{Math.min(currentPage * ITEMS_PER_PAGE, total)}件表示
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchResults(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i))
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchResults(pageNum)}
                    disabled={isLoading}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => fetchResults(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages || isLoading}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                {editingResult ? '結果を編集' : '結果を追加'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    レースID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.race_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, race_id: e.target.value }))}
                    placeholder="suminoe-20250925-01R"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    3連複 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.triple}
                    onChange={(e) => setFormData(prev => ({ ...prev, triple: e.target.value }))}
                    placeholder="1-2-3"
                    pattern="^[1-6]-[1-6]-[1-6]$"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">例: 1-2-3</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    払戻金（円）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.payout}
                    onChange={(e) => setFormData(prev => ({ ...prev, payout: e.target.value }))}
                    placeholder="1200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    人気順位
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.popularity}
                    onChange={(e) => setFormData(prev => ({ ...prev, popularity: e.target.value }))}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">1〜120番人気</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    確定日時
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.settled_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, settled_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? '保存中...' : (editingResult ? '更新' : '作成')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}