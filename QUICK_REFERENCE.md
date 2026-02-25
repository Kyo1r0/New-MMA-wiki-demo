# MMA Wiki - クイックリファレンス & カスタマイズチートシート

## ⚡ 5分で分かる構造

```
【ファイル】 app/page.tsx (250行)

【3つの大きなセクション】
├─ サイドバー (行27-62)
│  └─ ページ一覧＆ユーザーボタン
│
├─ トップバー (行76-89)
│  └─ タイトル＆ボタン（保存/PDF/権限）
│
└─ エディタエリア (行91-172)
   ├─ ツールバー (B/I/H1/H2/リンク/画像)
   ├─ テキスト入力
   ├─ プレビュー
   └─ メタ情報
```

---

## 🎯 よく変更する場所

### パターン1️⃣: ページを追加したい
```tsx
// 行19-24
const pages = [
  { id: 1, title: 'Home', icon: '🏠' },
  { id: 2, title: '部会議事録', icon: '📋' },
  { id: 3, title: '技術資料', icon: '📚' },
  { id: 4, title: 'イベント情報', icon: '📅' },
  { id: 5, title: 'よくある質問', icon: '❓' },
  { id: 6, title: 'メンバー紹介', icon: '👥' },
  // ↓ ここに追加
  { id: 7, title: 'お知らせ', icon: '📢' },
];
```

---

### パターン2️⃣: ボタンを押したときに何かしたい
```tsx
// 行84: 「保存」ボタン
<button 
  onClick={() => {
    // ★ ここに処理を書く
    alert('保存しました！');
    // API呼び出し
    // データベース更新
  }}
  className="..."
>
  <Save size={16} />
  保存
</button>
```

**例: 保存機能**
```tsx
const handleSave = async () => {
  // Supabase へ POST
  const { error } = await supabase
    .from('pages')
    .update({ content: editorContent })
    .eq('id', 1);
  
  if (!error) alert('保存完了！');
};

// ボタン内
onClick={handleSave}
```

---

### パターン3️⃣: ページをクリックしたときの挙動
```tsx
// 行52: ページボタン
<button
  key={page.id}
  onClick={() => {
    // ★ ページを切り替える処理
    setCurrentPageId(page.id);
    fetchPageContent(page.id);
  }}
  className={...}
>
  <span className="mr-2">{page.icon}</span>
  {page.title}
</button>
```

---

### パターン4️⃣: デザインカラーを変えたい

**現在の色分け**
| 要素 | 色クラス |
|------|----------|
| ログイン/保存ボタン | `bg-blue-600` |
| 背景 | `bg-white` / `bg-gray-50` |
| アクティブページ | `bg-blue-100` |

**紫に統一する場合**
```tsx
// 検索置換で以下を実行
bg-blue-600  →  bg-purple-600
bg-blue-700  →  bg-purple-700
bg-blue-100  →  bg-purple-100
text-blue-900  →  text-purple-900
```

**Tailwind オススメ色**
- `blue` / `purple` / `indigo`: 落ち着いた雰囲気
- `teal` / `cyan`: モダン
- `rose` / `pink`: ポップ

---

## 📦 よく追加するパッケージ

```bash
# Markdown のプレビューを凝った見た目にする
npm install react-markdown remark-gfm

# より高機能なエディタ (BlockNote)
npm install @blocknote/react

# 日付フォーマット
npm install date-fns

# API 呼び出しを簡潔に
npm install axios

# Supabase (バックエンド)
npm install @supabase/supabase-js
```

---

## 🔌 バックエンド連携パターン

### 例1: ページリストを取得（初期化時）
```tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const fetchPages = async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, icon');
      
      if (!error) setPages(data);
    };
    
    fetchPages();
  }, []);

  // ...
}
```

---

### 例2: 記事を保存する
```tsx
const handleSave = async () => {
  const { error } = await supabase
    .from('pages')
    .update({
      content: editorContent,
      updated_at: new Date(),
      updated_by: currentUser.id,
    })
    .eq('id', currentPageId);

  if (error) {
    alert('保存に失敗しました: ' + error.message);
  } else {
    alert('保存しました！');
  }
};
```

---

### 例3: ページタイトルを更新する
```tsx
const handleRenamePageTitle = async (newTitle) => {
  const { error } = await supabase
    .from('pages')
    .update({ title: newTitle })
    .eq('id', currentPageId);

  if (!error) {
    setPages(pages.map(p => 
      p.id === currentPageId ? { ...p, title: newTitle } : p
    ));
  }
};
```

---

## 💾 Supabase テーブル設計（参考）

```sql
-- Pages テーブル
CREATE TABLE pages (
  id BIGINT PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  icon VARCHAR(5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  is_public BOOLEAN DEFAULT true
);

-- Permissions テーブル（権限管理）
CREATE TABLE page_permissions (
  id BIGINT PRIMARY KEY,
  page_id BIGINT REFERENCES pages(id),
  user_id UUID,
  permission ENUM('view', 'edit', 'admin'),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Revisions テーブル（編集履歴）
CREATE TABLE page_revisions (
  id BIGINT PRIMARY KEY,
  page_id BIGINT REFERENCES pages(id),
  content TEXT,
  edited_by UUID,
  edited_at TIMESTAMP DEFAULT NOW()
);
```

---

## 👨‍💻 開発の進め方（推奨）

### フェーズ 1: UI 完成 ✅ (現在地)
- [x] Notion 風デザイン
- [x] 基本的な状態管理
- [ ] 各ページボタンのクリック挙動

### フェーズ 2: Supabase セットアップ (次)
- [ ] プロジェクト作成
- [ ] テーブル設計 & RLS 設定
- [ ] 認証機能（ログイン/サインアップ）

### フェーズ 3: データ連携
- [ ] ページリスト取得
- [ ] 記事の保存
- [ ] 記事の読み込み

### フェーズ 4: 高度な機能
- [ ] Markdown エディタの強化
- [ ] 権限管理 GUI
- [ ] 検索機能
- [ ] コメント & コラボレーション

---

## 🐛 よくあるエラーと対処法

| エラー | 原因 | 対処 |
|--------|------|------|
| `Cannot find module 'lucide-react'` | パッケージがない | `npm install lucide-react --legacy-peer-deps` |
| `className is not recognized` | Tailwind が読み込まれてない | `globals.css` に `@tailwind` があるか確認 |
| `setEditorContent is not a function` | `useState` をインポートしていない | 行1: `import { useState } from 'react';` |
| ボタンが反応しない | `onClick` の構文が間違っている | `onClick={() => handleFunction()}` で関数を呼び出す |
| サイドバーが閉じ始まるがすぐ開く | 状態が正しく更新されていない | `setSidebarOpen(!sidebarOpen)` の構文確認 |

---

## 🎨 Tailwind CSS クイック例

```tsx
// ボタンのスタイル例
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  クリック
</button>

// 要素を中央に
<div className="flex items-center justify-center min-h-screen">
  <p>中央</p>
</div>

// グリッドレイアウト（2列）
<div className="grid grid-cols-2 gap-4">
  <div>左</div>
  <div>右</div>
</div>

// レスポンシブ（スマホで全幅、タブレット以上で4列）
<div className="grid grid-cols-1 md:grid-cols-4">...</div>

// モバイルで非表示
<div className="hidden lg:block">デスクトップのみ表示</div>
```

---

## 📚 参考リンク

- [Next.js 公式ドキュメント](https://nextjs.org/docs)
- [Tailwind CSS クラス一覧](https://tailwindcss.com/docs)
- [lucide-react アイコン集](https://lucide.dev)
- [React Hooks 詳細](https://react.dev/reference/react)
- [Supabase 認証ガイド](https://supabase.com/docs/guides/auth)

---

## ✏️ 編集用テンプレート

### 新しいボタンを追加する場合
```tsx
<button 
  onClick={() => {
    // 処理をここに書く
  }}
  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors font-medium text-sm"
>
  <IconName size={16} />
  ボタン名
</button>
```

### 新しいセクションを追加する場合
```tsx
{/* セクション名 */}
<div className="p-6 border-t border-gray-200">
  <h3 className="text-lg font-bold text-gray-900 mb-4">セクション名</h3>
  
  {/* 内容 */}
  <p className="text-gray-700">内容をここに</p>
</div>
```

---

**最終更新**: 2026年2月25日
