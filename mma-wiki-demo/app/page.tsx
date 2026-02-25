'use client';

import { useState } from 'react';
import { Menu, Settings, LogIn, Save, FileText, Lock, Plus, Trash2, ChevronDown } from 'lucide-react';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorContent, setEditorContent] = useState(
    '# 新歓部誌プロジェクト2025\n\n## 概要\nこれはMMA新歓部誌用のデモページです。\n\n## 特徴\n- Markdown対応\n- メディアアップロード機能\n- GUI権限管理\n\n---\n\nこの画面でMarkdownを編集できます。'
  );

  const pages = [
    { id: 1, title: 'Home', icon: '🏠' },
    { id: 2, title: '部会議事録', icon: '📋' },
    { id: 3, title: '技術資料', icon: '📚' },
    { id: 4, title: 'イベント情報', icon: '📅' },
    { id: 5, title: 'よくある質問', icon: '❓' },
    { id: 6, title: 'メンバー紹介', icon: '👥' },
  ];

  return (
    <div className="flex h-screen bg-white">
      {/* サイドバー */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">MMA Wiki</h1>
          <p className="text-xs text-gray-500 mt-1">電通大MMA部</p>
        </div>

        {/* ページリスト */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Pages</p>
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    page.id === 1
                      ? 'bg-blue-100 text-blue-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{page.icon}</span>
                  {page.title}
                </button>
              ))}
            </div>
          </div>

          {/* 新規ページボタン */}
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors text-sm mb-6">
            <Plus size={16} />
            新規ページ
          </button>
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors text-sm">
            <Settings size={16} />
            設定
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            <LogIn size={16} />
            ログイン
          </button>
        </div>
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* トップバー */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">新歓部誌プロジェクト2025</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm">
              <Save size={16} />
              保存
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors font-medium text-sm">
              <FileText size={16} />
              PDF出力
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition-colors font-medium text-sm">
              <Lock size={16} />
              権限設定
            </button>
          </div>
        </div>

        {/* エディタエリア */}
        <div className="flex-1 overflow-auto p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* エディタツールバー */}
            <div className="bg-gray-100 border-b border-gray-200 px-6 py-3 flex items-center gap-2 flex-wrap">
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700 font-medium">B</button>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700 italic">I</button>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700 underline">U</button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700">H1</button>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700">H2</button>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700">•</button>
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700">🔗</button>
              <button className="px-3 py-1 text-sm rounded hover:bg-gray-200 transition-colors text-gray-700">🖼</button>
            </div>

            {/* エディタ本体 */}
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full h-96 p-6 font-mono text-sm text-gray-700 resize-none focus:outline-none bg-white"
              placeholder="Markdownで記事を編集..."
            />

            {/* プレビューセクション */}
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">プレビュー</h3>
              <div className="prose prose-sm max-w-none bg-white p-4 rounded border border-gray-200">
                <div className="text-gray-700 whitespace-pre-wrap line-clamp-6">{editorContent}</div>
              </div>
            </div>

            {/* メタ情報 */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
              <div>最終編集: 2025年2月25日 14:30</div>
              <div>編集者: 新歓担当</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
