'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeftIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { readCSVFile, downloadCSV, downloadPlayersTemplate } from '@/lib/import/csv'
import {
  validatePlayersRow,
  validateHeaders,
  PlayersRow,
  PlayersImportResult,
  REQUIRED_HEADERS,
  ALL_HEADERS
} from '@/lib/import/schemas'

const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE || 'mock'
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN

interface ValidationError {
  row: number
  reg_no?: string
  name?: string
  field: string
  message: string
}

interface PreviewRow {
  row: number
  data: Record<string, string>
  validatedData?: PlayersRow
  isValid: boolean
  errors: Array<{ field: string; message: string }>
}

export default function PlayersImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewRow[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [headerValidation, setHeaderValidation] = useState<{ isValid: boolean; errors: string[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState<PlayersImportResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const PREVIEW_LIMIT = 20

  // ファイル選択ハンドラー
  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      alert('CSVファイルを選択してください')
      return
    }

    setFile(selectedFile)
    setIsLoading(true)

    try {
      const result = await readCSVFile(selectedFile)

      if (result.errors.length > 0) {
        console.warn('CSV parsing errors:', result.errors)
      }

      // ヘッダーバリデーション
      if (result.headers) {
        const headerValidation = validateHeaders(result.headers)
        setHeaderValidation(headerValidation)

        if (!headerValidation.isValid) {
          setPreviewData([])
          setValidationErrors([])
          return
        }
      }

      // データバリデーション（先頭20行）
      const previewRows: PreviewRow[] = []
      const errors: ValidationError[] = []

      const dataToPreview = result.data.slice(0, PREVIEW_LIMIT)

      dataToPreview.forEach((row, index) => {
        const actualRowNumber = index + 2 // ヘッダー行を考慮
        const validation = validatePlayersRow(row as Record<string, string>)

        const previewRow: PreviewRow = {
          row: actualRowNumber,
          data: row as Record<string, string>,
          validatedData: validation.data,
          isValid: validation.isValid,
          errors: validation.errors
        }

        previewRows.push(previewRow)

        // エラー行の記録
        if (!validation.isValid) {
          validation.errors.forEach(error => {
            errors.push({
              row: actualRowNumber,
              reg_no: row.reg_no,
              name: row.name,
              field: error.field,
              message: error.message
            })
          })
        }
      })

      setPreviewData(previewRows)
      setValidationErrors(errors)
    } catch (error) {
      console.error('File processing error:', error)
      alert('ファイルの処理に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // ドラッグ&ドロップハンドラー
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // インポート実行
  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)

    try {
      const result = await readCSVFile(file)

      if (!result.headers || !validateHeaders(result.headers).isValid) {
        alert('CSVのヘッダーが正しくありません')
        return
      }

      // 全データのバリデーション
      const validatedData: PlayersRow[] = []
      const allErrors: ValidationError[] = []

      result.data.forEach((row, index) => {
        const actualRowNumber = index + 2
        const validation = validatePlayersRow(row as Record<string, string>)

        if (validation.isValid && validation.data) {
          validatedData.push(validation.data)
        } else {
          validation.errors.forEach(error => {
            allErrors.push({
              row: actualRowNumber,
              reg_no: (row as Record<string, string>).reg_no,
              name: (row as Record<string, string>).name,
              field: error.field,
              message: error.message
            })
          })
        }
      })

      if (allErrors.length > 0) {
        const proceed = confirm(`${allErrors.length}個のエラーがあります。エラー行をスキップして続行しますか？`)
        if (!proceed) {
          setValidationErrors(allErrors)
          return
        }
      }

      // APIリクエスト
      const response = await fetch('/api/admin/import/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': ADMIN_TOKEN || ''
        },
        body: JSON.stringify({
          data: validatedData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'インポートに失敗しました')
      }

      const importResult: PlayersImportResult = await response.json()
      setImportResult(importResult)
      setShowResult(true)

    } catch (error) {
      console.error('Import error:', error)
      alert(`インポートエラー: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // エラーCSVダウンロード
  const downloadErrors = () => {
    if (importResult?.errors && importResult.errors.length > 0) {
      downloadCSV(
        importResult.errors.map(error => ({
          row: error.row,
          reg_no: error.reg_no || '',
          name: error.name || '',
          field: error.field || '',
          message: error.message
        })),
        'import_errors.csv',
        ['row', 'reg_no', 'name', 'field', 'message']
      )
    } else if (validationErrors.length > 0) {
      downloadCSV(
        validationErrors.map(error => ({
          row: error.row,
          reg_no: error.reg_no || '',
          name: error.name || '',
          field: error.field || '',
          message: error.message
        })),
        'validation_errors.csv',
        ['row', 'reg_no', 'name', 'field', 'message']
      )
    }
  }

  const canImport = file && headerValidation?.isValid && DATA_MODE === 'live' && !isLoading
  const hasErrors = validationErrors.length > 0 || (importResult?.errors && importResult.errors.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/admin"
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              <span>管理画面</span>
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">選手データインポート</span>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">選手データCSVインポート</h1>
            <p className="text-gray-600">
              選手の登録番号・氏名・級別情報を一括で登録・更新します
            </p>

            {/* Status Badge */}
            <div className="mt-4 flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                DATA_MODE === 'live'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {DATA_MODE === 'live' ? '🔴 LIVE モード' : '📊 DEMO モード'}
              </div>

              {DATA_MODE !== 'live' && (
                <div className="flex items-center space-x-1 text-amber-600">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span className="text-sm">DEMOモードでは保存できません</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 CSVフォーマット</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>必須列:</strong> {REQUIRED_HEADERS.join(', ')}</p>
            <p><strong>任意列:</strong> name_kana, external_url</p>
            <p><strong>文字コード:</strong> UTF-8</p>
            <p><strong>区切り:</strong> カンマ (,)</p>
          </div>
          <div className="mt-3">
            <button
              onClick={downloadPlayersTemplate}
              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              <span>テンプレートCSVをダウンロード</span>
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. CSVファイル選択</h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto" />
                <p className="text-lg font-medium text-green-800">{file.name}</p>
                <p className="text-sm text-green-600">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ファイルを変更
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    CSVファイルをドラッグ&ドロップ
                  </p>
                  <p className="text-sm text-gray-600">
                    または
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      ファイルを選択
                    </button>
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Header Validation */}
        {headerValidation && (
          <div className={`p-4 rounded-lg mb-6 ${
            headerValidation.isValid ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <h3 className={`font-medium mb-2 ${
              headerValidation.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {headerValidation.isValid ? '✅ ヘッダー検証: 正常' : '❌ ヘッダー検証: エラー'}
            </h3>
            {!headerValidation.isValid && (
              <ul className="text-sm text-red-700 space-y-1">
                {headerValidation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                2. プレビュー (先頭{PREVIEW_LIMIT}行)
              </h2>
              <div className="text-sm text-gray-600">
                エラー: {validationErrors.length}行
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      行
                    </th>
                    {ALL_HEADERS.map(header => (
                      <th key={header} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                        {REQUIRED_HEADERS.includes(header as typeof REQUIRED_HEADERS[number]) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index} className={
                      row.isValid ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'
                    }>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.row}
                      </td>
                      {ALL_HEADERS.map(header => (
                        <td key={header} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.data[header] || ''}
                        </td>
                      ))}
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        {row.isValid ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {hasErrors && (
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-red-800">
                ⚠️ バリデーションエラー ({validationErrors.length + (importResult?.errors?.length || 0)}件)
              </h3>
              <button
                onClick={downloadErrors}
                className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>エラー一覧をCSVでダウンロード</span>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {validationErrors.slice(0, 10).map((error, index) => (
                <div key={index} className="text-sm text-red-700 py-1">
                  行{error.row}: {error.message} (フィールド: {error.field})
                </div>
              ))}
              {validationErrors.length > 10 && (
                <div className="text-sm text-red-600 py-1">
                  ...他 {validationErrors.length - 10} 件のエラー
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">3. インポート実行</h2>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleImport}
              disabled={!canImport}
              className={`px-6 py-3 rounded-lg font-medium ${
                canImport
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? '処理中...' : 'インポート実行'}
            </button>

            {!canImport && (
              <div className="text-sm text-gray-600">
                {!file && 'CSVファイルを選択してください'}
                {file && !headerValidation?.isValid && 'ヘッダーエラーを修正してください'}
                {file && headerValidation?.isValid && DATA_MODE !== 'live' && 'LIVEモードでのみ実行可能'}
              </div>
            )}
          </div>
        </div>

        {/* Import Result */}
        {showResult && importResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className={`h-16 w-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  importResult.success ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {importResult.success ? (
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  ) : (
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  インポート{importResult.success ? '完了' : '一部完了'}
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>総行数:</span>
                  <span>{importResult.total}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>成功:</span>
                  <span>{importResult.successCount}</span>
                </div>
                {importResult.errorCount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>エラー:</span>
                    <span>{importResult.errorCount}</span>
                  </div>
                )}
                {(importResult.skipCount || 0) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>スキップ:</span>
                    <span>{importResult.skipCount}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowResult(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  閉じる
                </button>
                <Link
                  href="/admin/players"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                >
                  選手一覧へ
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}