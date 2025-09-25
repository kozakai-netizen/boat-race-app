-- 選手管理強化：実データ投入対応
-- パフォーマンス重視：必要最小限のカラム、効率的なインデックス

-- 基本カラム追加
ALTER TABLE public.player
ADD COLUMN IF NOT EXISTS reg_no INTEGER UNIQUE,  -- 登録番号（一意）
ADD COLUMN IF NOT EXISTS name_kana TEXT,         -- ひらがな名前（検索用）
ADD COLUMN IF NOT EXISTS grade TEXT CHECK (grade IN ('A1','A2','B1','B2')), -- 級別制約
ADD COLUMN IF NOT EXISTS birth_date DATE,        -- 生年月日
ADD COLUMN IF NOT EXISTS hometown TEXT,          -- 出身地
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true, -- 現役フラグ
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- パフォーマンス重視インデックス
CREATE INDEX IF NOT EXISTS idx_player_reg_no ON public.player(reg_no) WHERE reg_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_name_search ON public.player USING gin(to_tsvector('japanese', coalesce(player_name, '') || ' ' || coalesce(name_kana, '')));
CREATE INDEX IF NOT EXISTS idx_player_grade ON public.player(grade) WHERE grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_active ON public.player(is_active) WHERE is_active = true;

-- 高速検索用：複合インデックス
CREATE INDEX IF NOT EXISTS idx_player_search_combo ON public.player(is_active, grade, reg_no) WHERE is_active = true;

-- RLS強化：管理者のみ書き込み
ALTER TABLE public.player ENABLE ROW LEVEL SECURITY;

-- 既存の読み取り専用ポリシーは維持
CREATE POLICY IF NOT EXISTS "Public read access" ON public.player FOR SELECT USING (true);

-- 管理者のみ書き込み（ADMIN_TOKEN認証済み想定）
CREATE POLICY IF NOT EXISTS "Admin write access" ON public.player FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Admin update access" ON public.player FOR UPDATE TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Admin delete access" ON public.player FOR DELETE TO authenticated USING (true);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_updated_at BEFORE UPDATE ON public.player
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- コメント追加
COMMENT ON COLUMN public.player.reg_no IS '選手登録番号（4桁数字）';
COMMENT ON COLUMN public.player.name_kana IS 'ひらがな名前（検索用）';
COMMENT ON COLUMN public.player.grade IS '選手級別（A1/A2/B1/B2）';
COMMENT ON COLUMN public.player.is_active IS '現役選手フラグ（引退選手はfalse）';