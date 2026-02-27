# リファクタリング変更まとめ (Separate Pages)

作成日: 2026-02-27
ブランチ: `feature/separate-pages`

## 概要
このドキュメントは、`feature/separate-pages` ブランチで行った変更をファイル単位でまとめたものです。どこを変更したか、何が追加/削除されたかを素早く把握できるようにしています。

---

## 変更ファイル一覧

- [mma-wiki-demo/app/layout.tsx](mma-wiki-demo/app/layout.tsx)
  - 目的: サイドバー・トップバーなどの共通レイアウトを抽出。
  - 主要変更: 既存のサイドバーとヘッダーを移動し、`children` を受け取る共通レイアウトにした。
  - 実装上の注意: `usePathname()` を使うためファイル先頭に "use client" を追加し、`metadata` のエクスポートを削除してクライアントコンポーネントに変更。

- [mma-wiki-demo/app/page.tsx](mma-wiki-demo/app/page.tsx)
  - 目的: トップページ（閲覧用）に置換。
  - 主要変更: 旧エディタ UI を削除し、閲覧用のウェルカム表示と最近更新リスト（ダミー）を表示する簡易コンポーネントへ変更。

- [mma-wiki-demo/app/edit/page.tsx](mma-wiki-demo/app/edit/page.tsx)
  - 目的: 編集ページを分離して専用ルート(`/edit`)に移動。
  - 主要変更: 旧 `app/page.tsx` にあったツールバー、`textarea`、プレビュー、メタ情報を移植して編集専用ページを作成。

- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
  - 目的: ドキュメント索引へ新しいリファクタ記録ファイルへのリンクを追加。
  - 主要変更: `SEPARATE_PAGES_REFRACTOR.md` の項目とリンクを追加。

- [SEPARATE_PAGES_REFRACTOR.md](SEPARATE_PAGES_REFRACTOR.md)
  - 目的: リファクタリングの詳細な記録（履歴・注意点・確認コマンド）。
  - 主要変更: 新規作成（共通レイアウト抽出・影響範囲・確認方法を記載）。

---

## 変更のポイント（短く）

- レイアウトの共通化によりトップページと編集ページの切り替えが容易になりました。
- `usePathname()` を `layout.tsx` で使うためクライアントコンポーネント化が必要になり、サーバー専用の `metadata` を除去しました。
- ページ分離により将来的に `Sidebar` と `Topbar` を個別コンポーネント化しやすくなっています。

---

## 確認コマンド

```powershell
# 変更を確認
git status
git diff --name-only HEAD~1..HEAD

# 変更ファイルの内容を見る（例）
code mma-wiki-demo/app/layout.tsx

# ブランチにプッシュされていることを確認
git checkout feature/separate-pages
git log --oneline -5
```

---

必要なら、各ファイルの具体的な差分（抜粋）もこのファイルに追加します。どの程度の詳細（行単位の diff / 変更箇所の抜粋）を出力しますか？
