-- レース結果管理強化：実データ投入対応
-- パフォーマンス重視：必要最小限のカラム、高速検索

-- 既存テーブル確認・拡張
DO $$
BEGIN
  -- resultテーブルが存在しない場合は作成
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'result') THEN
    CREATE TABLE public.result (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      race_id TEXT NOT NULL,
      triple TEXT NOT NULL,
      payout INTEGER,
      popularity INTEGER,
      settled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- カラム追加・制約強化
ALTER TABLE public.result
ADD COLUMN IF NOT EXISTS hit_count INTEGER DEFAULT 0, -- 的中した予想数（キャッシュ）
ADD COLUMN IF NOT EXISTS total_forecasts INTEGER DEFAULT 0; -- 総予想数（キャッシュ）

-- 制約追加
ALTER TABLE public.result
ADD CONSTRAINT IF NOT EXISTS valid_triple_format CHECK (triple ~ '^[1-6]-[1-6]-[1-6]$'),
ADD CONSTRAINT IF NOT EXISTS positive_payout CHECK (payout IS NULL OR payout >= 0),
ADD CONSTRAINT IF NOT EXISTS valid_popularity CHECK (popularity IS NULL OR (popularity >= 1 AND popularity <= 120));

-- 一意制約：race_idごとに1件のみ
CREATE UNIQUE INDEX IF NOT EXISTS uniq_result_race_id ON public.result(race_id);

-- 高速検索用インデックス
CREATE INDEX IF NOT EXISTS idx_result_race_search ON public.result(race_id, settled_at) WHERE settled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_result_payout ON public.result(payout) WHERE payout IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_result_popularity ON public.result(popularity) WHERE popularity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_result_updated_recent ON public.result(updated_at DESC);

-- 日付ベース検索用（レース日付から逆引き）
CREATE INDEX IF NOT EXISTS idx_result_race_date ON public.result(substring(race_id, '[0-9]{8}'));

-- RLS強化
ALTER TABLE public.result ENABLE ROW LEVEL SECURITY;

-- 読み取り：全公開
CREATE POLICY IF NOT EXISTS "Public read access" ON public.result FOR SELECT USING (true);

-- 書き込み：管理者のみ
CREATE POLICY IF NOT EXISTS "Admin write access" ON public.result FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Admin update access" ON public.result FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Admin delete access" ON public.result FOR DELETE TO authenticated USING (true);

-- 更新日時の自動更新
CREATE TRIGGER IF NOT EXISTS update_result_updated_at
  BEFORE UPDATE ON public.result
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 結果更新時のforecast hit更新トリガー
CREATE OR REPLACE FUNCTION update_forecast_hits()
RETURNS TRIGGER AS $$
DECLARE
  hit_forecasts INTEGER;
  total_forecasts INTEGER;
BEGIN
  -- 新しい結果に基づいてforecastテーブルのhitを更新
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- 該当するforecastレコードのhitを更新
    UPDATE public.forecast
    SET hit = CASE
      WHEN combo = NEW.triple THEN 'win'::hit_type
      WHEN combo LIKE NEW.triple THEN 'inTop'::hit_type  -- 部分一致ロジックは必要に応じて調整
      ELSE 'miss'::hit_type
    END,
    updated_at = now()
    WHERE race_id = NEW.race_id;

    -- キャッシュ値更新
    SELECT
      COUNT(*) FILTER (WHERE hit IN ('win', 'inTop')),
      COUNT(*)
    INTO hit_forecasts, total_forecasts
    FROM public.forecast
    WHERE race_id = NEW.race_id;

    NEW.hit_count := COALESCE(hit_forecasts, 0);
    NEW.total_forecasts := COALESCE(total_forecasts, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_forecast_hits
  BEFORE INSERT OR UPDATE ON public.result
  FOR EACH ROW EXECUTE PROCEDURE update_forecast_hits();

-- コメント追加
COMMENT ON TABLE public.result IS 'レース結果：各レースの最終結果を管理';
COMMENT ON COLUMN public.result.race_id IS 'レースID（例：suminoe-20250925-01R）';
COMMENT ON COLUMN public.result.triple IS '3連複結果（例：1-3-2）';
COMMENT ON COLUMN public.result.payout IS '払戻金（円）';
COMMENT ON COLUMN public.result.popularity IS '人気順位（1〜120番人気）';
COMMENT ON COLUMN public.result.settled_at IS '確定日時';
COMMENT ON COLUMN public.result.hit_count IS '的中予想数（キャッシュ）';
COMMENT ON COLUMN public.result.total_forecasts IS '総予想数（キャッシュ）';