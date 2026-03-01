# MMA Wiki デモ - アーキテクチャ & コード構造

> **注記（2026-03-01）**
> この文書は初期～中期の設計経緯も含むため、サイドバー中心だった時点の説明が一部残ります。
> 現行の一次情報は `README.md` / `SESSION_COMPONENT_SWITCH_GUIDE.md` / `POST_TO_BLOG_MVP_PLAN.md` を参照してください。

## 現行構成サマリ（2026-03-01）
- レイアウトはヘッダー中心（`app/layout.tsx`）で、Session状態に応じて導線を出し分け。
- 編集導線は `app/edit/page.tsx`、ブログ導線は `app/blog/page.tsx`。
- 認証・Session同期は `utils/supabase/*` と `middleware.ts` を利用。

## 🕒 更新履歴
- 2026-02-27: ヘッダーのみレイアウト導入に合わせ構造図を最新化。
- 2026-02-25: 初版作成、詳細なセクションごとのコード解説やカスタマイズガイドを追加。


## 📋 目次
1. [全体構成](#全体構成)
2. [コードマップ](#コードマップ)
3. [各セクション詳細](#各セクション詳細)
4. [状態管理](#状態管理)
5. [使用技術](#使用技術)
6. [カスタマイズガイド](#カスタマイズガイド)
7. [今後の拡張ポイント](#今後の拡張ポイント)

---

## 全体構成

```
┌─────────────────────────────────────────┐
│          ブラウザ画面全体                  │
├──────────────┬──────────────────────────┤
│              │                          │
│  サイドバー   │       メインエリア        │
│  (w-64)      │     (flex-1)             │
│              │                          │
│  ├─ ヘッダー  │  ├─ トップバー           │
│  ├─ ページ   │  │  ├─ メニュー (モバイル) │
│  │  リスト    │  │  ├─ タイトル         │
│  ├─ 新規     │  │  └─ ボタン群         │
│  │  ページ    │  │                      │
│  └─ フッター  │  └─ エディタエリア     │
│     (設定/    │     ├─ ツールバー      │
│      ログイン)│     ├─ テキスト入力    │
│              │     ├─ プレビュー      │
│              │     └─ メタ情報         │
│              │                          │
└──────────────┴──────────────────────────┘
```

---

## コードマップ

ファイル: `app/page.tsx`（**全250行）**

### ブロック構成

| 行番号 | セクション | 説明 |
|--------|-----------|------|
| 1-5 | インポート | React, useState, lucide-react アイコン |
| 6-17 | 状態定義 | sidebarOpen, editorContent, pages配列 |
| 18-26 | 返却 JSX | 全体コンテナ (flex レイアウト) |
| 27-62 | **サイドバー** | ナビゲーション＆ユーザー操作 |
| 63-174 | **メインエリア** | ヘッダー＆エディタ |
| 175-250 | ※ クロージング | JSX終了 |

---

## 各セクション詳細

### 🌳 1. ルート コンテナ（行: 26）

```tsx
<div className="flex h-screen bg-white">
```

**役割**: 全体のレイアウト基盤
- `flex`: 左右2列配置
- `h-screen`: 画面全体の高さ
- `bg-white`: 背景色（白）

---

### 📱 2. サイドバー（行: 27-62）

#### 構造
```
サイドバー (w-64 / w-0 で開閉)
├── ヘッダーセクション
│   ├── MMA Wiki (タイトル)
│   └── 電通大MMA部 (サブタイトル)
│
├── ページリスト (スクロール可)
│   ├── "Pages" ラベル
│   └── pages 配列をmap()でループ
│       ├── Home 🏠
│       ├── 部会議事録 📋
│       ├── 技術資料 📚
│       ├── イベント情報 📅
│       ├── よくある質問 ❓
│       └── メンバー紹介 👥
│
├── 新規ページボタン
│
└── フッターセクション
    ├── 設定 ⚙️
    └── ログイン 🔐
```

#### 詳細コード

**ヘッダー部分（行: 33-37）**
```tsx
<div className="p-6 border-b border-gray-200">
  <h1 className="text-xl font-bold text-gray-900">MMA Wiki</h1>
  <p className="text-xs text-gray-500 mt-1">電通大MMA部</p>
</div>
```
- パディング: `p-6`（24px）
- 下線: `border-b border-gray-200`
- テキスト: 大きめのボールドフォント

**ページリスト（行: 39-56）**
```tsx
<div className="flex-1 overflow-y-auto p-4">
  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Pages</p>
  <div className="space-y-2">
    {pages.map((page) => (
      <button
        key={page.id}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
          page.id === 1
            ? 'bg-blue-100 text-blue-900 font-medium'  // アクティブ
            : 'text-gray-700 hover:bg-gray-200'         // デフォルト
        }`}
      >
        <span className="mr-2">{page.icon}</span>
        {page.title}
      </button>
    ))}
  </div>
</div>
```

**ポイント**:
- `pages.map()` で 6つのページを動的生成
- 条件付きクラス: `page.id === 1` のとき、青色ハイライト（Home がアクティブ状態）
- `hover:bg-gray-200` でホバー効果

**新規ページボタン（行: 58-61）**
```tsx
<button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors text-sm mb-6">
  <Plus size={16} />
  新規ページ
</button>
```

**フッター（行: 63-73）**
```tsx
<div className="p-4 border-t border-gray-200 space-y-2">
  <button className="...">
    <Settings size={16} />
    設定
  </button>
  <button className="w-full ... bg-blue-600 text-white hover:bg-blue-700 ...">
    <LogIn size={16} />
    ログイン
  </button>
</div>
```

**特徴**:
- ログインボタンは青色で目立つ
- `space-y-2`: ボタン間の隙間

---

### 🖥️ 3. メインエリア（行: 75-174）

#### 構成
```
メインエリア (flex-1)
├── トップバー
│   ├── メニュー (モバイル)
│   ├── ページタイトル
│   └── ボタン群 (保存 / PDF / 権限)
│
└── エディタエリア (overflow-auto)
    └── エディタボックス
        ├── ツールバー (B / I / U / H1 / H2 / • / 🔗 / 🖼)
        ├── テキスト入力エリア
        ├── プレビューセクション
        └── メタ情報フッター
```

#### トップバー（行: 76-89）

```tsx
<div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
  <div className="flex items-center gap-4">
    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="...lg:hidden">
      <Menu size={20} className="text-gray-600" />
    </button>
    <h1 className="text-2xl font-bold text-gray-900">新歓部誌プロジェクト2025</h1>
  </div>
  <div className="flex items-center gap-3">
    <button>保存</button>
    <button>PDF出力</button>
    <button>権限設定</button>
  </div>
</div>
```

**ポイント**:
- `justify-between`: 左右に要素を配置
- `lg:hidden`: 大画面では非表示、モバイルではメニューボタン表示

---

#### エディタエリア（行: 91-172）

**ツールバー（行: 96-107）**
```tsx
<div className="bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">
  <button>B</button>      {/* 太字 */}
  <button>I</button>      {/* イタリック */}
  <button>U</button>      {/* アンダーライン */}
  <div className="w-px h-5 bg-gray-300 mx-1"></div>  {/* 区切り線 */}
  <button>H1</button>     {/* 見出し1 */}
  <button>H2</button>     {/* 見出し2 */}
  <button>•</button>      {/* リスト */}
  <div className="w-px h-5 bg-gray-300 mx-1"></div>
  <button>🔗</button>     {/* リンク */}
  <button>🖼</button>     {/* 画像 */}
</div>
```

**テキスト入力（行: 109-117）**
```tsx
<textarea
  value={editorContent}
  onChange={(e) => setEditorContent(e.target.value)}
  className="w-full h-96 p-6 font-mono text-sm text-gray-700 resize-none focus:outline-none bg-white"
  placeholder="Markdownで記事を編集..."
/>
```

**重要**:
- `value={editorContent}`: 状態と連動
- `onChange`: リアルタイム更新
- `h-96`: 高さ 384px
- `resize-none`: リサイズ不可

**プレビューセクション（行: 119-125）**
```tsx
<div className="border-t border-gray-200 bg-gray-50 p-6">
  <h3 className="text-sm font-semibold text-gray-900 mb-4">プレビュー</h3>
  <div className="prose prose-sm max-w-none bg-white p-4 rounded border border-gray-200">
    <div className="text-gray-700 whitespace-pre-wrap line-clamp-6">
      {editorContent}
    </div>
  </div>
</div>
```

**ポイント**:
- `whitespace-pre-wrap`: Markdown形式をそのまま表示
- `line-clamp-6`: 6行までのプレビュー

**メタ情報フッター（行: 127-131）**
```tsx
<div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
  <div>最終編集: 2025年2月25日 14:30</div>
  <div>編集者: 新歓担当</div>
</div>
```

---

## 状態管理

### useState (React Hooks)

**1. サイドバー開閉状態**
```tsx
const [sidebarOpen, setSidebarOpen] = useState(true);
```
- 初期値: `true`（開いている）
- トップバーのメニューボタンで切り替え
- モバイル用（`lg:hidden`）

**2. エディタ内容**
```tsx
const [editorContent, setEditorContent] = useState(
  '# 新歓部誌プロジェクト2025\n\n...'
);
```
- 初期値: デフォルトMarkdown
- `<textarea>` の値と連動
- リアルタイムで `setEditorContent()` で更新

**3. ページ配列（定数）**
```tsx
const pages = [
  { id: 1, title: 'Home', icon: '🏠' },
  { id: 2, title: '部会議事録', icon: '📋' },
  // ...
];
```
- ページリストの定義（後でデータベースから取得可能）

---

## 使用技術

| 技術 | 役割 | ここでの使い方 |
|------|------|--------------|
| **Next.js 16** | フレームワーク | App Router (`app/page.tsx`) |
| **React 19** | UI ライブラリ | `useState` ジェネリック |
| **TypeScript** | 型安全性 | (デフォルト設定で有効) |
| **Tailwind CSS 4** | スタイリング | `className="..."` 属性 |
| **lucide-react** | アイコン | Menu, Settings, LogIn, Save など |

### Tailwind CSS クラス一覧

**レイアウト**
- `flex`: Flexbox 有効
- `h-screen`: 画面全体の高さ（100vh）
- `w-64`: 幅 256px
- `w-0`: 幅 0（隠す）
- `flex-1`: 残り全体を占める
- `overflow-hidden`: はみ出した部分を隠す
- `overflow-auto`: スクロール可

**スペーシング**
- `p-6`: パディング 24px
- `px-6 py-4`: 横 24px、縦 16px
- `gap-4`: Flex アイテム間のスペース

**色**
- `bg-white`: 白背景
- `bg-gray-50`, `bg-gray-100`: グレー背景
- `text-gray-900`, `text-gray-700`: グレーテキスト
- `border-gray-200`: グレーボーダー
- `bg-blue-600 hover:bg-blue-700`: 青ボタン

**テキスト**
- `text-2xl`: 大きめサイズ
- `font-bold`: 太字
- `font-mono`: 等幅フォント

**トランジション**
- `transition-colors`: 色が滑らかに変わる
- `duration-300`: 300ms かけて変化

---

## カスタマイズガイド

### 1️⃣ ページリストを増やす

**現在のコード（行: 19-24）**
```tsx
const pages = [
  { id: 1, title: 'Home', icon: '🏠' },
  { id: 2, title: '部会議事録', icon: '📋' },
  // ...
];
```

**やり方**: 配列に新しいオブジェクトを追加
```tsx
const pages = [
  { id: 1, title: 'Home', icon: '🏠' },
  { id: 2, title: '部会議事録', icon: '📋' },
  { id: 3, title: '技術資料', icon: '📚' },
  { id: 7, title: 'インターン情報', icon: '💼' },  // ← 新しいページ
];
```

---

### 2️⃣ アクティブなページを変更

**現在（行: 52）**
```tsx
page.id === 1  // Home がアクティブ
  ? 'bg-blue-100 text-blue-900 font-medium'
  : 'text-gray-700 hover:bg-gray-200'
```

**状態化する方法**：
```tsx
const [activePage, setActivePage] = useState(1);

// ページボタン内
className={`... ${
  page.id === activePage
    ? 'bg-blue-100 text-blue-900 font-medium'
    : 'text-gray-700 hover:bg-gray-200'
}`}
onClick={() => setActivePage(page.id)}
```

---

### 3️⃣ ボタンに機能を追加

**現在の「保存」ボタン（行: 84）**
```tsx
<button className="...">
  <Save size={16} />
  保存
</button>
```

**クリック時に処理を実行**：
```tsx
<button 
  onClick={() => {
    console.log('保存ボタンが押された');
    console.log('現在の内容:', editorContent);
    // ここでAPI呼び出しなど
  }}
  className="..."
>
  <Save size={16} />
  保存
</button>
```

---

### 4️⃣ 色スキームを変更

**現在の青**:
- `bg-blue-600 hover:bg-blue-700`

**紫にする**:
```tsx
bg-purple-600 hover:bg-purple-700
text-purple-900 (背景は purple-100)
```

**よく使う Tailwind 色**: `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`

---

### 5️⃣ レスポンシブ対応を調整

**現在のメニューボタン（行: 81）**
```tsx
className="...lg:hidden"  // 大画面では隠す
```

| クラス | 何を意味するか |
|--------|--------------|
| `hidden` | 常に隠す |
| `sm:hidden` | 小画面以上で隠す |
| `lg:hidden` | 大画面以上で隠す |
| `block` | 常に表示 |
| `lg:block` | 大画面以上で表示 |

---

## 今後の拡張ポイント

### 🔌 バックエンド連携

**保存ボタン**
- Supabase Database へページ内容を保存
- API: `PATCH /pages/:id`

```tsx
const handleSave = async () => {
  const response = await fetch(`/api/pages/1`, {
    method: 'PATCH',
    body: JSON.stringify({ content: editorContent }),
  });
  // ...
};
```

**ページメニュー**
- Supabase から Pages リストを取得
- API: `GET /pages`

```tsx
useEffect(() => {
  const fetchPages = async () => {
    const { data } = await supabase.from('pages').select('*');
    setPages(data);
  };
  fetchPages();
}, []);
```

---

### 🎨 Markdown エディタの強化

**オプション 1: BlockNote**
```tsx
import { BlockNoteEditor } from "@blocknote/react";

<BlockNoteEditor
  editor={editor}
  onEditorContentChange={() => setEditorContent(...)}
/>
```

**オプション 2: react-markdown でプレビュー強化**
```tsx
import ReactMarkdown from 'react-markdown';

<ReactMarkdown>{editorContent}</ReactMarkdown>
```

---

### 🔐 認証 & 権限管理

**ログイン画面**
- Supabase Auth を使用
- OAuth (Google, GitHub)

**権限ロール**
- `admin`: 全ページ編集可能
- `editor`: 自分のページのみ編集
- `viewer`: 閲覧のみ

---

### 💾 ファイルアップロード

**画像 / PDF 埋め込み**
```tsx
const handleImageUpload = async (file: File) => {
  const { data } = await supabase.storage
    .from('wiki-media')
    .upload(`images/${file.name}`, file);
  
  const url = supabase.storage.from('wiki-media').getPublicUrl(data.path).data.publicUrl;
  setEditorContent(prev => prev + `\n![image](${url})`);
};
```

---

### 🔍 検索機能

```tsx
const handleSearch = (query: string) => {
  const results = pages.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase())
  );
  setFilteredPages(results);
};
```

---

### 📊 コメント & コラボレーション

**Real-time Collaboration:**
- Supabase Realtime で複数ユーザーの同時編集対応
- Operational Transform (OT) またはCRDT を使用

---

## 📁 ファイル構成

```
mma-wiki-demo/
├── app/
│   ├── globals.css         ← Tailwind 基本定義
│   ├── layout.tsx          ← ルートレイアウト
│   ├── page.tsx            ← ★ メインのWiki UI
│
├── public/
│   └── ... (ロゴ画像など)
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 🚀 実行方法

```bash
cd mma-wiki-demo

# 開発サーバー起動
npm run dev

# ブラウザで開く
# http://localhost:3000
```

---

## 📝 まとめ

現在の実装:
- ✅ **フロントエンド完成**: Notion 風の UI
- ✅ **状態管理**: React `useState`
- ✅ **スタイリング**: Tailwind CSS
- ⏳ **バックエンド**: これから実装
- ⏳ **認証**: これから実装
- ⏳ **データベース**: これから実装

このコード基盤を使って、4月のチーム開発へ向けて、バックエンド連携とデータベース機能を追加していく流れになります。

---

**作成日**: 2026年2月25日  
**作成者**: MMA Wiki プロジェクト
