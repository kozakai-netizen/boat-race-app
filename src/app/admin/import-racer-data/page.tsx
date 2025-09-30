'use client'

import { useState } from 'react'

export default function ImportRacerDataPage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [progress, setProgress] = useState<string>('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files)
    setResults([])
    setProgress('')
  }

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('ファイルを選択してください')
      return
    }

    setIsUploading(true)
    setResults([])
    setProgress('アップロード開始...')

    const uploadResults = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      setProgress(`${i + 1}/${selectedFiles.length}: ${file.name} 処理中...`)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('adminToken', process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'boat_admin_2025')

        const response = await fetch('/api/import-racer-data', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (data.success) {
          uploadResults.push({
            filename: file.name,
            status: 'success',
            summary: data.summary,
            details: data.details
          })
        } else {
          uploadResults.push({
            filename: file.name,
            status: 'error',
            error: data.error
          })
        }

      } catch (error) {
        uploadResults.push({
          filename: file.name,
          status: 'error',
          error: `アップロードエラー: ${error}`
        })
      }
    }

    setResults(uploadResults)
    setProgress('完了！')
    setIsUploading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          👥 選手データインポート（JLC）
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">JLCファイルアップロード</h2>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              JLC（日本モーターボート競走会）の選手期別成績ファイル（.txt）をアップロードしてください。
              <br />
              対応ファイル：fan2310.txt（2024前期）、fan2404.txt（2024後期）、fan2504.txt（2025前期）、fan2410.txt（2025後期）
            </p>

            <input
              type="file"
              accept=".txt"
              multiple
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={isUploading}
            />
          </div>

          {selectedFiles && selectedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold text-gray-700 mb-2">選択されたファイル:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {Array.from(selectedFiles).map((file, index) => (
                  <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isUploading || !selectedFiles || selectedFiles.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isUploading ? 'アップロード中...' : 'インポート開始'}
          </button>

          {progress && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">{progress}</p>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">インポート結果</h2>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="font-bold text-gray-800 mb-2">
                    📁 {result.filename}
                  </div>

                  {result.status === 'success' ? (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {result.summary.totalRecords}
                          </div>
                          <div className="text-xs text-green-700">総レコード数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {result.summary.validRecords}
                          </div>
                          <div className="text-xs text-blue-700">有効レコード数</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {result.summary.inserted}
                          </div>
                          <div className="text-xs text-purple-700">保存成功</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">
                            {result.summary.errors}
                          </div>
                          <div className="text-xs text-red-700">エラー</div>
                        </div>
                      </div>

                      {result.details && result.details.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-bold text-gray-700">エラー詳細（最初の10件）:</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {result.details.map((detail: string, i: number) => (
                              <div key={i}>{detail}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-700">
                      ❌ {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}