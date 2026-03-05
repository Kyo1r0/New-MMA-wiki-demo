# 📝 Markdown投稿→ブログ反映 MVP 計画

> **反映メモ（2026-03-05）**
> - MVP範囲（投稿→一覧）は完了済み。
> - 追加で `/blog/[slug]` 詳細、`read/write` 権限UI、`admin` 可視化まで実装済み。
> - 既知の障害だった RLS 再帰は `fix_policy_recursion.sql` で解消済み。

**対象**: MMA NextGen Wiki  
**更新日**: 2026-03-05

---

## 目的

`/edit` で Markdown 記事を投稿し、`/blog` 一覧に即時反映される最小機能を作る。

---

## 実装状況（2026-03-05）

- ✅ `/edit` に投稿フォーム（`title` / `slug` / `content`）を実装
- ✅ 投稿時に Supabase `pages` へ insert（`is_published = true` 固定）
- ✅ 未ログイン時の投稿失敗をUI表示
- ✅ slug重複時のエラー表示を追加
- ✅ 投稿成功後に `/blog` へ遷移
- ✅ `/blog` を公開記事の実データ一覧表示へ置換

---

## 今回の決定事項（確定）

- 投稿方式: **投稿＝即公開**（`is_published = true` 固定）
- slug方針: **ユーザー入力**
- 範囲: **ブログ一覧まで**（詳細ページ `/blog/[slug]` は今回は対象外）

---

## 実装スコープ（MVP）

### 1) 投稿フォームを `/edit` に実装
- 入力項目: `title`, `slug`, `content(Markdown)`
- 必須バリデーション: 空欄チェック、slug形式チェック
- 投稿ボタン押下で Supabase `pages` に insert

### 2) `/blog` を実データ一覧に置換
- Supabase から `pages` を新着順で取得
- `is_published = true` の記事を一覧表示

### 3) 権限とエラー処理
- 未ログイン/権限不足（RLS）時の投稿失敗をUIに表示
- 投稿成功時は `/blog` へ遷移

---

## 既存DB前提（利用するルール）

- `pages` テーブルは既存利用
- insert は `member/admin` のみ許可（RLS）
- author_id はログインユーザーIDと一致必須

---

## 変更候補ファイル（優先順）

1. `mma-wiki-demo/app/edit/page.tsx`（投稿UIとinsert処理）
2. `mma-wiki-demo/app/blog/page.tsx`（一覧表示の実データ化）
3. `mma-wiki-demo/utils/supabase/client.ts`（投稿時のクライアント利用）
4. `mma-wiki-demo/middleware.ts`（セッション同期は既存流用）
5. `README.md` / `DOCUMENTATION_INDEX.md`（仕様記録）

---

## 受け入れ条件（Doneの定義）

- [x] ログイン済み `member` が `/edit` で投稿できる
- [x] 投稿後、`/blog` 一覧に新規記事が表示される
- [x] 未ログイン時は投稿できずエラー表示される
- [x] slug重複時は保存失敗し、ユーザーに理由が表示される

---

## 次にやること（MVP後）

1. `/blog/[slug]` の詳細ページを追加
2. `/edit` へのルート保護を middleware で明示化
3. `app/login/page.tsx` の `/reset-password` 導線を実在ページに合わせて修正
4. Markdownプレビューをレンダリング表示に強化

---

## 今回やらないこと

- `/blog/[slug]` 詳細ページ
- 公開/下書き切替UI
- タグ/検索/ページネーション
- Markdown表示の高度整形（最低限は次フェーズ）
