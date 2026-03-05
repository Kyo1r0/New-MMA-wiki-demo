# MMA Wiki デモ - アーキテクチャ（現行版）

> **実装反映（2026-03-05）**
> - 投稿導線（`/edit`→DB→`/blog`）と詳細表示（`/blog/[slug]`）は運用中。
> - 権限モデルは read/write の2軸（全体フラグ + `page_permissions`）で実装済み。
> - adminロールはSQL運用し、UIで識別可能な表示を導入済み。

**最終更新**: 2026-03-05  
**対象**: `New-MMA-wiki-demo/mma-wiki-demo`

この文書は、現在の実装状態に合わせたアーキテクチャ整理です。  
旧UI（サイドバー中心）前提の説明は削除し、現行のヘッダー中心構成・認証導線・投稿MVPを記録します。

---

## 1. 現行構成サマリ

- App Router ベースの Next.js 構成
- グローバルレイアウトは `app/layout.tsx`（ヘッダー + メイン）
- Session 連動UI（未ログイン/ログイン済みの出し分け）
- `/edit` から投稿して `pages` テーブルへ保存（即公開）
- `/blog` 一覧 + `/blog/[slug]` 詳細の閲覧導線
- `/edit` は middleware で未ログイン保護
- `/reset-password` はデモ向け案内ページ（セルフ再設定なし）

---

## 2. 主要ルート

| ルート | 役割 | コンポーネント種別 | 備考 |
|---|---|---|---|
| `/` | トップページ | Server Component | Sessionで導線を分岐 |
| `/login` | ログイン/新規登録 | Client Component | `next` パラメータ復帰対応 |
| `/reset-password` | 再設定案内（デモ） | Server Component | 管理者対応を案内 |
| `/edit` | 投稿フォーム | Client Component | Supabaseへ insert |
| `/blog` | 公開記事一覧 | Server Component | `is_published=true` のみ |
| `/blog/[slug]` | 記事詳細 | Server Component | Markdown表示、未存在は404 |
| `/portal` 他 | 部内向けページ群 | Server Component | 現時点はプレースホルダ中心 |

---

## 3. レイヤー構成

### 3.1 UIレイヤー
- `app/layout.tsx`: 全ページ共通ヘッダー、ナビリンク、ログイン状態に応じた右側操作群
- `app/page.tsx`: `isLoggedIn` で導線を切替
- `app/edit/page.tsx`: 投稿フォームUI + バリデーション + 送信
- `app/blog/page.tsx`: 記事一覧描画
- `app/blog/[slug]/page.tsx`: 記事詳細 + Markdown表示
- `app/login/page.tsx`: 認証フォーム（ログイン/新規登録）

### 3.2 認証・セッション
- `utils/supabase/server.ts`: Server Component / Action 用クライアント
- `utils/supabase/client.ts`: Client Component 用クライアント
- `middleware.ts`: Cookie同期 + `/edit` への未ログインアクセスを `/login?next=...` へリダイレクト

### 3.3 データアクセス
- Supabase `pages` テーブルを主に利用
- 一覧/詳細は公開記事のみ取得（`is_published = true`）
- 投稿時は `author_id = auth user.id` を付与

---

## 4. 認証フロー

1. 未ログインで `/edit` にアクセス
2. `middleware.ts` が検知して `/login?next=/edit` へリダイレクト
3. `/login` で認証成功
4. `next` パラメータが安全な相対パスなら復帰、無効なら `/` へ遷移

`/login` では open redirect 回避のため、`next` を以下条件で検証:
- `/` で始まる
- `//` で始まらない

---

## 5. 投稿MVPフロー（/edit → /blog）

1. `/edit` で `title` / `slug` / `content` を入力
2. 入力チェック
   - 必須3項目
   - `slug` は255文字以内
   - `slug` に `/ ? #` を含めない
3. `pages` に insert
   - `is_published = true`（即公開）
   - `author_id = user.id`
4. 成功時 `/blog` に遷移
5. `/blog` で新着順に表示

エラーハンドリング:
- 未ログイン投稿: エラー表示
- 重複slug（unique制約）: 専用メッセージ表示
- その他失敗: 汎用エラー表示

---

## 6. ブログ表示フロー

### 6.1 一覧 `/blog`
- `pages` から `is_published=true` を `created_at desc` で取得
- タイトル、slug、抜粋、公開日を表示
- タイトル/「続きを読む」から `/blog/[slug]` へ遷移

### 6.2 詳細 `/blog/[slug]`
- `slug` で1件取得（`maybeSingle`）
- `is_published=true` 条件付き
- 本文は `react-markdown` + `remark-gfm` で描画
- 取得失敗・未存在は `notFound()`（404）

---

## 7. 主要ファイル一覧

- `mma-wiki-demo/app/layout.tsx`
- `mma-wiki-demo/app/page.tsx`
- `mma-wiki-demo/app/login/page.tsx`
- `mma-wiki-demo/app/reset-password/page.tsx`
- `mma-wiki-demo/app/edit/page.tsx`
- `mma-wiki-demo/app/blog/page.tsx`
- `mma-wiki-demo/app/blog/[slug]/page.tsx`
- `mma-wiki-demo/middleware.ts`
- `mma-wiki-demo/utils/supabase/server.ts`
- `mma-wiki-demo/utils/supabase/client.ts`
- `mma-wiki-demo/supabase/init_schema.sql`

---

## 8. 既知の制約（デモ方針）

- パスワード再設定はセルフサービス提供なし（`/reset-password` は案内のみ）
- 公開/下書き切替UIなし（即公開固定）
- タグ、検索、ページネーション未実装
- 詳細な権限GUI/監査ログ未実装

---

## 9. 次の実装候補

1. `/blog/[slug]` へのメタ情報強化（OGP・著者名・更新日）
2. `/edit` 入力検証の拡張（文字数上限、slug正規化）
3. Markdownプレビューのリアルタイムレンダリング
4. P2機能（タグ・検索・権限GUI・メディア）

---

## 10. 更新履歴

- 2026-03-05: 本文を現行構成へ全面書き換え（認証導線、投稿MVP、ブログ詳細、reset-password導線を反映）
- 2026-03-01: 中間更新（ヘッダー中心構成への移行を部分反映）
- 2026-02-25: 初版作成
