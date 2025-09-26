'use client'

import { useState } from 'react'
import { importRaceDataFromCSV, importEntryDataFromCSV, importResultDataFromCSV, generateRaceDataTemplate, generateEntryDataTemplate, generateResultDataTemplate } from '@/lib/data-import'

interface DataImportModalProps {
  isOpen: boolean
  onClose: () => void
}

type ImportType = 'race' | 'entry' | 'result'

export default function DataImportModal({ isOpen, onClose }: DataImportModalProps) {
  const [activeTab, setActiveTab] = useState<ImportType>('race')
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    data?: unknown[]
    errors?: string[]
  } | null>(null)

  const handleFileImport = async (file: File, type: ImportType) => {
    setIsImporting(true)
    setImportResult(null)

    try {
      let result
      switch (type) {
        case 'race':
          result = await importRaceDataFromCSV(file)
          break
        case 'entry':
          result = await importEntryDataFromCSV(file)
          break
        case 'result':
          result = await importResultDataFromCSV(file)
          break
        default:
          throw new Error('不明なインポートタイプです')
      }

      setImportResult({
        success: result.success,
        message: result.success
          ? `${result.data.length}件のデータを正常に取り込みました`
          : 'データ取り込み中にエラーが発生しました',
        data: result.data,
        errors: result.errors
      })
    } catch (error) {
      setImportResult({
        success: false,
        message: `インポートエラー: ${error}`,
        errors: [String(error)]
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = (type: ImportType) => {
    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'race':
        csvContent = generateRaceDataTemplate()
        filename = 'race_data_template.csv'
        break
      case 'entry':
        csvContent = generateEntryDataTemplate()
        filename = 'entry_data_template.csv'
        break
      case 'result':
        csvContent = generateResultDataTemplate()
        filename = 'result_data_template.csv'
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'race' as ImportType, label: 'レースデータ', description: 'レース基本情報の取り込み' },
    { id: 'entry' as ImportType, label: '出走データ', description: '選手・出走情報の取り込み' },
    { id: 'result' as ImportType, label: '結果データ', description: 'レース結果・払戻の取り込み' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">📊 リアルデータ取り込み</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 重要なお知らせ */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">⚠️</span>
            <div className="text-sm text-yellow-800">
              <strong>重要:</strong> 2025年3月5日にBOAT RACE公式のデータ配信サービスが終了しました。<br/>
              現在はCSVファイル手動取り込みでのデータ更新に対応しています。
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {tabs.find(t => t.id === activeTab)?.description}
          </div>

          {/* テンプレートダウンロード */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900">CSVテンプレート</div>
              <div className="text-xs text-gray-500">正しい形式でデータを準備してください</div>
            </div>
            <button
              onClick={() => downloadTemplate(activeTab)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              📥 ダウンロード
            </button>
          </div>

          {/* ファイルアップロード */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl text-gray-400 mb-2">📄</div>
              <div className="text-sm text-gray-600 mb-3">
                CSVファイルをドラッグ&ドロップするか、ファイルを選択してください
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleFileImport(file, activeTab)
                  }
                }}
                className="hidden"
                id={`file-${activeTab}`}
              />
              <label
                htmlFor={`file-${activeTab}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                📁 ファイルを選択
              </label>
            </div>
          </div>

          {/* インポート結果 */}
          {isImporting && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <div className="text-sm text-gray-600 mt-2">データを取り込み中...</div>
            </div>
          )}

          {importResult && (
            <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className={`flex items-center space-x-2 ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                <span className="text-lg">{importResult.success ? '✅' : '❌'}</span>
                <span className="font-medium">{importResult.message}</span>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-red-800 mb-1">エラー詳細:</div>
                  <div className="text-xs text-red-700 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.success && importResult.data && (
                <div className="mt-3 text-sm text-green-700">
                  取り込み完了: {importResult.data.length}件のデータ
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}