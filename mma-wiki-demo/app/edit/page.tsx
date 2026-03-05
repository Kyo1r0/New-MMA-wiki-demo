'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

export default function EditPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(Boolean(user));
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const validateInput = () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError('タイトル・slug・本文は必須です。');
      return false;
    }

    if (slug.length > 255) {
      setError('slug は255文字以内で入力してください。');
      return false;
    }

    if (/[/?#]/.test(slug)) {
      setError('slug に / ? # は使用できません。');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!validateInput()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('投稿にはログインが必要です。ログイン後に再度お試しください。');
        return;
      }

      const normalizedContent = content.trim();
      const excerpt = normalizedContent.replace(/\s+/g, ' ').slice(0, 120);

      const { error: insertError } = await supabase.from('pages').insert({
        title: title.trim(),
        slug: slug.trim(),
        content: normalizedContent,
        excerpt: excerpt.length > 0 ? excerpt : null,
        is_published: true,
        author_id: user.id,
      });

      if (insertError) {
        const isDuplicateSlug =
          insertError.code === '23505' ||
          insertError.message.includes('duplicate key') ||
          insertError.message.includes('pages_slug_key');

        if (isDuplicateSlug) {
          setError('その slug はすでに使用されています。別の slug を入力してください。');
          return;
        }

        setError('投稿に失敗しました。権限または入力内容を確認してください。');
        return;
      }

      setSuccess('投稿しました。ブログ一覧へ移動します。');
      router.push('/blog');
      router.refresh();
    } catch {
      setError('投稿処理中にエラーが発生しました。時間をおいて再試行してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-900">記事を投稿</h1>
        <p className="mt-1 text-sm text-gray-600">タイトル・slug・Markdown本文を入力して公開記事を作成します。</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {isCheckingAuth && (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            ログイン状態を確認しています...
          </p>
        )}

        {!isCheckingAuth && !isLoggedIn && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            投稿にはログインが必要です。<Link href="/login" className="underline">ログインページ</Link>からログインしてください。
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {success}
          </p>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
            タイトル
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例: 新歓部誌プロジェクト2026"
            className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">
            slug
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="例: 新歓部誌2026"
            className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
          <p className="mt-1.5 text-xs text-gray-500">日本語slugを許可します（ただし / ? # は使用不可）。</p>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1.5">
            本文（Markdown）
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full h-80 p-4 font-mono text-sm text-gray-700 rounded-lg border border-gray-300 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="# 見出し\n\n本文をMarkdownで入力..."
            disabled={isSubmitting}
          />
        </div>

        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">プレビュー（プレーン表示）</h2>
          <div className="text-sm text-gray-700 whitespace-pre-wrap min-h-20">
            {content.trim() ? content : '本文を入力するとここに表示されます。'}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/blog"
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isCheckingAuth || !isLoggedIn}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '投稿中...' : '投稿する（即公開）'}
          </button>
        </div>
      </form>
    </div>
  );
}