/**
 * リアルデータ取り込み機能
 * 2025年3月以降の公式API終了に対応した代替手段
 */

import { parseCSV, readCSVFile } from '@/lib/import/csv'

// レースデータの型定義
export interface RaceDataImport {
  race_id: string
  venue: string
  date: string
  race_no: number
  title: string
  close_at: string
}

export interface EntryDataImport {
  race_id: string
  lane: number
  player_name: string
  player_grade: 'A1' | 'A2' | 'B1' | 'B2'
  st_time: number
  exhibition_time: number
  motor_rate: number
}

export interface ResultDataImport {
  race_id: string
  win_triple: string
  payout: number
  popularity: number
}

// Phase 1: 選手マスタデータの型定義
export interface PlayerMasterImport {
  registration_number: number  // 登録番号
  player_name: string         // 選手名
  grade: 'A1' | 'A2' | 'B1' | 'B2'  // 級別
  birth_place: string         // 出身地
  birth_date: string          // 生年月日 (YYYY-MM-DD)
  height: number              // 身長 (cm)
  weight: number              // 体重 (kg)
  debut_date?: string         // デビュー日 (オプション)
  branch?: string             // 支部 (オプション)
}

// データ取り込み設定
export interface DataImportConfig {
  mode: 'csv' | 'api' | 'scraping'
  source?: string
  apiKey?: string
}

/**
 * CSVファイルからレースデータを取り込み
 */
export async function importRaceDataFromCSV(file: File): Promise<{
  success: boolean
  data: RaceDataImport[]
  errors: string[]
}> {
  try {
    const parseResult = await readCSVFile<Record<string, string>>(file)

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        data: [],
        errors: parseResult.errors.map(e => `行${e.row}: ${e.message}`)
      }
    }

    const raceData: RaceDataImport[] = []
    const errors: string[] = []

    parseResult.data.forEach((row, index) => {
      try {
        // CSVデータをRaceDataImport形式に変換
        const race: RaceDataImport = {
          race_id: row.race_id || `suminoe-${row.date?.replace(/-/g, '')}-${row.race_no}R`,
          venue: row.venue || 'suminoe',
          date: row.date || new Date().toISOString().split('T')[0],
          race_no: parseInt(row.race_no || '1'),
          title: row.title || `${row.race_no}R`,
          close_at: row.close_at || new Date().toISOString()
        }
        raceData.push(race)
      } catch (error) {
        errors.push(`行${index + 2}: データ変換エラー - ${error}`)
      }
    })

    return {
      success: errors.length === 0,
      data: raceData,
      errors
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`ファイル読み込みエラー: ${error}`]
    }
  }
}

/**
 * CSVファイルから出走データを取り込み
 */
export async function importEntryDataFromCSV(file: File): Promise<{
  success: boolean
  data: EntryDataImport[]
  errors: string[]
}> {
  try {
    const parseResult = await readCSVFile<Record<string, string>>(file)

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        data: [],
        errors: parseResult.errors.map(e => `行${e.row}: ${e.message}`)
      }
    }

    const entryData: EntryDataImport[] = []
    const errors: string[] = []

    parseResult.data.forEach((row, index) => {
      try {
        const entry: EntryDataImport = {
          race_id: row.race_id || `suminoe-${row.date?.replace(/-/g, '')}-${row.race_no}R`,
          lane: parseInt(row.lane || '1'),
          player_name: row.player_name || '未定',
          player_grade: (row.player_grade as 'A1' | 'A2' | 'B1' | 'B2') || 'B2',
          st_time: parseFloat(row.st_time || '0.15'),
          exhibition_time: parseFloat(row.exhibition_time || '6.80'),
          motor_rate: parseFloat(row.motor_rate || '40')
        }
        entryData.push(entry)
      } catch (error) {
        errors.push(`行${index + 2}: データ変換エラー - ${error}`)
      }
    })

    return {
      success: errors.length === 0,
      data: entryData,
      errors
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`ファイル読み込みエラー: ${error}`]
    }
  }
}

/**
 * CSVファイルから選手マスタデータを取り込み（Phase 1）
 */
export async function importPlayerMasterFromCSV(file: File): Promise<{
  success: boolean
  data: PlayerMasterImport[]
  errors: string[]
}> {
  try {
    const parseResult = await readCSVFile<Record<string, string>>(file)

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        data: [],
        errors: parseResult.errors.map(e => `行${e.row}: ${e.message}`)
      }
    }

    const playerData: PlayerMasterImport[] = []
    const errors: string[] = []

    parseResult.data.forEach((row, index) => {
      try {
        // バリデーション
        const registrationNumber = parseInt(row.registration_number || '0')
        if (!registrationNumber || registrationNumber < 1000 || registrationNumber > 9999) {
          throw new Error('登録番号は4桁の数値である必要があります')
        }

        if (!row.player_name || row.player_name.trim().length === 0) {
          throw new Error('選手名は必須です')
        }

        const validGrades = ['A1', 'A2', 'B1', 'B2']
        if (!validGrades.includes(row.grade)) {
          throw new Error('級別はA1, A2, B1, B2のいずれかである必要があります')
        }

        const height = parseFloat(row.height || '0')
        const weight = parseFloat(row.weight || '0')
        if (height < 140 || height > 200) {
          throw new Error('身長は140-200cmの範囲で入力してください')
        }
        if (weight < 40 || weight > 100) {
          throw new Error('体重は40-100kgの範囲で入力してください')
        }

        // 生年月日の形式チェック（YYYY-MM-DD）
        const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!birthDateRegex.test(row.birth_date || '')) {
          throw new Error('生年月日はYYYY-MM-DD形式で入力してください')
        }

        const player: PlayerMasterImport = {
          registration_number: registrationNumber,
          player_name: row.player_name.trim(),
          grade: row.grade as 'A1' | 'A2' | 'B1' | 'B2',
          birth_place: row.birth_place || '不明',
          birth_date: row.birth_date,
          height: height,
          weight: weight,
          debut_date: row.debut_date || undefined,
          branch: row.branch || undefined
        }
        playerData.push(player)
      } catch (error) {
        errors.push(`行${index + 2}: ${error}`)
      }
    })

    return {
      success: errors.length === 0,
      data: playerData,
      errors
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`ファイル読み込みエラー: ${error}`]
    }
  }
}

/**
 * CSVファイルから結果データを取り込み
 */
export async function importResultDataFromCSV(file: File): Promise<{
  success: boolean
  data: ResultDataImport[]
  errors: string[]
}> {
  try {
    const parseResult = await readCSVFile<Record<string, string>>(file)

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        data: [],
        errors: parseResult.errors.map(e => `行${e.row}: ${e.message}`)
      }
    }

    const resultData: ResultDataImport[] = []
    const errors: string[] = []

    parseResult.data.forEach((row, index) => {
      try {
        const result: ResultDataImport = {
          race_id: row.race_id || `suminoe-${row.date?.replace(/-/g, '')}-${row.race_no}R`,
          win_triple: row.win_triple || row.triple || '1-2-3',
          payout: parseInt(row.payout || '1000'),
          popularity: parseInt(row.popularity || '1')
        }
        resultData.push(result)
      } catch (error) {
        errors.push(`行${index + 2}: データ変換エラー - ${error}`)
      }
    })

    return {
      success: errors.length === 0,
      data: resultData,
      errors
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [`ファイル読み込みエラー: ${error}`]
    }
  }
}

/**
 * サードパーティAPIからのデータ取得（将来実装）
 */
export async function fetchDataFromAPI(config: DataImportConfig): Promise<{
  success: boolean
  message: string
}> {
  // TODO: team-naveのBoatRace DataBase API等との連携実装
  return {
    success: false,
    message: 'API連携は今後実装予定です'
  }
}

/**
 * CSVテンプレートの生成
 */
export function generateRaceDataTemplate(): string {
  const headers = ['race_id', 'venue', 'date', 'race_no', 'title', 'close_at']
  const sampleData = [
    'suminoe-20250926-1R,suminoe,2025-09-26,1,1R,2025-09-26T10:45:00Z',
    'suminoe-20250926-2R,suminoe,2025-09-26,2,2R,2025-09-26T11:10:00Z'
  ]

  return [headers.join(','), ...sampleData].join('\n')
}

export function generateEntryDataTemplate(): string {
  const headers = ['race_id', 'lane', 'player_name', 'player_grade', 'st_time', 'exhibition_time', 'motor_rate']
  const sampleData = [
    'suminoe-20250926-1R,1,田中太郎,A1,0.15,6.80,45.2',
    'suminoe-20250926-1R,2,佐藤次郎,A2,0.18,6.85,42.1'
  ]

  return [headers.join(','), ...sampleData].join('\n')
}

export function generateResultDataTemplate(): string {
  const headers = ['race_id', 'win_triple', 'payout', 'popularity']
  const sampleData = [
    'suminoe-20250926-1R,1-2-3,12500,3',
    'suminoe-20250926-2R,2-1-4,8600,1'
  ]

  return [headers.join(','), ...sampleData].join('\n')
}