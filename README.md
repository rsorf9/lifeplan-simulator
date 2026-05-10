# Lifeplan Simulator

スライダー式ライフプラン・住宅ローン・資産形成シミュレーター。
GitHub + Supabase（PostgreSQL + Auth + Edge Functions）で構築。

## 構成

```
lifeplan-simulator/
├── frontend/                 # React + Vite + TypeScript SPA
│   ├── src/
│   │   ├── config/sliderSchema.json   # メタデータ駆動UI の項目定義
│   │   ├── lib/                       # Supabase クライアント / 型
│   │   ├── store/                     # Zustand stores
│   │   ├── components/                # 共通コンポーネント
│   │   ├── pages/                     # ページコンポーネント
│   │   └── hooks/                     # データフック
│   ├── .env.local                     # ローカル環境変数（gitignore 対象）
│   └── .env.example
├── supabase/
│   └── migrations/                    # 適用済みマイグレーション SQL
└── .github/workflows/ci-cd.yml        # GitHub Actions
```

## Supabase

- プロジェクト ID: `pktkiraixhiflfhpcpcq`
- リージョン: `ap-northeast-1`（東京）
- URL: `https://pktkiraixhiflfhpcpcq.supabase.co`

すでに以下のマイグレーションが適用済みです。

| # | 名前 | 内容 |
|---|---|---|
| 001 | initial_schema | profiles / scenarios / simulation_results / audit_log の DDL |
| 002 | rls_policies | 全テーブルで RLS 有効化 + 所有者ポリシー |
| 003 | profile_autocreate_trigger | auth.users 作成時に profiles を自動生成 |
| 004 | security_hardening | search_path 固定 + handle_new_user 実行権限剥奪 |

## 開発手順

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` で起動。

## 認証プロバイダの有効化

Supabase ダッシュボード（Authentication → Providers）で以下を有効化してください。

- **Email**：「Confirm email」を ON、パスワード最低長を 12 文字に設定
- **Google**：OAuth クライアント ID / シークレットを設定
- **GitHub**：OAuth アプリの ID / シークレットを設定
- **MFA**：TOTP を有効化（任意）

## デプロイ

GitHub にリポジトリを作成し、以下の Secrets を登録してから main ブランチへ push してください。

| Secret 名 | 用途 |
|---|---|
| `SUPABASE_URL` | フロントビルド時のクエリ先 |
| `SUPABASE_PUBLISHABLE_KEY` | クライアントキー（公開可） |
| `SUPABASE_ACCESS_TOKEN` | CLI でマイグレーション適用 |
| `SUPABASE_PROJECT_REF` | `pktkiraixhiflfhpcpcq` |
| `VERCEL_TOKEN` 等 | Vercel デプロイ用 |
