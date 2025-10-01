import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * racer_dataテーブルを作成するAPI
 * POST /api/create-racer-table
 */
export async function POST() {
  try {
    const supabase = createClient()

    console.log('🔧 Creating racer_data table...')

    // テーブル作成SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS racer_data (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        registration_number TEXT UNIQUE NOT NULL,
        name_kanji TEXT NOT NULL,
        name_kana TEXT,
        branch TEXT,
        class TEXT CHECK (class IN ('A1', 'A2', 'B1', 'B2')),
        gender TEXT CHECK (gender IN ('M', 'F')),
        birth_date DATE,
        height INTEGER,
        weight INTEGER,
        win_rate DECIMAL(5,2),
        quinella_rate DECIMAL(5,2),
        trio_rate DECIMAL(5,2),
        avg_st DECIMAL(4,2),
        data_source TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      console.error('❌ Table creation failed:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ racer_data table created successfully')

    return NextResponse.json({
      success: true,
      message: 'racer_data table created successfully',
      table_structure: {
        registration_number: 'TEXT UNIQUE NOT NULL',
        name_kanji: 'TEXT NOT NULL',
        name_kana: 'TEXT',
        branch: 'TEXT',
        class: 'TEXT (A1/A2/B1/B2)',
        gender: 'TEXT (M/F)',
        birth_date: 'DATE',
        height: 'INTEGER',
        weight: 'INTEGER',
        win_rate: 'DECIMAL(5,2)',
        quinella_rate: 'DECIMAL(5,2)',
        trio_rate: 'DECIMAL(5,2)',
        avg_st: 'DECIMAL(4,2)',
        data_source: 'TEXT',
        created_at: 'TIMESTAMPTZ',
        updated_at: 'TIMESTAMPTZ'
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Table creation error:', errorMessage)

    return NextResponse.json({
      success: false,
      error: 'Table creation failed',
      details: errorMessage
    }, { status: 500 })
  }
}