'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AdminPlayer, AdminPlayersResponse, PlayerSearchParams } from '@/lib/types'

export default function PlayersManagement() {
  const router = useRouter()
  const [players, setPlayers] = useState<AdminPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const [editingPlayer, setEditingPlayer] = useState<AdminPlayer | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const itemsPerPage = 20
  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

  // フォーム初期値
  const emptyPlayer: Partial<AdminPlayer> = {
    reg_no: null,
    player_name: '',
    name_kana: '',
    grade: 'B1',
    birth_date: null,
    hometown: '',
    external_url: null,
    is_active: true,
  }

  const [formData, setFormData] = useState<Partial<AdminPlayer>>(emptyPlayer)

  // デバウンス検索（パフォーマンス重視）
  const debouncedSearch = useMemo(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchPlayers(1, searchTerm, selectedGrade, activeFilter)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedGrade, activeFilter])

  // 高速データフェッチ
  const fetchPlayers = useCallback(async (
    page = currentPage,
    search = searchTerm,
    grade = selectedGrade,
    active = activeFilter
  ) => {
    try {
      setLoading(page === 1) // 初回のみローディング表示

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { q: search }),
        ...(grade && { grade }),
        ...(active && { isActive: active }),
        sortBy: 'reg_no',
        sortOrder: 'asc',
      })

      const response = await fetch(`/api/admin/players?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: AdminPlayersResponse = await response.json()

      setPlayers(data.players)
      setTotalPlayers(data.total)
      setHasMore(data.hasMore)
      setCurrentPage(page)
      setError(null)

    } catch (err) {
      console.error('Failed to fetch players:', err)
      setError('選手データの取得に失敗しました')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, selectedGrade, activeFilter, itemsPerPage])

  // 初回ロード
  useEffect(() => {
    fetchPlayers()
  }, [])

  // 保存処理（高速化）
  const handleSave = useCallback(async () => {
    if (!formData.player_name?.trim()) {
      setError('選手名は必須です')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const url = isCreating
        ? '/api/admin/players'
        : `/api/admin/players/${editingPlayer?.id}`

      const method = isCreating ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      // 成功：一覧を再取得
      await fetchPlayers()
      handleCancel()

      // 成功メッセージ（シンプル）
      const message = isCreating ? '選手を作成しました' : '選手を更新しました'
      console.info(message)

    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }, [formData, isCreating, editingPlayer, fetchPlayers])

  // フォームリセット
  const handleCancel = useCallback(() => {
    setIsCreating(false)
    setEditingPlayer(null)
    setFormData(emptyPlayer)
    setError(null)
  }, [emptyPlayer])

  // 編集開始
  const startEdit = useCallback((player: AdminPlayer) => {
    setEditingPlayer(player)
    setFormData(player)
    setIsCreating(false)
    setError(null)
  }, [])

  // 削除（ソフトデリート）
  const handleDelete = useCallback(async (player: AdminPlayer) => {
    if (!confirm(`選手「${player.player_name}」を非アクティブにしますか？`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/players/${player.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      await fetchPlayers()
      console.info(`選手「${player.player_name}」を非アクティブにしました`)

    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }, [fetchPlayers])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={() => router.back()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1"
            >
              <span>←</span>
              <span>戻る</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">選手管理</h1>
          <p className="text-gray-600">選手情報の作成・編集・管理</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true)
            setFormData(emptyPlayer)
            setEditingPlayer(null)
            setError(null)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          新しい選手を追加
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 選手一覧 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 検索・フィルタ（コンパクト） */}
          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="選手名・登録番号で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">全級別</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
              </select>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">全選手</option>
                <option value="true">現役のみ</option>
                <option value="false">非アクティブのみ</option>
              </select>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>全{totalPlayers}人</span>
              {dataMode !== 'live' && (
                <span className="text-yellow-600 font-medium">DEMOモード：読み取り専用</span>
              )}
            </div>
          </div>

          {/* 選手テーブル */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                読み込み中...
              </div>
            ) : players.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                条件に合う選手が見つかりませんでした
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          登録番号
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          選手名
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          級別
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {players.map((player) => (
                        <tr
                          key={player.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            !player.is_active ? 'opacity-60' : ''
                          }`}
                          onClick={() => startEdit(player)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {player.reg_no || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {player.player_name}
                            </div>
                            {player.name_kana && (
                              <div className="text-sm text-gray-500">
                                {player.name_kana}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              player.grade === 'A1' ? 'bg-red-100 text-red-800' :
                              player.grade === 'A2' ? 'bg-orange-100 text-orange-800' :
                              player.grade === 'B1' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {player.grade}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              player.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {player.is_active ? '現役' : '非アクティブ'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(player)
                              }}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              disabled={dataMode !== 'live' || !player.is_active}
                            >
                              非アクティブ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ページネーション */}
                <div className="bg-white px-4 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      {totalPlayers} 人中 {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalPlayers)} 人を表示
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchPlayers(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        前へ
                      </button>
                      <span className="px-3 py-1 text-sm">
                        {currentPage}
                      </span>
                      <button
                        onClick={() => fetchPlayers(currentPage + 1)}
                        disabled={!hasMore || loading}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        次へ
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* フォーム */}
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isCreating ? '新しい選手を作成' : editingPlayer ? '選手情報を編集' : '選手を選択してください'}
            </h2>

            {(isCreating || editingPlayer) && (
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      登録番号
                    </label>
                    <input
                      type="number"
                      min="1000"
                      max="9999"
                      value={formData.reg_no || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        reg_no: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="4桁数字"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      級別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.grade || 'B1'}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value as 'A1' | 'A2' | 'B1' | 'B2' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    選手名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.player_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, player_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="例：田中太郎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ひらがな名前
                  </label>
                  <input
                    type="text"
                    value={formData.name_kana || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_kana: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="例：たなかたろう"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      生年月日
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      出身地
                    </label>
                    <input
                      type="text"
                      value={formData.hometown || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="例：大阪府"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    外部リンク (マクール等)
                  </label>
                  <input
                    type="url"
                    value={formData.external_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    現役選手
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={dataMode !== 'live' || saving}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {saving ? '保存中...' : (isCreating ? '作成' : '更新')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    キャンセル
                  </button>
                </div>

                {dataMode !== 'live' && (
                  <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                    DEMOモードでは保存できません。LIVEモードに変更してください。
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}