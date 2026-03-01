'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function EditPage() {
  const [editorContent, setEditorContent] = useState(
    '# 新歓部誌プロジェクト2025\n\n## 概要\nこれはMMA新歓部誌用のデモページです。\n\n## 特徴\n- Markdown対応\n- メディアアップロード機能\n- GUI権限管理\n\n---\n\nこの画面でMarkdownを編集できます。'
  );

  return (
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
            <div className="text-gray-700 whitespace-pre-wrap line-clamp-6">
              {editorContent}
            </div>
          </div>
        </div>

        {/* メタ情報 */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-500">
          <div>最終編集: 2025年2月25日 14:30</div>
          <div>編集者: 新歓担当</div>
        </div>
      </div>
    </div>
  );
}