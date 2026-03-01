# PR Summary: feature/profile-auto-init → main

## 目的
- Supabase認証を実アプリに接続し、Sessionに応じたUI出し分けを安定させる。
- ログイン後導線として部内ポータル（ダミー）を用意する。
- 開発サーバーの多重起動による不安定化を防ぐ運用手順を明文化する。

## 主要変更

### 1) 認証・Session同期
- `mma-wiki-demo/app/login/page.tsx`
  - ログイン/新規登録のSupabase Auth連携
  - username入力を `@a.com` 変換してデモ運用
- `mma-wiki-demo/utils/supabase/client.ts`
  - `@supabase/ssr` の `createBrowserClient` へ変更
- `mma-wiki-demo/middleware.ts`
  - SSRでSession Cookie同期を行うmiddleware追加
- `mma-wiki-demo/utils/supabase/server.ts`
  - Server Component用Supabaseクライアント追加

### 2) UI出し分け・ログアウト
- `mma-wiki-demo/app/layout.tsx`
  - Sessionでヘッダー表示を未ログイン/ログイン済みで出し分け
  - 右上ユーザーアイコンメニューからログアウト可能に変更
- `mma-wiki-demo/app/page.tsx`
  - 同一ページ内で未ログイン/ログイン済みのCTAを条件表示

### 3) 部内ポータル（ダミー）
- `mma-wiki-demo/app/portal/page.tsx`
  - 複数サービスへのリンクハブ
- `mma-wiki-demo/app/portal/attendance/page.tsx`
- `mma-wiki-demo/app/portal/storage/page.tsx`
- `mma-wiki-demo/app/portal/calendar/page.tsx`
- `mma-wiki-demo/app/portal/tasks/page.tsx`
  - いずれもテスト用ダミーページ

### 4) DB運用（デモアカウント）
- `mma-wiki-demo/supabase/seed_demo_guest_accounts.sql`
  - デモアカウントの `profiles.role` 付与を `member` に統一

### 5) ドキュメント更新
- `README.md`
- `DOCUMENTATION_INDEX.md`
- `SUPABASE_SETUP.md`
- `SESSION_COMPONENT_SWITCH_GUIDE.md`（新規）
- `DEV_SERVER_OPERATIONS.md`（新規）
  - 安全な起動/停止手順、lock競合・多重起動対策を追記

## 変更コミット（main..HEAD）
- `0e5eb4a` feat: add portal, user menu logout, and safe dev server runbook
- `b67836c` feat: add auth session UI switching and docs
- `90c02d1` feat(db): auto-create profiles on auth user signup
- `c570013` feat(auth): connect login/signup UI to Supabase Auth

## 動作確認観点（レビュー用）
- `a / 123456aa` でログイン後、ヘッダーがログイン済み表示になる
- 右上アイコンメニューからログアウトすると `/login` へ遷移する
- `/portal` から4つのダミーサービスへ遷移できる
- 未ログインで `/portal` へ行くとログイン誘導が表示される

## リスク・注意点
- デモユーザー作成は `seed_demo_guest_accounts.sql` だけでは完了しない
  - 先に `auth.users` を Dashboard で作成する必要がある
- ローカル実行時は多重起動を避け、`DEV_SERVER_OPERATIONS.md` の手順に従う
