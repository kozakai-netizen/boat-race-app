// シンプルなTypeScript型定義（身内利用に特化）

// 基本型
export interface Player {
  player_id: string
  name: string
  grade: 'A1' | 'A2' | 'B1' | 'B2'
  avg_st_suminoe: number | null
  win_rate_by_course: number[] | null
}

// レース型
export interface RaceListItem {
  race_id: string
  venue: string
  date: string
  race_number: number
  title: string
  close_at: string
  icons: string[]
  has_super: boolean
  exhibition_summary?: {
    left_right_gap_max?: number
    outer_inner_gap_min?: number
  }
}

// 予想型
export interface ForecastTriple {
  combo: string
  odds: number | string | null
  ev: number
  prob: number
  super: boolean
  icons?: string[]
  why?: unknown
}

export interface Forecast {
  triples: ForecastTriple[]
  updated_at: string
  summary?: {
    total_combinations: number
    avg_ev: number
    confidence: number
  }
}

// 結果型
export interface Result {
  race_id: string
  finish_order: string[]
  win_triple: string | null
  win_odds: number | null
  payouts?: {
    trifecta?: number
    exacta?: number
    quinella?: number
  }
}

// レースエントリー
export interface SimpleRaceEntry {
  lane: number
  player_name: string
  player_grade: string
  st_time: number
  exhibition_time: number
  motor_rate: number
  motor_condition: string
  motor_description: string
  motor_badge: {
    grade: '◎' | '○' | '△'
    color: string
    tooltip: string
  }
  grade_badge_color: string
  st_color: string
  exhibition_color: string
  two_rate: number
  three_rate: number
  national_win_rate?: number  // 全国勝率（Programs APIから取得）
  local_win_rate?: number     // 当地勝率（Programs APIから取得）
  photo_path?: string
  external_url?: string
}

// API レスポンス型
export interface RacesResponse {
  races: RaceListItem[]
  date: string
  venue: string
  total: number
  status?: string
  timestamp?: string
}

export interface VenueResponse {
  name: string
  display_name: string
  races_available: boolean
  weather?: Weather
}

export interface Weather {
  condition: string
  temperature?: number
  wind_speed?: number
  wind_direction?: number
  wave_height?: number
}

export interface ResultsResponse {
  results: Result[]
  date: string
  venue: string
  total: number
}

// フィードバック型
export interface Feedback {
  rating: number
  comment: string
  page: string
  timestamp: string
}