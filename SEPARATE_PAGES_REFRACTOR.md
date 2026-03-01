# Separate Pages リファクタリング記録

> **注記（2026-03-01）**
> この文書は `feature/separate-pages` 時点の履歴記録です。現在は認証・Session連動の都合で `layout.tsx` など一部実装が更新されています。
> 最新状態は `README.md` / `SESSION_COMPONENT_SWITCH_GUIDE.md` を優先してください。

## 概要
ブランチ: `feature/separate-pages`
作業日: 2026-02-27
作業者: AI Copilot（共同作業者）

この変更は、`app/page.tsx` に集約されていた "編集 UI" を分割し、Next.js App Router に合った構成にリファクタリングしたものです。

## 変更点（要約）
- 共通レイアウトの抽出
  - ファイル: `app/layout.tsx`
  - 内容: 既存のサイドバー・トップバーを `layout.tsx` に移動し、`children` を介して全ページで共通表示されるようにした。
  - 備考: `usePathname` を利用するため `"use client"` を先頭に追加し、`metadata` のエクスポートを削除してクライアントコンポーネント化。

- トップページ（閲覧用）の追加
  - ファイル: `app/page.tsx`（上書き）
  - 内容: エディタ機能を削除し、閲覧用の「MMA Wikiへようこそ！」と最近更新されたページ一覧（ダミー）を表示。

- 編集ページの分離
  - ファイル: `app/edit/page.tsx`（新規）
  - 内容: 旧 `page.tsx` にあったツールバー、`textarea`、プレビュー、メタ情報を移植。

- ヘッダーボタンの切り替え
  - 実装場所: `app/layout.tsx`
  - 挙動:
    - `/`（トップ）: `/edit` へ遷移する `Link`（編集ボタン）を表示
    - `/edit`（編集）: 「保存」と「キャンセル」ボタンを表示（`キャンセル` は `/` に戻る `Link`）

## 影響ファイル一覧
- 変更: `app/layout.tsx` (共通レイアウト抽出・ルーティングに応じたボタン表示)
- 変更: `app/page.tsx` (ホーム閲覧用に置換)
- 追加: `app/edit/page.tsx` (編集画面)

## 追加の注意点
- `layout.tsx` はクライアントコンポーネント化 (`"use client"`) しています。サーバー専用の `metadata` はクライアントファイルから削除しました。
- 開発サーバーでポートやロックに関するエラーが出る場合、既存の `node` プロセスを停止して再起動してください。

## 確認コマンド (ローカル)
```powershell
# ブランチ確認
git branch --show-current

# 変更をステージング・コミット
git add SEPARATE_PAGES_REFRACTOR.md
git commit -m "docs: add refactor notes for separate-pages"

# プッシュ
git push origin feature/separate-pages
```

---

このファイルはコミットされ、リモートにプッシュされます。問題があれば指示ください。
