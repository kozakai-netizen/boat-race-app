'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Race {
  race_id: string
  date: string
  venue: string
  race_no: number
  grade: 'normal' | 'major'
  close_at: string
}

export default function RacesManagement() {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRace, setEditingRace] = useState<Race | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const [formData, setFormData] = useState<Partial<Race>>({
    race_id: '',
    date: '',
    venue: 'suminoe',
    race_no: 1,
    grade: 'normal',
    close_at: ''
  })

  const dataMode = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'

  useEffect(() => {
    fetchRaces()
  }, [])

  const fetchRaces = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('race')
        .select('*')
        .order('date', { ascending: false })
        .order('race_no', { ascending: true })

      if (error) throw error
      setRaces(data || [])
    } catch (error) {
      console.error('Error fetching races:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (dataMode !== 'live') {
      alert('DEMOモードでは保存できません。LIVEモードに変更してください。')
      return
    }

    try {
      setLoading(true)

      // Generate race_id if creating new race
      if (isCreating && formData.date && formData.venue && formData.race_no) {
        const dateStr = formData.date.replace(/-/g, '')
        formData.race_id = `${formData.venue}-${dateStr}-${formData.race_no}R`
      }

      const { error } = isCreating
        ? await supabase.from('race').insert([formData])
        : await supabase.from('race').update(formData).eq('race_id', editingRace!.race_id)

      if (error) throw error

      await fetchRaces()
      resetForm()
      alert(isCreating ? 'レースを作成しました' : 'レースを更新しました')
    } catch (error) {
      console.error('Error saving race:', error)
      alert('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (race: Race) => {
    if (!confirm(`レース ${race.race_id} を削除しますか？`)) return

    if (dataMode !== 'live') {
      alert('DEMOモードでは削除できません。LIVEモードに変更してください。')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('race')
        .delete()
        .eq('race_id', race.race_id)

      if (error) throw error

      await fetchRaces()
      alert('レースを削除しました')
    } catch (error) {
      console.error('Error deleting race:', error)
      alert('削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const startCreating = () => {
    setIsCreating(true)
    setEditingRace(null)
    setFormData({
      race_id: '',
      date: new Date().toISOString().split('T')[0],
      venue: 'suminoe',
      race_no: 1,
      grade: 'normal',
      close_at: ''
    })
  }

  const startEditing = (race: Race) => {
    setIsCreating(false)
    setEditingRace(race)
    setFormData({
      ...race,
      date: race.date,
      close_at: race.close_at ? new Date(race.close_at).toISOString().slice(0, 16) : ''
    })
  }

  const resetForm = () => {
    setIsCreating(false)
    setEditingRace(null)
    setFormData({
      race_id: '',
      date: '',
      venue: 'suminoe',
      race_no: 1,
      grade: 'normal',
      close_at: ''
    })
  }

  // Filter races based on search term
  const filteredRaces = races.filter(race =>
    race.race_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    race.venue.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRaces = filteredRaces.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRaces.length / itemsPerPage)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">レース管理</h1>
          <p className="text-gray-600">レース情報の作成・編集・削除</p>
        </div>
        <button
          onClick={startCreating}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          新しいレースを追加
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Race List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="レースIDや会場で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Race Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    レースID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    レース番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    グレード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : currentRaces.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      レースが見つかりませんでした
                    </td>
                  </tr>
                ) : (
                  currentRaces.map((race) => (
                    <tr
                      key={race.race_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => startEditing(race)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {race.race_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {race.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {race.race_no}R
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          race.grade === 'major'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {race.grade === 'major' ? '重賞' : '一般戦'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(race)
                          }}
                          className="text-red-600 hover:text-red-900"
                          disabled={dataMode !== 'live'}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {filteredRaces.length} 件中 {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRaces.length)} 件を表示
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    <span className="px-3 py-1 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {isCreating ? '新しいレースを作成' : editingRace ? 'レースを編集' : 'レースを選択してください'}
            </h2>

            {(isCreating || editingRace) && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日付
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会場
                  </label>
                  <select
                    value={formData.venue}
                    onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="suminoe">住之江</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    レース番号
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={formData.race_no}
                    onChange={(e) => setFormData(prev => ({ ...prev, race_no: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    グレード
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value as 'normal' | 'major' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="normal">一般戦</option>
                    <option value="major">重賞</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    締切時刻
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.close_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, close_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={dataMode !== 'live' || loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? '保存中...' : (isCreating ? '作成' : '更新')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
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