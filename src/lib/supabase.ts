import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Programs API用のcreateClient関数をエクスポート
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// タイプ定義
export type Database = {
  public: {
    Tables: {
      result: {
        Row: {
          race_id: string
          triple: string
          payout: number | null
          popularity: number | null
          settled_at: string | null
        }
        Insert: {
          race_id: string
          triple: string
          payout?: number | null
          popularity?: number | null
          settled_at?: string | null
        }
        Update: {
          race_id?: string
          triple?: string
          payout?: number | null
          popularity?: number | null
          settled_at?: string | null
        }
      }
      ingest_log: {
        Row: {
          id: string
          run_at: string
          source: string
          status: 'success' | 'partial' | 'failed'
          records_processed: number
          records_inserted: number
          records_updated: number
          error_details: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          run_at?: string
          source: string
          status: 'success' | 'partial' | 'failed'
          records_processed?: number
          records_inserted?: number
          records_updated?: number
          error_details?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          run_at?: string
          source?: string
          status?: 'success' | 'partial' | 'failed'
          records_processed?: number
          records_inserted?: number
          records_updated?: number
          error_details?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
      }
    }
  }
}