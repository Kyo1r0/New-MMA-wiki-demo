# MMA NextGen Wiki Project (仮)

## 概要 (Overview)
電気通信大学MMAの部内Wiki刷新プロジェクトです。
現在稼働している旧Wikiは歴史的価値があるものの、独自記法やレガシーなシステムにより新規参入の障壁となっていました。
現在、部内インフラの改築がTCP/IPのトランスポート層まで完了しており、次なるステップとして「アプリケーション層（Web）」をモダンな技術で再構築します。

本リポジトリは、4月からのチーム開発に向けた**デモ版（プロトタイプ）**です。AI（Copilot等）を活用したバイブコーディングによって爆速でモックアップを作成し、新歓用の部誌（百萬石）の記事素材とすることを直近の目標としています。

## 目的 (Goals)
1. **新歓の部誌に書くためのネタ作り:** モダンなWebアプリが動く完成イメージ（デモ）を作り、記事のフックにする。
2. **4月からの本格始動の足掛かり:** 新入生を巻き込んだチーム開発の「たたき台」として機能させる。
3. **Web技術の学習:** 実際にWebアプリケーションを作ることで、インターネットの仕組みや最新のWeb技術を学ぶ。

## 要件 (Requirements)
本システムは以下の要件を満たすことを目指します。

- **Markdown対応:** 一般的なマークダウン記法（md）でシームレスに記事を執筆・編集できること。
- **メディアアップロード機能:** ドラッグ＆ドロップ等で直感的に画像やPDFをアップロード・埋め込みできること。
- **GUIでの権限管理:** コマンドラインを叩かずに、ブラウザ上のGUIから直感的に読み書き（Read/Write）の権限設定ができること。
- **スーパーユーザー権限:**
  - 部の会則等の重要ドキュメントの変更権限を制限する。
  - 事故対応（作成者不在のページ削除、荒らし対応など）を行うための特権管理者ロールを設ける。

## 想定技術スタック (Tech Stack)
AIによるバイブコーディングと親和性が高く、新入生の学習ハードルとモチベーションを両立できるモダンな構成を採用します。

- **Frontend:** Next.js (React) / TypeScript / Tailwind CSS
- **Backend / BaaS:** Supabase
  - Auth: ユーザー認証・ロール管理（スーパーユーザー機能）
  - Database: PostgreSQLベースのデータ保存
  - Storage: 画像・PDF等のファイル保存
  - RLS (Row Level Security): GUIからのセキュアな権限管理基盤
- **Editor:** BlockNote (または react-markdown 等)

## 今後のロードマップ (Roadmap)
- [x] READMEの策定（完了）
- [x] AIを活用したデモアプリのバイブコーディング（完了2026-02-25）
  - [x] Notion風フロントエンドUI完成
  - [x] レスポンシブデザイン対応
- [x] 開発用ドキュメント作成
  - [x] **WIKI_ARCHITECTURE.md** - 詳細なコード構造分析
  - [x] **QUICK_REFERENCE.md** - カスタマイズチートシート
  - [x] **DOCUMENTATION_INDEX.md** - ドキュメント索引
- [ ] UI/UXの完成イメージ（スクリーンショット等）の取得
- [ ] 新歓部誌への記事執筆
- [ ] 4月以降：新入生を交えたチーム開発（本番環境の構築）へ移行

---

## 📚 ドキュメント (Documentation)

このプロジェクトを改築する際は、以下のドキュメントを参照してください：

### 1. **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** 📍 最初に読む
全ドキュメントの索引・ガイド。用途別の読み順が書いてあります。
- 用途別ガイド（理解、カスタマイズ、機能追加など）
- よくある質問 (FAQ)
- 次のステップ

### 2. **[WIKI_ARCHITECTURE.md](./WIKI_ARCHITECTURE.md)** 🔧 詳細資料
コードの全体構造、各セクションの役割、状態管理、今後の拡張ポイント。
- 全体構成図（ブロック図）
- 各セクション詳細（ コード行数付き）
- Tailwind CSS クラス一覧
- 5つのカスタマイズパターン
- バックエンド連携方法

### 3. **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⚡ チートシート
実装時に参考になる、すぐ使えるコード例と設定情報。
- よく変更する4パターン
- パッケージインストール方法
- Supabase テーブル設計
- よくあるエラー & 対処法

### 4. **[SESSION_COMPONENT_SWITCH_GUIDE.md](./SESSION_COMPONENT_SWITCH_GUIDE.md)** 🔐 Session出し分けガイド
同じページ内で、未ログイン/ログイン済みのUIを切り替える実装方針。
- Server Component で Session を取得する方法
- コンポーネントの出し分けパターン
- 今後の `AuthGate` 共通化方針

### 5. **[DEV_SERVER_OPERATIONS.md](./DEV_SERVER_OPERATIONS.md)** 🧰 開発サーバー運用手順
多重起動で重くなる問題を避けるための、安全な起動/停止手順。
- Windows向けの標準手順（起動・停止・再起動）
- lock競合・ポート競合の対処
- チーム運用チェックリスト

### 6. **[POST_TO_BLOG_MVP_PLAN.md](./POST_TO_BLOG_MVP_PLAN.md)** 📝 投稿機能MVP計画
`/edit` からMarkdown投稿し、`/blog` 一覧に反映する最小実装の計画。
- 投稿=即公開、slugユーザー入力、一覧まで実装
- 必要ファイル、受け入れ条件、非スコープを明記

---

## 🚀 クイックスタート
```bash
cd mma-wiki-demo

# 依存パッケージのインストール
npm install --legacy-peer-deps

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

### コードを修正する場合
1. [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) から該当ドキュメントを選ぶ
2. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) でコード例を探す
3. `mma-wiki-demo/app/page.tsx` を編集
4. ブラウザが自動リロード

---

## 📂 プロジェクト構造

```
New-MMA-wiki-demo/
├── README.md                    ← このファイル
├── DOCUMENTATION_INDEX.md       ← 📍 ドキュメント索引 (最初に読む)
├── WIKI_ARCHITECTURE.md         ← 詳細なコード構造分析
├── QUICK_REFERENCE.md           ← カスタマイズチートシート
├── materials/                   ← 参考資料フォルダ
│
└── mma-wiki-demo/               ← メインプロジェクト
    ├── app/
    │   ├── page.tsx             ← ★ メインUI (250行)
    │   ├── layout.tsx           ← ルートレイアウト
    │   └── globals.css          ← Tailwind 設定
    ├── public/                  ← 静的ファイル
    ├── package.json             ← 依存パッケージ
    ├── tsconfig.json            ← TypeScript 設定
    ├── tailwind.config.ts       ← Tailwind CSS 設定
    └── next.config.ts           ← Next.js 設定
```

---

## 🎯 現在の状態

| 項目 | 状態 | 説明 |
|------|------|---------|
| **フロントエンド** | ✅ 完成 | Notion風UI、レスポンシブ対応済み |
| **ドキュメント** | ✅ 拡充中 | 実装ガイド（認証・Session出し分け）まで整備 |
| **バックエンド** | 🟡 基盤構築完了 | Supabase接続・スキーマSQL・検証SQLを整備 |
| **認証機能** | ✅ 実装済み | ログイン/新規登録、レイアウトのセッション連動表示 |
| **データベース** | ✅ フェーズ1基盤完了 | `profiles` / `pages` テーブル + RLSポリシー確認済み |

---

## 📝 使用技術

- **Next.js 16.1.6** - React フレームワーク
- **React 19.2.3** - UI ライブラリ
- **Tailwind CSS 4** - スタイリング
- **TypeScript** - 型安全性
- **lucide-react** - アイコンライブラリ

---

## 👨‍💻 開発チーム向け情報

### メンバー追加時
新しいメンバーが加わったら：
1. このプロジェクトをクローン
2. `DOCUMENTATION_INDEX.md` を読ませる（10分）
3. `WIKI_ARCHITECTURE.md` で構造説明（20分）
4. 簡単な修正タスクから始める

### PR/MR 時のチェックリスト
- [ ] `app/page.tsx` を編集した
- [ ] ブラウザで動作確認した
- [ ] Tailwind CSS クラスは既存のパターンに従った
- [ ] 状態管理は `useState` で実装した

### コード レビュー時のポイント
- Tailwind CSS のクラス名が正しいか
- 状態更新の構文（`setState()`）が正しいか
- 新しい依存パッケージがあれば `package.json` に記載されているか

---

## � 更新履歴

- 2026-03-01: `feature/profile-auto-init` を継続更新。
  - `mma-wiki-demo/middleware.ts` を追加し、認証Sessionの同期を安定化
  - `mma-wiki-demo/utils/supabase/client.ts` を `@supabase/ssr` ベースに変更
  - `mma-wiki-demo/app/portal/page.tsx` と配下に部内ポータル（ダミーサービス）を追加
  - `mma-wiki-demo/app/layout.tsx` の右上ユーザーメニューからログアウト可能に変更
  - `DEV_SERVER_OPERATIONS.md` を追加（安全な起動/停止手順）

- 2026-03-01: `feature/profile-auto-init` で認証導線と Session連動UI を実装。
  - `mma-wiki-demo/app/login/page.tsx` を username/password デモ運用へ調整
  - `mma-wiki-demo/app/layout.tsx` で未ログイン/ログイン済みヘッダーを出し分け
  - `mma-wiki-demo/app/page.tsx` で同一ページ内の Session コンポーネント出し分けを実装
  - `mma-wiki-demo/utils/supabase/server.ts` を追加（Server Component用クライアント）
  - `mma-wiki-demo/supabase/seed_demo_guest_accounts.sql` を追加（memberロール付与用）

- 2026-03-01: `feature/supabase-setup` で Supabase 初期構築を実施。
  - `mma-wiki-demo/supabase/init_schema.sql` を追加
  - `mma-wiki-demo/supabase/verify_schema.sql` を追加
  - `/debug` ページで env/DB 接続検証を追加
  - `.env.example` をテンプレート用途に整理
- 2026-02-27: サイト構成をヘッダーのみレイアウトに大改修。Placeholder ページ多数追加。
- 2026-02-27: ブログリンク導入および新ページ作成。
- 2026-02-27: ドキュメント索引にリファクタ記録のリンク追加。
- 2026-02-25: Notion風UI完成、詳細ドキュメント3点を追加。

## �🔗 参考リンク

- [Next.js 公式](https://nextjs.org)
- [Tailwind CSS 公式](https://tailwindcss.com)
- [lucide-react アイコン集](https://lucide.dev)
- [React 公式](https://react.dev)
- [Supabase 公式](https://supabase.com)

---

## 📞 質問・フィードバック

このドキュメントや実装について質問がある場合は、GitHub Issues または社内 Slack で報告してください。

---

**最終更新**: 2026年3月1日  
**プロジェクトレベル**: 🟡 **プロトタイプ完成 → 本格開発へ移行準備中**