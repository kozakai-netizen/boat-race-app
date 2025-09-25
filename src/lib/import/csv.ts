/**
 * CSV パース・エクスポート機能
 * 軽量実装（外部依存なし）
 */

export interface ParseResult<T = Record<string, string>> {
  data: T[]
  errors: Array<{
    row: number
    message: string
  }>
  headers?: string[]
}

/**
 * CSV文字列をパースして配列に変換
 */
export function parseCSV<T = Record<string, string>>(
  csvText: string,
  options: {
    delimiter?: string
    hasHeader?: boolean
    skipEmptyLines?: boolean
  } = {}
): ParseResult<T> {
  const {
    delimiter = ',',
    hasHeader = true,
    skipEmptyLines = true
  } = options

  const lines = csvText.split('\n')
  const result: ParseResult<T> = {
    data: [],
    errors: []
  } as ParseResult<T>

  if (lines.length === 0) {
    return result
  }

  let headers: string[] = []
  let dataStartIndex = 0

  // ヘッダー処理
  if (hasHeader && lines.length > 0) {
    const headerLine = lines[0].trim()
    if (headerLine) {
      headers = parseCSVLine(headerLine, delimiter)
      result.headers = headers
      dataStartIndex = 1
    }
  }

  // データ行の処理
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line && skipEmptyLines) {
      continue
    }

    if (!line) {
      result.errors.push({
        row: i + 1,
        message: '空行が含まれています'
      })
      continue
    }

    try {
      const values = parseCSVLine(line, delimiter)

      if (hasHeader && headers.length > 0) {
        const row: Record<string, string> = {}
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[j] || ''
        }
        result.data.push(row as T)
      } else {
        // ヘッダーなしの場合は配列として返す
        result.data.push(values as T)
      }
    } catch (error) {
      result.errors.push({
        row: i + 1,
        message: `CSV形式エラー: ${error instanceof Error ? error.message : 'パースに失敗しました'}`
      })
    }
  }

  return result
}

/**
 * 1行のCSVをパースして配列に変換
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされたクォート
        current += '"'
        i += 2
        continue
      }
      // クォート開始/終了
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      // フィールド区切り
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
    i++
  }

  // 最後のフィールド
  result.push(current.trim())

  return result
}

/**
 * ファイルを読み込んでCSVとしてパース
 */
export function readCSVFile<T = Record<string, string>>(file: File): Promise<ParseResult<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string
        const result = parseCSV<T>(csvText)
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'))
    }

    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * データをCSV形式に変換してダウンロード
 */
export function downloadCSV(
  data: Record<string, string | number>[],
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    return
  }

  const csvHeaders = headers || Object.keys(data[0])
  const csvRows = [
    csvHeaders.join(','),
    ...data.map(row =>
      csvHeaders.map(header => {
        const value = row[header] || ''
        // カンマやクォートが含まれる場合はクォートで囲む
        if (String(value).includes(',') || String(value).includes('"')) {
          return `"${String(value).replace(/"/g, '""')}"`
        }
        return String(value)
      }).join(',')
    )
  ]

  const csvContent = csvRows.join('\n')
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

/**
 * CSVテンプレートをダウンロード
 */
export function downloadPlayersTemplate(): void {
  const headers = ['reg_no', 'name', 'grade', 'name_kana', 'external_url']
  const sampleData = [
    {
      reg_no: '4321',
      name: '田中 太郎',
      grade: 'A1',
      name_kana: 'タナカ タロウ',
      external_url: 'https://sp.macour.jp/boatracer/'
    },
    {
      reg_no: '5678',
      name: '佐藤 花子',
      grade: 'A2',
      name_kana: 'サトウ ハナコ',
      external_url: ''
    }
  ]

  downloadCSV(sampleData, 'players_template.csv', headers)
}