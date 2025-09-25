import { z } from 'zod'

// Base schemas
export const PlayerSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  grade: z.enum(['A1', 'A2', 'B1', 'B2']),
  avg_st_suminoe: z.number().nullable(),
  win_rate_by_course: z.array(z.number()).nullable(),
})

// 管理画面用：拡張選手スキーマ（パフォーマンス重視）
export const AdminPlayerSchema = z.object({
  id: z.string().uuid().optional(), // 自動生成
  reg_no: z.number().int().min(1000).max(9999).nullable(), // 4桁登録番号
  player_name: z.string().min(1).max(50), // 本名
  name_kana: z.string().max(100).nullable(), // ひらがな名前
  grade: z.enum(['A1', 'A2', 'B1', 'B2']),
  birth_date: z.string().date().nullable(), // YYYY-MM-DD
  hometown: z.string().max(20).nullable(), // 出身地
  external_url: z.string().url().nullable(), // 外部リンク
  is_active: z.boolean().default(true), // 現役フラグ
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

// レスポンス用
export const AdminPlayersResponseSchema = z.object({
  players: z.array(AdminPlayerSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
})

// 検索・フィルタ用
export const PlayerSearchParamsSchema = z.object({
  q: z.string().optional(), // 検索キーワード
  grade: z.enum(['A1', 'A2', 'B1', 'B2', '']).optional(),
  isActive: z.enum(['true', 'false', '']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['reg_no', 'player_name', 'grade', 'created_at']).default('reg_no'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const RaceSchema = z.object({
  race_id: z.string(),
  venue: z.string(),
  date: z.string(),
  race_no: z.number(),
  grade: z.enum(['normal', 'major']),
  close_at: z.string(),
})

export const WeatherSchema = z.object({
  wind_dir_deg: z.number().nullable(),
  wind_ms: z.number().nullable(),
  temp_c: z.number().nullable(),
  humidity: z.number().nullable(),
  tide_level: z.number().nullable(),
})

export const EntrySchema = z.object({
  race_id: z.string(),
  lane: z.number(),
  player_id: z.string().nullable(),
  player_name: z.string().nullable(),
  player_grade: z.string().nullable(),
})

export const ExhibitionSchema = z.object({
  race_id: z.string(),
  lane: z.number(),
  st_exh: z.number().nullable(),
  tenji: z.number().nullable(),
  isshu: z.number().nullable(),
  mawari: z.number().nullable(),
  left_gap: z.number().nullable(),
  right_gap: z.number().nullable(),
  outer_inner_gap: z.number().nullable(),
})

// Why schema for forecast reasoning
export const WhySchema = z.object({
  icons: z.array(z.string()),
  summary: z.string(),
  factors: z.array(z.string()).optional(),
  start_shape: z.string().optional(),
  kimarite_mix: z.record(z.string(), z.unknown()).optional(),
})

// API Response schemas
export const ForecastTripleSchema = z.object({
  combo: z.string(),
  prob: z.number(),
  odds: z.number().nullable().optional(),
  ev: z.number(),
  super: z.boolean(),
  icons: z.array(z.string()).optional(),
  hitType: z.enum(['win', 'inTop', 'miss', 'ref']).optional(),
  why: WhySchema.optional(),
})

export const ForecastSchema = z.object({
  race_id: z.string(),
  triples: z.array(ForecastTripleSchema),
})

export const RaceEntryPackSchema = z.object({
  race_id: z.string(),
  lane: z.number(),
  player_id: z.string().nullable(),
  player_name: z.string().nullable(),
  player_grade: z.string().nullable(),
  st_exh: z.number().nullable(),
  tenji: z.number().nullable(),
  isshu: z.number().nullable(),
  mawari: z.number().nullable(),
  left_gap: z.number().nullable(),
  right_gap: z.number().nullable(),
  outer_inner_gap: z.number().nullable(),
  st_rank_mean: z.number().nullable(),
  st_mean: z.number().nullable(),
  time_mean: z.number().nullable(),
  n_starts: z.number().nullable(),
  avg_st_suminoe: z.number().nullable(),
  win_rate_by_course: z.array(z.number()).nullable(),
  f_active: z.boolean().nullable(),
  f_count: z.number().nullable(),
})

export const VenueResponseSchema = z.object({
  venue: z.string(),
  date: z.string(),
  grade: z.enum(['normal', 'major']),
  weather_summary: z.object({
    temp_c: z.number().nullable(),
    wind_ms: z.number().nullable(),
    condition: z.string(),
  }).nullable(),
  super_picks_count: z.number(),
  next_close_at: z.string().nullable(),
})

// Simple race entry schema for mock data
export const SimpleRaceEntrySchema = z.object({
  race_id: z.string(),
  lane: z.number(),
  player_name: z.string(),
  player_grade: z.string(),
  st_time: z.number(),
  exhibition_time: z.number(),
  motor_rate: z.number(),
  motor_condition: z.string(),
  motor_description: z.string(),
})

export const RaceListItemSchema = z.object({
  race_id: z.string(),
  race_no: z.number(),
  close_at: z.string(),
  has_super: z.boolean(),
  icons: z.array(z.string()),
  exhibition_summary: z.object({
    left_right_gap_max: z.number().nullable(),
    outer_inner_gap_min: z.number().nullable(),
  }).nullable(),
})

export const RacesResponseSchema = z.object({
  venue: z.string(),
  date: z.string(),
  grade: z.enum(['normal', 'major']),
  races: z.array(RaceListItemSchema),
})

export const ResultSchema = z.object({
  race_id: z.string(),
  triple: z.string(),
  payout: z.number().nullable(),
  popularity: z.number().nullable(),
  hit: z.enum(['win', 'inTop', 'miss', 'ref']),
})

export const ResultsResponseSchema = z.object({
  venue: z.string(),
  date: z.string(),
  results: z.array(ResultSchema),
})

// Feedback schema
export const FeedbackSchema = z.object({
  id: z.string().optional(),
  created_at: z.string().optional(),
  page: z.string(),
  rating: z.number().min(1).max(5).optional(),
  confusing: z.string().optional(),
  request: z.string().optional(),
  comment: z.string().optional(),
  contact: z.string().optional(),
})

// Type exports
export type Player = z.infer<typeof PlayerSchema>
export type Race = z.infer<typeof RaceSchema>
export type Weather = z.infer<typeof WeatherSchema>
export type Entry = z.infer<typeof EntrySchema>
export type Exhibition = z.infer<typeof ExhibitionSchema>
export type ForecastTriple = z.infer<typeof ForecastTripleSchema>
export type Forecast = z.infer<typeof ForecastSchema>
export type RaceEntryPack = z.infer<typeof RaceEntryPackSchema>
export type SimpleRaceEntry = z.infer<typeof SimpleRaceEntrySchema>
export type VenueResponse = z.infer<typeof VenueResponseSchema>
export type RaceListItem = z.infer<typeof RaceListItemSchema>
export type RacesResponse = z.infer<typeof RacesResponseSchema>
export type Result = z.infer<typeof ResultSchema>
export type ResultsResponse = z.infer<typeof ResultsResponseSchema>
export type Feedback = z.infer<typeof FeedbackSchema>

// 管理画面用型定義
export type AdminPlayer = z.infer<typeof AdminPlayerSchema>
export type AdminPlayersResponse = z.infer<typeof AdminPlayersResponseSchema>
export type PlayerSearchParams = z.infer<typeof PlayerSearchParamsSchema>

// 結果管理用：拡張結果スキーマ
export const AdminResultSchema = z.object({
  id: z.string().uuid().optional(),
  race_id: z.string().min(1).max(50),
  triple: z.string().regex(/^[1-6]-[1-6]-[1-6]$/, "3連複は'1-3-2'形式で入力してください"),
  payout: z.number().int().min(0).nullable(),
  popularity: z.number().int().min(1).max(120).nullable(),
  settled_at: z.string().datetime().nullable(),
  hit_count: z.number().int().min(0).optional(),
  total_forecasts: z.number().int().min(0).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

// レスポンス用
export const AdminResultsResponseSchema = z.object({
  results: z.array(AdminResultSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
})

// 検索・フィルタ用
export const ResultSearchParamsSchema = z.object({
  q: z.string().optional(), // race_id検索
  dateFrom: z.string().date().optional(), // 日付範囲（開始）
  dateTo: z.string().date().optional(), // 日付範囲（終了）
  hasResult: z.enum(['true', 'false', '']).optional(), // 結果入力済みフィルタ
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['race_id', 'settled_at', 'payout', 'popularity', 'updated_at']).default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// 結果管理用型定義
export type AdminResult = z.infer<typeof AdminResultSchema>
export type AdminResultsResponse = z.infer<typeof AdminResultsResponseSchema>
export type ResultSearchParams = z.infer<typeof ResultSearchParamsSchema>