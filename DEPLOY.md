# 本番デプロイ手順書

ライフプラン・シミュレーター本番リリースの最短ルートです。Supabase は MCP で構築済みのため、フロントを Vercel に乗せれば動作します。

## 0. 前提

- **Supabase プロジェクト**: `pktkiraixhiflfhpcpcq`（東京、稼働中）
- **GitHub リポジトリ**: `https://github.com/rsorf9/lifeplan-simulator`
- **管理者メール**: `54551491mssa@gmail.com`（RLS / 管理者ページの条件）
- **Edge Function `admin-users`**: デプロイ済み

---

## 1. Vercel 接続（5 分）

1. [https://vercel.com/new](https://vercel.com/new) で GitHub の `lifeplan-simulator` を Import
2. **Framework Preset**: `Other`（リポジトリ直下に `vercel.json` があるため自動検出）
3. **Build & Output**: `vercel.json` で指定済み（編集不要）
4. **Environment Variables** を 2 つ追加：

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://pktkiraixhiflfhpcpcq.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_vrGmBD1MchqaEPz4FECThw_x8KkhF4p` |

5. **Deploy** を押す
6. 1〜2 分後に `https://lifeplan-simulator-xxx.vercel.app` が発行される
7. （任意）Settings → Domains で独自ドメインを設定

---

## 2. Supabase 側で本番 URL を許可

Vercel が発行したドメインを Supabase に登録します。これをやらないと OAuth/Email リンクが動きません。

1. Supabase ダッシュボード → [Authentication → URL Configuration](https://supabase.com/dashboard/project/pktkiraixhiflfhpcpcq/auth/url-configuration)
2. **Site URL** を Vercel 本番 URL に変更
3. **Redirect URLs** に以下を追加：
   - `https://<your-vercel-domain>/`
   - `https://<your-vercel-domain>/**`
   - 開発用に `http://localhost:5173/` も残しておく

---

## 3. メール / OAuth プロバイダ設定

[Authentication → Providers](https://supabase.com/dashboard/project/pktkiraixhiflfhpcpcq/auth/providers)

### Email
- **Enable email signup**: ON（管理者の作成フォームから使用するため）
- **Confirm email**: ON（本番では必ず ON。確認メールでアカウント有効化）
- **Minimum password length**: 12

### Google（任意）
1. [Google Cloud Console](https://console.cloud.google.com/) で OAuth 2.0 クライアント作成
2. 承認済みリダイレクト URI に Supabase の callback URL を追加（ダッシュボードに表示される）
3. クライアント ID とシークレットを Supabase に貼り付け、Provider を Enable

### GitHub（任意）
1. GitHub Settings → Developer settings → OAuth Apps → New
2. Authorization callback URL に Supabase の callback URL を入力
3. クライアント ID / シークレットを Supabase に貼り付け、Provider を Enable

---

## 4. 初回管理者ログイン

1. デプロイした URL を開く
2. メール `54551491mssa@gmail.com` でログイン（Supabase ダッシュボードでこのユーザーのパスワードを設定済みの前提）
3. ダッシュボード右上に「管理者ページ」リンクが現れる
4. 管理者ページから一般ユーザーを発行 → 利用開始

---

## 5. GitHub Actions（CI）の状態

| ジョブ | 内容 | 期待 |
|---|---|---|
| `test` | typecheck + テスト | ✅ |
| `build-frontend` | Vite build → artifact 化 | ✅ |
| `deploy-supabase` | マイグレーション適用（`continue-on-error`） | ⚠️ 失敗しても全体は通る |

`deploy-supabase` は MCP で既に適用済みのため、将来のマイグレーション差分用です。失敗してもデプロイには影響しません。

---

## 6. ロールバック方法

- **フロント**: Vercel ダッシュボードで「Deployments → 過去のデプロイ → Promote to Production」
- **DB**: Supabase ダッシュボード → Database → Backups から PITR

---

## 7. 既知の制約と次の改善候補

- 単一管理者メール埋め込み。将来は `user_roles` テーブルで権限管理に
- `signUp` API は技術的にはまだ匿名で叩けます。完全閉鎖は Email 認証 OFF + Edge Function で `auth.admin.createUser` に切替
- シミュレーション計算はフロント側のみ。機密ロジック化したい場合は Edge Function に分離
- 本番では `seed` データなし。管理者がアカウント作成して招待する運用

---

## トラブルシューティング

### Vercel ビルドが失敗する
`frontend/package-lock.json` が push されているか確認。`vercel.json` の `buildCommand` が `cd frontend && npm ci && npm run build` であることを確認。

### OAuth コールバックでエラー
Supabase の Redirect URLs に本番ドメインが入っているか確認。HTTPS で `/` までの URL を入れる。

### 管理者ページに入れない
ログイン中のメールが完全一致 `54551491mssa@gmail.com` か確認。大文字小文字は許容（コード側で lowerCase 比較）。
