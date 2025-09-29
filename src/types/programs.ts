/**
 * Programs API型定義
 * 実証実験結果に基づく安全な型システム
 */

export interface RacerEntry {
  pit: number                           // 1-6 (艇番)
  racer_registration_number: number     // 選手登録番号
  racer_name: string                    // 選手名
  branch?: string                       // 支部
  birth_date?: string                   // 生年月日
  height?: number                       // 身長
  weight?: number                       // 体重
  flying_count?: number                 // F数
  late_count?: number                   // L数
  start_timing?: number                 // ST
}

export interface RaceProgram {
  race_no: number                       // レース番号 (1-12)
  title: string                         // レースタイトル
  distance?: number                     // 距離
  turn_direction?: 'left' | 'right'     // ターン方向
  entries: RacerEntry[]                 // 出走選手一覧
  deadline?: string                     // 投票締切時刻 (ISO string)
}

export interface StadiumProgram {
  stadium: number                       // 会場番号 (Programs API形式)
  stadium_tel_code?: string             // 会場電話番号
  dates: string[]                       // 開催日 (YYYY-MM-DD形式)
  races: RaceProgram[]                  // レースプログラム
}

export interface ProgramsApiResponse {
  results: StadiumProgram[]             // 会場別プログラム
  updated_at?: string                   // データ更新日時
}

/**
 * データベース保存用の正規化された型
 */
export interface NormalizedRacerEntry {
  race_id: string                       // "YYYY-MM-DD-{venue_id}-{race_no}"
  venue_id: number                      // 標準会場番号 (1-24)
  race_date: string                     // YYYY-MM-DD
  race_no: number                       // 1-12
  pit: number                           // 1-6
  racer_registration_number: number     // 選手登録番号
  racer_name: string                    // 選手名
  created_at?: string                   // 取得日時
  updated_at?: string                   // 更新日時
}

/**
 * 選手統計データ (将来拡張用)
 */
export interface RacerStats {
  racer_registration_number: number
  racer_name: string
  total_races?: number                  // 総出走回数
  win_rate?: number                     // 勝率
  quinella_rate?: number                // 2連率
  trifecta_rate?: number                // 3連率
  avg_start_timing?: number             // 平均ST
  last_updated?: string
}

/**
 * エラーハンドリング用
 */
export interface ProgramsApiError {
  code: 'API_ERROR' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'RATE_LIMIT'
  message: string
  details?: unknown
  timestamp: string
}

export interface ProgramsApiResult<T = StadiumProgram[]> {
  success: boolean
  data?: T
  error?: ProgramsApiError
  source: 'live_api' | 'mock_data' | 'fallback'
}