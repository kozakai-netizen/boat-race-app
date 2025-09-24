# 🚀 β版デプロイ手順

## Vercelデプロイ（推奨）

### 1. Vercelプロジェクト作成

```bash
# Vercel CLIインストール（未インストールの場合）
npm i -g vercel

# プロジェクト初期化
vercel

# 初回設定でプロジェクト名・フレームワーク選択
# - Framework: Next.js
# - Root Directory: ./
```

### 2. 環境変数設定

Vercel管理画面で以下を設定：

**必須項目:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**オプション（デフォルト値で動作）:**
```
SUPER_EV_MIN=1.25
SUPER_PROB_MIN=0.04
EXH_LR_STRONG=0.10
EXH_OUTER_INNER_STRONG=-0.15
SERIES_CONF_K=6
```

### 3. デプロイ実行

```bash
# プロダクションデプロイ
vercel --prod

# デプロイ完了後、URLが表示される
# 例: https://boat-race-app-abc123.vercel.app
```

### 4. β版テストデータ投入

デプロイ後、本番環境でテストデータを投入:

```bash
# ローカルで実行（本番DB向け）
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-url \
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-key \
npm run seed:test:suminoye -- --date 2025-09-24 --races 12
```

## 本番確認チェックリスト

### 🔍 動作確認

- [ ] ホームページ表示: `/suminoye`
- [ ] レース一覧表示: `/suminoye/races`
- [ ] レース詳細表示: `/race/suminoye-20250924-1R`
- [ ] 結果ページ表示: `/suminoye/results?date=2025-09-24`

### 🎯 機能確認

- [ ] 締切時刻のリアルタイム表示
- [ ] 🎯的中バッジ表示
- [ ] 📊参考チップ表示
- [ ] ⭐SUPER表示
- [ ] EV値・確率・アイコン表示

### 📱 レスポンシブ確認

- [ ] スマートフォン表示
- [ ] タブレット表示
- [ ] デスクトップ表示

### 🚀 パフォーマンス確認

- [ ] API応答速度（2秒以内）
- [ ] ページ読み込み速度
- [ ] Lighthouse スコア 80+

## トラブルシューティング

### よくある問題

1. **Supabase接続エラー**
   - 環境変数の設定を確認
   - Supabase プロジェクトの権限を確認

2. **ビルドエラー**
   - TypeScript エラーを修正
   - `npm run build` でローカル確認

3. **API レスポンスエラー**
   - データベーステーブルの存在確認
   - seedスクリプトの実行確認

### デバッグコマンド

```bash
# ローカルでプロダクションビルドテスト
npm run build
npm run start

# API直接テスト
curl https://your-app.vercel.app/api/forecast/suminoye-20250924-1R
```

## β版リリース後

### フィードバック収集方法

1. **直接ヒアリング**
   - 「使いやすさ」
   - 「分かりにくい箇所」
   - 「欲しい機能」

2. **利用状況分析**
   - よく使われるページ
   - エラー発生箇所
   - 離脱率の高いページ

3. **改善優先度判定**
   - Phase Next-B（凡例・フィードバックフォーム）の必要性
   - Phase Next-C（URLクエリ化等）の需要

### 次期開発計画

フィードバックに応じて以下を検討:
- 凡例モーダル追加
- フィードバックUI追加
- URLクエリ化（シェア機能）
- 追加機能開発