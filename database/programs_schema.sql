-- Programs API統合用データベーススキーマ
-- 段階的実装: Phase 1では選手基本情報のみ

-- 選手プログラムデータ (メインテーブル)
CREATE TABLE IF NOT EXISTS racer_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- レース識別情報
  race_id TEXT NOT NULL,                    -- "2025-09-29-12-01" (日付-会場-レース)
  venue_id INTEGER NOT NULL,                -- 標準会場番号 (1-24)
  race_date DATE NOT NULL,                  -- レース日
  race_no INTEGER NOT NULL,                 -- レース番号 (1-12)

  -- 選手情報
  pit INTEGER NOT NULL,                     -- 艇番 (1-6)
  racer_registration_number INTEGER NOT NULL, -- 選手登録番号
  racer_name TEXT NOT NULL,                 -- 選手名

  -- メタデータ
  programs_api_stadium INTEGER,             -- Programs API会場番号
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- インデックス・制約
  UNIQUE(race_id, pit),
  CHECK (venue_id >= 1 AND venue_id <= 24),
  CHECK (race_no >= 1 AND race_no <= 12),
  CHECK (pit >= 1 AND pit <= 6)
);

-- インデックス最適化
CREATE INDEX IF NOT EXISTS idx_racer_entries_race_date ON racer_entries(race_date);
CREATE INDEX IF NOT EXISTS idx_racer_entries_venue ON racer_entries(venue_id, race_date);
CREATE INDEX IF NOT EXISTS idx_racer_entries_racer ON racer_entries(racer_registration_number);

-- 選手マスターデータ (Phase 2で拡張予定)
CREATE TABLE IF NOT EXISTS racers (
  registration_number INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  branch TEXT,                              -- 支部
  birth_date DATE,                          -- 生年月日
  height INTEGER,                           -- 身長(cm)
  weight INTEGER,                           -- 体重(kg)
  debut_date DATE,                          -- デビュー日

  -- 統計データ (将来的に自動計算)
  total_races INTEGER DEFAULT 0,
  win_rate DECIMAL(5,3),                    -- 勝率
  quinella_rate DECIMAL(5,3),               -- 2連率
  trifecta_rate DECIMAL(5,3),               -- 3連率
  avg_start_timing DECIMAL(4,2),            -- 平均ST

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs API取得ログ
CREATE TABLE IF NOT EXISTS programs_ingest_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  target_date DATE NOT NULL,                -- 対象日
  venue_id INTEGER,                         -- 対象会場 (NULLの場合は全会場)

  -- 実行結果
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  stadiums_processed INTEGER DEFAULT 0,     -- 処理した会場数
  races_processed INTEGER DEFAULT 0,        -- 処理したレース数
  entries_inserted INTEGER DEFAULT 0,       -- 挿入した選手数
  entries_updated INTEGER DEFAULT 0,        -- 更新した選手数

  -- エラー情報
  error_message TEXT,
  error_details JSONB,

  -- API情報
  data_source TEXT DEFAULT 'programs_api',  -- 'programs_api' | 'mock_data' | 'fallback'
  api_response_time INTEGER,                -- API応答時間(ms)

  metadata JSONB                            -- その他のメタデータ
);

-- ログインデックス
CREATE INDEX IF NOT EXISTS idx_programs_log_date ON programs_ingest_log(target_date);
CREATE INDEX IF NOT EXISTS idx_programs_log_status ON programs_ingest_log(status, run_at);

-- 会場マッピングテーブル (実証実験で確認した値)
CREATE TABLE IF NOT EXISTS venue_mapping (
  standard_id INTEGER PRIMARY KEY,          -- 標準ID (1-24)
  name TEXT NOT NULL,                       -- 会場名
  full_name TEXT,                           -- 正式名称
  programs_api_id INTEGER,                  -- Programs APIでの番号
  results_api_id INTEGER,                   -- Results APIでの番号
  location TEXT,                            -- 所在地
  is_active BOOLEAN DEFAULT TRUE,
  confirmed_at TIMESTAMPTZ                  -- マッピング確認日時
);

-- 初期データ投入 (実証実験で確認済みの値)
INSERT INTO venue_mapping (standard_id, name, full_name, programs_api_id, results_api_id, location, confirmed_at)
VALUES
  (2, '戸田', '戸田競艇場', 2, 2, '埼玉県', NOW()),
  (12, '住之江', '住之江競艇場', 3, 12, '大阪府', NOW())
ON CONFLICT (standard_id) DO UPDATE SET
  programs_api_id = EXCLUDED.programs_api_id,
  confirmed_at = NOW();

-- Row Level Security有効化 (セキュリティ強化)
ALTER TABLE racer_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs_ingest_log ENABLE ROW LEVEL SECURITY;

-- 管理者権限でのみアクセス可能なポリシー
CREATE POLICY racer_entries_policy ON racer_entries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY programs_log_policy ON programs_ingest_log FOR ALL USING (auth.role() = 'service_role');