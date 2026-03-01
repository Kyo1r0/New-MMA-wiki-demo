# 🔐 Session連動コンポーネント出し分けガイド

**対象**: MMA NextGen Wiki（Next.js App Router + Supabase）  
**更新日**: 2026-03-01

---

## 目的

同じページ内で「未ログイン時に見せる部品」と「ログイン済み時に見せる部品」を切り替えるための実装指針をまとめる。

※ 投稿機能の実装計画は `POST_TO_BLOG_MVP_PLAN.md` を参照。

---

## 現在の実装（反映済み）

- `mma-wiki-demo/app/layout.tsx`
  - Server Component で Session を取得し、ヘッダー右側を出し分け。
- `mma-wiki-demo/app/page.tsx`
  - 同一ページ内で未ログイン/ログイン済みのCTAを出し分け。
- `mma-wiki-demo/utils/supabase/server.ts`
  - `@supabase/ssr` を使った Server Component 用 Supabase クライアント。

---

## 推奨パターン（スマート設計）

### 1) まず Server Component で Session を取得

- `createClient()` → `supabase.auth.getUser()` をサーバー側で実行。
- `const isLoggedIn = Boolean(user)` のように判定値を1つ作る。

### 2) 画面は「共通部品 + 条件部品」に分離

- 共通部品: すべてのユーザーが見る領域（タイトル、公開情報など）
- 条件部品: ログイン状態で切り替える領域（編集導線、部内導線など）

### 3) 判定ロジックを分散させない

- 各ボタンで個別に判定しない。
- 画面の上位（`page.tsx` や `layout.tsx`）で判定し、まとめて分岐する。

---

## 実装テンプレート

```tsx
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const isLoggedIn = Boolean(user);

return (
  <>
    <CommonSection />
    {isLoggedIn ? <MemberSection /> : <GuestSection />}
  </>
);
```

---

## 次フェーズで追加する内容

1. **`AuthGate` コンポーネント化**
   - `fallback`（未ログイン表示）と `children`（ログイン済み表示）を受け取る共通部品にする。

2. **ロール連動の拡張**
   - `profiles.role`（`guest` / `member` / `admin`）で3段階出し分けに拡張。

3. **ミドルウェア保護（必要ページのみ）**
   - `/edit` など保護したいページは middleware で未認証アクセスを `/login` へ誘導。

4. **表示ゆれ対策**
   - Client Componentで認証状態を読む場合は、初期ローディング表示を入れてチラつきを防ぐ。

---

## チェックリスト

- [ ] 未ログイン時に「編集導線」が表示されない
- [ ] ログイン時に「ログイン導線」が非表示になる
- [ ] 同じページ内で分岐が完結している
- [ ] 判定条件が `isLoggedIn` など1箇所に集約されている
- [ ] 認証ガードが必要なページは別途保護している
