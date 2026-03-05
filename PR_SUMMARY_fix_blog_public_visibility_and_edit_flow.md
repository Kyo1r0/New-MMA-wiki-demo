# PR Summary: fix/blog-public-visibility-and-detail → main

> **注記（2026-03-05）**
> このPRサマリは履歴資料です。対象変更は `main` に反映済みです。

## 目的
- 記事単位の公開範囲（全体公開 / 部内限定）を安定運用できるようにする。
- `/blog/[slug]` 詳細の `notFound` 発生を抑制し、スキーマ差分がある環境でも表示を継続する。
- 記事詳細から既存記事を編集できる導線を追加する。

## 主要変更

### 1) 公開範囲・権限保存の安定化
- `mma-wiki-demo/app/blog/[slug]/permission-manager.tsx`
  - `is_public` / `internal_read_all` / `internal_write_all` の保存処理を強化
  - スキーマ未反映時に「部分成功」を成功表示しないよう改善
  - 利用者向けに `init_schema.sql` / `fix_public_visibility.sql` 実行案内を表示

### 2) 詳細ページの取得フォールバック
- `mma-wiki-demo/app/blog/[slug]/page.tsx`
  - 権限カラム取得で失敗した場合、最小カラムで再取得するフォールバックを追加
  - 不要な `notFound` を回避

### 3) 記事編集導線の追加
- `mma-wiki-demo/app/blog/[slug]/page.tsx`
  - 編集権限を持つユーザーに `編修する` リンクを表示
  - `/edit?slug=...` へ遷移
- `mma-wiki-demo/app/edit/page.tsx`
  - 新規投稿/既存記事編集の両モードに対応
  - 既存記事の事前読込・権限判定・更新処理を追加

### 4) 一覧表示の公開範囲反映
- `mma-wiki-demo/app/blog/page.tsx`
  - 記事ごとの公開状態に応じた表示/取得ロジックを調整

### 5) DBスキーマ・運用SQL
- `mma-wiki-demo/supabase/init_schema.sql`
- `mma-wiki-demo/supabase/verify_schema.sql`
  - `is_public` / read-write制御カラムを含む検証を更新
- `mma-wiki-demo/supabase/fix_public_visibility.sql`（新規）
  - 公開設定未反映環境向けのホットフィックスSQLを追加

### 6) ドキュメント更新
- `README.md`
- `QUICK_REFERENCE.md`
- `POST_TO_BLOG_MVP_PLAN.md`
  - 仕様を「投稿→一覧→詳細→詳細から編集」までに更新

## 動作確認観点（レビュー用）
- 記事詳細で `編修する` が表示され、編集画面に遷移できる
- `/edit?slug=...` で記事を更新後、該当詳細ページに戻る
- 「全体公開」を選択して保存すると未ログインから閲覧可能になる
- スキーマ不足時に、UIが不足カラムを明示してSQL実行を案内する

## リスク・注意点
- `is_public` 等がDBに未反映の場合、公開設定は保存されない
  - `mma-wiki-demo/supabase/fix_public_visibility.sql` を実行して揃える
- `.vscode/` は開発者ローカル設定のためコミット対象外
