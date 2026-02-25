# 📖 MMA Wiki デモ - ドキュメント索引

## 📁 プロジェクト構成

```
New-MMA-wiki-demo/
├── README.md                    ← 📍 プロジェクト概要
├── WIKI_ARCHITECTURE.md         ← 📍 詳細なコード構造分析
├── QUICK_REFERENCE.md           ← 📍 カスタマイズチートシート
├── mma-wiki-demo/
│   ├── app/
│   │   ├── page.tsx             ← ★ メインUI（250行）
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.ts
└── materials/
```

---

## 📚 ドキュメント一覧

### 1️⃣ **README.md** (元のプロジェクト説明)
**目的**: Wiki システムの全体要件と技術スタック確認  
**読むべき人**: 新しく参加する人・プロジェクト概要を理解したい人  

**含まれている内容**:
- Wiki システムの目的（新入生向けドキュメント化）
- 4つの主要要件（Markdown対応、メディア、権限管理、スーパーユーザー）
- 採用技術スタック（Next.js, Supabase）
- ロードマップ

**読み応え**: 5分

---

### 2️⃣ **WIKI_ARCHITECTURE.md** (詳細技術資料)
**目的**: コードの全体像と各部分の役割を理解する  
**読むべき人**: 実装者・開発メンバー・改築を担当する人  

**セクション**:
- 📋 コードマップ（行番号・セクション対応表）
- 🌳 全体構成図
- 📱 サイドバー詳細（構造・ツリー図・コード例）
- 🖥️ メインエリア詳細（トップバー・エディタ・プレビュー）
- 🧠 状態管理（useState の役割）
- 🎨 使用技術まとめ（技術表）
- 🔧 Tailwind CSS クラス一覧
- 🛠️ カスタマイズガイド（5つのパターン）
- 🚀 今後の拡張ポイント（バックエンド連携、高度な機能）

**読み応え**: 20-30分

---

### 3️⃣ **QUICK_REFERENCE.md** (実作業用チートシート)
**目的**: さっと見てコード変更できる、実用的なリファレンス  
**読むべき人**: 日々カスタマイズする人・コピペで実装したい人  

**セクション**:
- ⚡ 5分で分かる構造（図解）
- 🎯 よく変更する4つのパターン
  1. ページを追加
  2. ボタンのクリック処理
  3. ページ切り替え処理
  4. デザインカラー変更
- 📦 よく追加するパッケージ
- 🔌 バックエンド連携パターン（3つの例）
- 💾 Supabase テーブル設計
- 👨‍💻 開発の進め方（フェーズ分け）
- 🐛 よくあるエラー & 対処法
- 🎨 Tailwind CSS コード例

**読み応え**: 3-5分で目的の部分を見つけられる

---

## 🎯 用途別ガイド

### ケース1: 「このプロジェクト、何をやってるの？」
📖 **読む順序**:
1. README.md（5分）
2. WIKI_ARCHITECTURE.md の「全体構成」セクション（5分）

**所要時間**: 10分

---

### ケース2: 「このコードをカスタマイズしたい」
📖 **読む順序**:
1. QUICK_REFERENCE.md（既存の変更パターンを確認）
2. WIKI_ARCHITECTURE.md の対応セクション（詳細を確認）
3. app/page.tsx を直接編集

**所要時間**: 5-15分（変更内容による）

---

### ケース3: 「新しい機能を追加したい」
📖 **読む順序**:
1. WIKI_ARCHITECTURE.md の「今後の拡張ポイント」（10分）
2. QUICK_REFERENCE.md の「バックエンド連携パターン」（5分）
3. 実装に応じて package.json を更新

**所要時間**: 15-30分

---

### ケース4: 「Supabase 連携を始めたい」
📖 **読む順序**:
1. QUICK_REFERENCE.md の「Supabase テーブル設計」
2. WIKI_ARCHITECTURE.md の「バックエンド連携」セクション
3. QUICK_REFERENCE.md の「バックエンド連携パターン」

**所要時間**: 20-40分

---

### ケース5: 「新メンバーにこのコードについて説明したい」
📖 **読む順序**:
1. README.md を一緒に読む
2. WIKI_ARCHITECTURE.md の「全体構成」と「各セクション詳細」で図解しながら説明
3. app/page.tsx で実際のコードを見せる

**所要時間**: 30-45分（ライブデモ込み）

---

## 🔑 主要な概念

### コード全体の流れ

```
ユーザー操作
    ↓
onClick イベント
    ↓
setState() で状態更新
    ↓
コンポーネント再レンダリング
    ↓
UI 更新
```

**具体例**:
```tsx
1. ユーザーが「保存」ボタンをクリック
  ↓
2. onClick={() => handleSave()} が実行
  ↓
3. handleSave() が editorContent を取得
  ↓
4. Supabase へ POST
  ↓
5. 成功 → alert("保存完了")
```

---

### UI 構造（ツリー）

```
<Home /> (全体)
├─ <div> Flex コンテナ
│  ├─ <Sidebar />
│  │  ├─ Header
│  │  ├─ PageList
│  │  │  └─ pages.map(page)
│  │  └─ Footer (Settings, Login)
│  │
│  └─ <MainArea />
│     ├─ TopBar
│     │  ├─ Menu button (mobile)
│     │  ├─ Title
│     │  └─ Buttons (Save, PDF, Permission)
│     │
│     └─ EditorArea
│        ├─ Toolbar
│        ├─ Textarea (editorContent)
│        ├─ Preview
│        └─ Metadata
```

---

## 📊 ファイル・行数サマリー

| ファイル | 行数 | 役割 |
|---------|------|------|
| app/page.tsx | 250 | **メイン UI** (React コンポーネント) |
| globals.css | ? | CSS リセット＆Tailwind init |
| layout.tsx | ? | ルートレイアウト (HTML, head) |
| package.json | 25 | 依存パッケージ管理 |
| **WIKI_ARCHITECTURE.md** | 400+ | 📍 **詳細ドキュメント** |
| **QUICK_REFERENCE.md** | 300+ | 📍 **クイックリファレンス** |

---

## 🚀 次のステップ

### (1) 確認・理解段階
- WIKI_ARCHITECTURE.md で各セクションを確認
- ブラウザで実際に動く画面を見る

### (2) 基本カスタマイズ
- QUICK_REFERENCE.md のパターンを参考に
- ページを追加、ボタン処理を加える

### (3) Supabase セットアップ
- 新しいプロジェクトを作成
- テーブル設計を実装
- 認証機能を追加

### (4) API 連携
- fetch() または axios で Pages API を作成
- 記事の保存・読み込み機能を実装

### (5) 高度な機能
- Markdown エディタの強化
- 権限管理 UI の実装
- リアルタイム編集機能

---

## 📞 よくある質問

### Q: このコードの「癖」は何か？
**A**: 
- `'use client'` が最初に付いている → Next.js の Client Component
- Tailwind CSS のみでスタイリング（外部 CSS ファイルなし）
- 状態は local useState のみ（バックエンド未連携）
- Markdown のプレビューはプレーンテキスト表示（凝った見た目はまだ）

---

### Q: どのくらいで本番運用できるようになるか？
**A**: 
- **現状**: フロントエンド完成（UI のみ）
- **+1週間**: Supabase セットアップ＆ページ保存機能
- **+2週間**: ユーザー認証＆権限管理
- **+3週間**: Markdown エディタの強化＆リアルタイム編集
- **合計**: 4-5週間で **最小限の本番運用可能版** ができます

---

### Q: チーム開発する場合のコツは？
**A**:
1. **Git で分業**: feature ブランチで各自が機能開発
2. **コンポーネント分割**: page.tsx が大きくなったら、component/ に分ける
3. **スタイルプリセット**: Tailwind の独自カラー変数を tailwind.config.ts で定義
4. **CI/CD**: GitHub Actions で自動テスト・デプロイ

---

## 📞 ドキュメント関連のフィードバック

このドキュメントに対して：
- 分かりにくい部分がある
- 追加してほしい内容がある
- 実装時に困ったこと

があれば、以下の形式で記録してください：

```
【タイトル】何が分かりにくいのか
【該当ドキュメント】WIKI_ARCHITECTURE.md など
【詳細】具体的な行番号やセクション名
【提案】こうしてほしい
```

---

## 📅 更新履歴

| 日付 | 内容 | 作成者 |
|------|------|--------|
| 2026-02-25 | 初稿（ARCHITECTURE, QUICK_REFERENCE, INDEX） | AI Copilot |
| - | - | - |

---

## 🎓 学習リソース

このプロジェクトから学べる技術：

| 技術 | どこで出てくるか | 難易度 |
|------|-----------------|--------|
| **React** | app/page.tsx (useState, JSX) | ⭐☆☆ |
| **Next.js** | App Router, SSR の概念 | ⭐⭐☆ |
| **Tailwind CSS** | app/page.tsx の className | ⭐☆☆ |
| **Markdown** | editorContent の形式 | ⭐☆☆ |
| **Supabase** | バックエンド連携部分 | ⭐⭐⭐ |
| **TypeScript** | tsconfig.json で有効化 | ⭐⭐☆ |

---

## 📞 サポート

実装中に困った場合：
1. QUICK_REFERENCE.md の「よくあるエラー」を確認
2. WIKI_ARCHITECTURE.md の対応セクションを読む
3. 実装例をコピー＆アレンジ

---

**ドキュメント管理**: 2026年2月25日 作成  
**バージョン**: v1.0  
**ステータス**: 📍 本格チーム開発に向けた準備中
