import { z } from 'zod'

// Base schemas
export const PlayerSchema = z.object({
  player_id: z.string(),
  name: z.string(),
  grade: z.enum(['A1', 'A2', 'B1', 'B2']),
  avg_st_suminoe: z.number().nullable(),
  win_rate_by_course: z.array(z.number()).nullable(),
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
export type VenueResponse = z.infer<typeof VenueResponseSchema>
export type RaceListItem = z.infer<typeof RaceListItemSchema>
export type RacesResponse = z.infer<typeof RacesResponseSchema>
export type Result = z.infer<typeof ResultSchema>
export type ResultsResponse = z.infer<typeof ResultsResponseSchema>
export type Feedback = z.infer<typeof FeedbackSchema>