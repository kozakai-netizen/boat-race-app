-- 🚤 住之江ボートレース予想システム - 改善版DBスキーマ
-- GPT + Claude + Gemini の提案を統合

-- ========================================
-- 1. 基本テーブル（レース・選手）
-- ========================================

-- 選手マスタ（Gemini提案：住之江特化データ追加）
CREATE TABLE player (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT CHECK (grade IN ('A1', 'A2', 'B1', 'B2')),
  birthdate DATE,
  height_cm INTEGER,
  weight_kg INTEGER,
  hometown TEXT,
  photo_url TEXT,

  -- 住之江特化データ（Gemini提案）
  avg_st_suminoe NUMERIC, -- 住之江での平均ST
  win_rate_by_course JSONB, -- コース別勝率 [0.55, 0.23, ...]

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- レース基本情報
CREATE TABLE race (
  race_id TEXT PRIMARY KEY,
  venue TEXT NOT NULL DEFAULT 'suminoe',
  date DATE NOT NULL,
  race_no INTEGER NOT NULL CHECK (race_no BETWEEN 1 AND 12),
  grade TEXT NOT NULL CHECK (grade IN ('normal', 'major')),
  close_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 出走選手
CREATE TABLE entry (
  race_id TEXT REFERENCES race ON DELETE CASCADE,
  lane INTEGER CHECK (lane BETWEEN 1 AND 6),
  player_id TEXT REFERENCES player ON DELETE SET NULL,
  player_name TEXT,
  player_grade TEXT,
  PRIMARY KEY (race_id, lane)
);

-- ========================================
-- 2. 競技データ（展示・成績）
-- ========================================

-- 展示タイム・ST情報
CREATE TABLE exhibition (
  race_id TEXT REFERENCES race ON DELETE CASCADE,
  lane INTEGER,
  st_exh NUMERIC, -- 展示ST
  tenji NUMERIC, -- 直線タイム
  isshu NUMERIC, -- 一周タイム
  mawari NUMERIC, -- まわり足
  left_gap NUMERIC, -- 左右差(秒)
  right_gap NUMERIC,
  outer_inner_gap NUMERIC, -- 外最速-内最遅(負=外速)
  PRIMARY KEY (race_id, lane)
);

-- 節間成績
CREATE TABLE series_form (
  meet_id TEXT,
  race_id TEXT REFERENCES race ON DELETE CASCADE,
  lane INTEGER,
  player_id TEXT,
  st_rank_mean NUMERIC,
  st_mean NUMERIC,
  time_mean NUMERIC, -- 場平均差
  n_starts INTEGER,
  PRIMARY KEY (race_id, lane)
);

-- 12ヶ月成績（一般/重賞別）
CREATE TABLE baseline12m (
  player_id TEXT REFERENCES player ON DELETE CASCADE,
  lane INTEGER,
  grade TEXT CHECK (grade IN ('normal', 'major')),
  st_mean NUMERIC,
  st_rank_mean NUMERIC,
  kimarite JSONB, -- {"nige":0.11, "makuri":0.24, ...}
  time_mean NUMERIC,
  win_rate NUMERIC,
  PRIMARY KEY (player_id, lane, grade)
);

-- F持ち・ペナルティ
CREATE TABLE penalties (
  player_id TEXT PRIMARY KEY REFERENCES player ON DELETE CASCADE,
  f_count INTEGER DEFAULT 0,
  f_active BOOLEAN DEFAULT FALSE,
  f_since_days INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- V-Score（得意場データ）
CREATE TABLE vscore (
  player_id TEXT REFERENCES player ON DELETE CASCADE,
  venue TEXT DEFAULT 'suminoe',
  lane INTEGER,
  grade TEXT,
  v_score NUMERIC,
  PRIMARY KEY (player_id, venue, lane, grade)
);

-- ========================================
-- 3. 天候・オッズ（GPT改善版）
-- ========================================

-- 天候情報
CREATE TABLE weather (
  race_id TEXT PRIMARY KEY REFERENCES race ON DELETE CASCADE,
  wind_dir_deg INTEGER,
  wind_ms NUMERIC,
  temp_c NUMERIC,
  humidity NUMERIC,
  tide_level NUMERIC,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- オッズ（複数時点管理 - GPT提案）
CREATE TABLE odds_snapshot (
  race_id TEXT NOT NULL REFERENCES race ON DELETE CASCADE,
  combo TEXT NOT NULL, -- "3-6-1"
  odds NUMERIC NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (race_id, combo, taken_at)
);

-- 最新オッズビュー（GPT提案）
CREATE OR REPLACE VIEW odds_latest AS
SELECT DISTINCT ON (race_id, combo)
  race_id, combo, odds, taken_at
FROM odds_snapshot
ORDER BY race_id, combo, taken_at DESC;

-- ========================================
-- 4. 予想・結果（Claude + Gemini統合）
-- ========================================

-- AI予想結果（GPTのJSON構造）
CREATE TABLE forecast (
  race_id TEXT REFERENCES race ON DELETE CASCADE,
  combo TEXT, -- "3-6-1"
  prob NUMERIC,
  ev NUMERIC,
  super BOOLEAN DEFAULT FALSE,

  -- 根拠詳細（GPT提案のJSON構造）
  why JSONB, -- {icons:[], summary:"", factors:[], start_shape:"", kimarite_mix:{}}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (race_id, combo)
);

-- レース結果（Claude + Gemini提案）
CREATE TABLE result (
  race_id TEXT PRIMARY KEY REFERENCES race ON DELETE CASCADE,
  triple TEXT NOT NULL, -- "2-3-1"
  payout INTEGER,
  popularity INTEGER,
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. モーター情報（Gemini提案）
-- ========================================

-- モーターマスタ
CREATE TABLE motors (
  motor_id INTEGER PRIMARY KEY,
  venue TEXT DEFAULT 'suminoe',
  performances JSONB, -- [{date: "2025-09-20", win_rate: 0.45}, ...]
  current_win_rate NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- レース別モーター割り当て
CREATE TABLE race_motors (
  race_id TEXT REFERENCES race ON DELETE CASCADE,
  lane INTEGER,
  motor_id INTEGER REFERENCES motors ON DELETE SET NULL,
  PRIMARY KEY (race_id, lane)
);

-- ========================================
-- 6. ユーザー機能（身内10名用）
-- ========================================

-- お気に入り選手/モーター（Gemini提案）
CREATE TABLE user_favorites (
  user_name TEXT,
  type TEXT CHECK (type IN ('player', 'motor')),
  target_id TEXT, -- player_id or motor_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_name, type, target_id)
);

-- 個人成績記録（身内ランキング用）
CREATE TABLE user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  race_id TEXT REFERENCES race ON DELETE CASCADE,
  predicted_combo TEXT,
  hit_type TEXT CHECK (hit_type IN ('win', 'hit', 'miss', 'ref')), -- 🎯⭕❌△
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 7. インデックス（パフォーマンス最適化）
-- ========================================

-- レース関連
CREATE INDEX idx_race_date_venue ON race (date, venue);
CREATE INDEX idx_race_close_at ON race (close_at);

-- 出走・展示
CREATE INDEX idx_entry_race_lane ON entry (race_id, lane);
CREATE INDEX idx_exhibition_race_lane ON exhibition (race_id, lane);
CREATE INDEX idx_series_form_race_lane ON series_form (race_id, lane);

-- 予想・結果
CREATE INDEX idx_forecast_race_ev ON forecast (race_id, ev DESC);
CREATE INDEX idx_forecast_super ON forecast (race_id) WHERE super = TRUE;

-- オッズ
CREATE INDEX idx_odds_snapshot_race_taken ON odds_snapshot (race_id, taken_at DESC);

-- ユーザー
CREATE INDEX idx_user_predictions_user_date ON user_predictions (user_name, created_at DESC);

-- ========================================
-- 8. マテリアライズドビュー（JOIN軽量化 - GPT提案）
-- ========================================

-- レース基本情報 + 天候
CREATE MATERIALIZED VIEW race_pack AS
SELECT r.race_id, r.venue, r.date, r.race_no, r.grade, r.close_at,
       w.wind_dir_deg, w.wind_ms, w.temp_c, w.humidity, w.tide_level
FROM race r
LEFT JOIN weather w ON w.race_id = r.race_id;

-- 出走表 + 展示 + 節間成績（統合ビュー）
CREATE MATERIALIZED VIEW race_entries_pack AS
SELECT e.race_id, e.lane, e.player_id, e.player_name, e.player_grade,
       ex.st_exh, ex.tenji, ex.isshu, ex.mawari,
       ex.left_gap, ex.right_gap, ex.outer_inner_gap,
       s.st_rank_mean, s.st_mean, s.time_mean, s.n_starts,
       p.avg_st_suminoe, p.win_rate_by_course,
       pen.f_active, pen.f_count
FROM entry e
LEFT JOIN exhibition ex ON ex.race_id = e.race_id AND ex.lane = e.lane
LEFT JOIN series_form s ON s.race_id = e.race_id AND s.lane = e.lane
LEFT JOIN player p ON p.player_id = e.player_id
LEFT JOIN penalties pen ON pen.player_id = e.player_id;

-- インデックス（マテビュー用）
CREATE UNIQUE INDEX idx_race_pack_id ON race_pack (race_id);
CREATE UNIQUE INDEX idx_race_entries_race_lane ON race_entries_pack (race_id, lane);

-- ========================================
-- 9. 初期データ（ダミー）
-- ========================================

-- サンプル選手データ
INSERT INTO player (player_id, name, grade, avg_st_suminoe, win_rate_by_course) VALUES
('player_001', '田中太郎', 'A1', 0.16, '[0.65, 0.23, 0.18, 0.12, 0.08, 0.05]'),
('player_002', '佐藤次郎', 'A1', 0.18, '[0.58, 0.28, 0.22, 0.15, 0.10, 0.07]'),
('player_003', '鈴木三郎', 'A2', 0.15, '[0.72, 0.19, 0.25, 0.18, 0.12, 0.08]');

-- リフレッシュ用関数
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY race_pack;
  REFRESH MATERIALIZED VIEW CONCURRENTLY race_entries_pack;
END;
$$ LANGUAGE plpgsql;

-- 定期リフレッシュ（Supabase Edge Function等で呼び出し）
-- SELECT refresh_materialized_views();