# Supabase初期設定ガイド

**プロジェクト**: MMA NextGen Wiki  
**フェーズ**: 1（デモ＆基本機能版）  
**更新日**: 2026年3月1日

---

## 📌 概要

このドキュメントは、Supabaseプロジェクトの**最初の設定**と**テーブル作成**のステップをまとめています。フェーズ1の終了までに完了すべき内容です。

### ✅ 2026-02-28 実施済み
- Supabaseプロジェクト接続確認（`.env.local` 読み込みOK）
- `profiles` / `pages` テーブルへの接続確認（`/debug` で `success: true`）
- 初期スキーマSQLをリポジトリに追加
  - `mma-wiki-demo/supabase/init_schema.sql`
  - `mma-wiki-demo/supabase/verify_schema.sql`

### ✅ 2026-03-01 実施済み
- ログイン/新規登録画面を Supabase Auth と接続
  - `mma-wiki-demo/app/login/page.tsx`
- Server Component で Session を取得して UI を出し分け
  - `mma-wiki-demo/app/layout.tsx`
  - `mma-wiki-demo/app/page.tsx`
- デモアカウント用 SQL を追加
  - `mma-wiki-demo/supabase/seed_demo_guest_accounts.sql`

### デモ運用ルール（重要）
- `seed_demo_guest_accounts.sql` は `auth.users` を新規作成しない。
- 先に Supabase Dashboard（Authentication > Users）でユーザーを作成し、その後 seed SQL を実行する。
- デモログインは `username -> username@a.com` へ内部変換して認証する。

**運用ルール**:
- 実際のキーは `.env.local` のみ（Git管理しない）
- `.env.example` にはテンプレート値のみを記述

### 実施予定時期
- **期間**: 2026年3月1日～3月7日
- **推奨**: 最初の1週間で完了

---

## 🚀 ステップ1: Supabaseプロジェクト作成

### 1.1 Supabaseアカウント準備

```
前提条件:
- GitHub アカウント（OAuth認証に使用）
- メールアドレス
```

### 1.2 Supabaseプロジェクト作成

1. [https://supabase.com](https://supabase.com) にアクセス
2. **Sign Up** をクリック
3. GitHub アカウントで認証（または Email/Password）
4. **New Project** をクリック
5. 以下を入力：

| 項目 | 入力例 |
|------|--------|
| **Organization** | MMA Wiki（新規作成の場合） |
| **Project Name** | `mma-wiki-demo` |
| **Database Password** | ✅ **強力なパスワードを設定**（注：後で変更できないので慎重に） |
| **Region** | 東京（`ap-northeast-1`） or シンガポール（`ap-southeast-1`）推奨 |
| **Pricing Plan** | Free（開発環境用） |

6. **Create new project** をクリック
7. 初期化を待つ（3～5分）

---

## 🗄️ ステップ2: テーブル設計 & 作成

### 2.1 テーブル構成

フェーズ1で必要なテーブル：

```
┌────────────────┐
│    profiles    │  ← ユーザー拡張情報
├────────────────┤
│ id (FK: users) │
│ role           │
│ created_at     │
│ updated_at     │
└────────────────┘
        ▲
        │
┌────────────────────────┐
│      pages (articles)   │
├────────────────────────┤
│ id (UUID)              │
│ title                  │
│ content (Markdown)     │
│ is_published           │
│ author_id (FK)         │
│ created_at             │
│ updated_at             │
└────────────────────────┘
```

**補足**: Supabase Auth の built-in `auth.users` テーブルも使用します。

### 2.2 テーブル作成（SQL）

#### 推奨（リポジトリ同梱SQLを実行）

Supabase ダッシュボード → **SQL Editor** で、次の順で実行してください。

1. `mma-wiki-demo/supabase/init_schema.sql`
2. `mma-wiki-demo/supabase/verify_schema.sql`

これにより、`profiles.role` と `pages.title` を含むフェーズ1の基本スキーマが再現できます。

Supabase ダッシュボード → **SQL Editor** で以下を実行：

#### ① profiles テーブル（ユーザー拡張情報）

```sql
-- profiles テーブル作成
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  CONSTRAINT role_check CHECK (role IN ('guest', 'member', 'admin')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 説明: プロフィールテーブル
COMMENT ON TABLE profiles IS 'ユーザーの拡張情報と権限ロール';
COMMENT ON COLUMN profiles.role IS '権限ロール: guest (非認証) / member (部員) / admin (管理者)';
```

#### ② pages テーブル（記事/ページ）

```sql
-- pages テーブル作成
CREATE TABLE pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt VARCHAR(500) DEFAULT '',
  is_published BOOLEAN DEFAULT FALSE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- インデックス（検索性能向上）
  CONSTRAINT title_not_empty CHECK (LENGTH(title) > 0),
  CONSTRAINT slug_not_empty CHECK (LENGTH(slug) > 0)
);

-- インデックス作成
CREATE INDEX idx_pages_author_id ON pages(author_id);
CREATE INDEX idx_pages_is_published ON pages(is_published);
CREATE INDEX idx_pages_created_at ON pages(created_at DESC);
CREATE INDEX idx_pages_slug ON pages(slug);

-- RLS有効化
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- 説明: ページテーブル
COMMENT ON TABLE pages IS 'Wiki記事・ブログ記事を管理するテーブル';
COMMENT ON COLUMN pages.slug IS 'URLフレンドリーな識別子（例: feature/supabase-setup）';
COMMENT ON COLUMN pages.content IS 'Markdown形式の記事本文';
COMMENT ON COLUMN pages.excerpt IS '記事要約（ブログ一覧で表示）';
COMMENT ON COLUMN pages.is_published IS 'FALSE=下書き, TRUE=公開';
```

---

## 🔒 ステップ3: Row Level Security (RLS) ポリシー

### 3.1 基本的なRLSポリシー

RLS ポリシーは「誰が何を読み取り/編集できるか」を定義します。

#### ① profiles テーブルのRLS

```sql
-- ポリシー1: 全員がプロフィールを読み取り可能（ロール確認用）
CREATE POLICY profiles_select_all ON profiles
  FOR SELECT
  USING (true);

-- ポリシー2: 自分のプロフィールのみ更新可能
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ポリシー3: 新規プロフィール挿入は自分のidのみ
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

#### ② pages テーブルのRLS

```sql
-- ポリシー1: 公開記事は全員に見える
CREATE POLICY pages_select_published ON pages
  FOR SELECT
  USING (is_published = true OR auth.uid() = author_id);

-- ポリシー2: 非公開記事は著者・管理者のみ
CREATE POLICY pages_select_own_draft ON pages
  FOR SELECT
  USING (
    is_published = false AND (
      auth.uid() = author_id OR
      EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- ポリシー3: 記事の挿入は認証済みユーザー（role = member）のみ
CREATE POLICY pages_insert_member ON pages
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('member', 'admin'))
  );

-- ポリシー4: 記事の更新は著者か管理者のみ
CREATE POLICY pages_update_own_or_admin ON pages
  FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = author_id OR
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ポリシー5: 記事の削除は管理者のみ
CREATE POLICY pages_delete_admin ON pages
  FOR DELETE
  USING (
    EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 3.2 RLSポリシー確認

Supabase ダッシュボード → **Authentication** → **Policies** で全ポリシーが表示されます。

---

## 🔑 ステップ4: 環境変数設定

### 4.1 Supabaseキーの取得

1. Supabase ダッシュボード → **Project Settings** → **API**
2. 以下をコピー：
   - **Project URL** （`https://xxx.supabase.co`）
   - **anon key** （公開可能な API キー）
   - **service_role key** （秘密キー、共有厳禁）

### 4.2 `.env.local` に記述

```bash
# .env.local（ローカル環境）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxx

# 注: サーバー側処理用（後日使用）
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxx
```

**重要**: `.env.local` は `.gitignore` に含まれており、リポジトリに提出されません。

### 4.3 `.env.example` 用テンプレート

```bash
# .env.example（プロジェクトに提出）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

---

## 💾 ステップ5: Supabase クライアント初期化

### 5.1 必要なパッケージインストール

```bash
cd mma-wiki-demo

npm install @supabase/supabase-js
```

### 5.2 クライアント初期化ファイル作成

`lib/supabase.ts` を作成：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 型定義（TypeScript対応）
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'guest' | 'member' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'guest' | 'member' | 'admin';
        };
        Update: {
          role?: 'guest' | 'member' | 'admin';
        };
      };
      pages: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          is_published: boolean;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          slug: string;
          content?: string;
          excerpt?: string | null;
          is_published?: boolean;
          author_id: string;
        };
        Update: {
          title?: string;
          content?: string;
          excerpt?: string | null;
          is_published?: boolean;
        };
      };
    };
  };
};
```

### 5.3 使用例

```typescript
import { supabase } from '@/lib/supabase';

// ログイン
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// ページ一覧取得（公開のみ）
const { data: pages, error } = await supabase
  .from('pages')
  .select('*')
  .eq('is_published', true)
  .order('created_at', { ascending: false });

// ページ作成
const { data: newPage, error } = await supabase
  .from('pages')
  .insert([
    {
      title: 'New Article',
      slug: 'new-article',
      content: 'Article content here',
      author_id: 'user-id',
    },
  ]);
```

---

## ✅ チェックリスト

### Supabaseプロジェクト設定
- [ ] Supabaseアカウント作成
- [ ] プロジェクト作成（`mma-wiki-demo`）
- [ ] プロジェクト URL とキーを記録

### テーブル作成
- [ ] `profiles` テーブル作成
- [ ] `pages` テーブル作成
- [ ] インデックス作成確認

### RLS設定
- [ ] `profiles` RLSポリシー設定
- [ ] `pages` RLSポリシー設定
- [ ] ポリシー一覧で確認

### ローカル環境設定
- [ ] `.env.local` ファイル作成
- [ ] Supabase URL とキーを記入
- [ ] `.env.example` も作成（テンプレート用）

### クライアント初期化
- [ ] `@supabase/supabase-js` インストール
- [ ] `lib/supabase.ts` 作成
- [ ] 型定義を記述

### 確認テスト
- [ ] `npm run dev` で実行 → エラーなし
- [ ] Console でSupabaseキーが読み込まれている

---

## 🔗 参考リソース

- [Supabase 公式ドキュメント（日本語）](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security 解説](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI セットアップ](https://supabase.com/docs/guides/local-development/cli)

---

## 📝 Q&A

### Q1: パスワードを忘れたら？
**A**: Supabase はパスワード変更に対応していません。プロジェクト削除 → 再作成が必要です。

### Q2: RLSポリシーがうまく動かない時は？
**A**: 
1. ダッシュボード → **Policies** で全ポリシーを確認
2. SQL editor でテストクエリ実行：
   ```sql
   SELECT * FROM pages WHERE is_published = true;
   ```
3. `auth.uid()` が正しく認証されているか確認

### Q3: Supabase CLI での管理は？
**A**: フェーズ2で検討（ローカル開発環境用）。フェーズ1はダッシュボード操作のみ。

---

このドキュメントに従って、段階的にSupabaseを設定してください。
質問や困ったことがあれば、このドキュメントのQ&Aか、プロジェクトリードに相談してください。

