import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function BlogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: 'guest' | 'member' | 'admin' | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    role = (profile?.role as 'guest' | 'member' | 'admin' | null) ?? null;
  }

  const isAdmin = role === 'admin';

  const baseQuery = supabase
    .from('pages')
    .select('id, title, slug, excerpt, content, created_at, is_public, is_published')
    .order('created_at', { ascending: false });

  const primaryResult = isAdmin
    ? await baseQuery
    : await baseQuery.eq('is_published', true);

  let posts = primaryResult.data;
  let error = primaryResult.error;

  const missingIsPublicColumn = !!error && (error.message.includes('is_public') || error.message.includes('column'));
  if (missingIsPublicColumn) {
    const fallbackQuery = supabase
      .from('pages')
      .select('id, title, slug, excerpt, content, created_at, is_published')
      .order('created_at', { ascending: false });

    const fallbackResult = isAdmin
      ? await fallbackQuery
      : await fallbackQuery.eq('is_published', true);

    posts = fallbackResult.data ? fallbackResult.data.map((post) => ({ ...post, is_public: false })) : null;
    error = fallbackResult.error;
  }

  const errorMessage = error?.message ?? '';
  const isPolicyRecursionError = errorMessage.includes('infinite recursion detected in policy');
  const isMissingColumnError =
    errorMessage.includes('internal_read_all') ||
    errorMessage.includes('internal_write_all') ||
    errorMessage.includes('column') ||
    errorMessage.includes('schema cache');

  return (
    <div className="p-8">
      <div className="flex items-center gap-3">
        <h1 className={`text-3xl font-bold ${isAdmin ? 'text-rose-700' : 'text-gray-900'}`}>ブログ</h1>
        {isAdmin && (
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            ADMIN VIEW
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-gray-600">
        {isAdmin
          ? 'admin は公開/非公開を含む全記事を新着順で表示しています。'
          : '公開記事を新着順で表示しています（全体公開/部内限定を含む）。'}
      </p>

      {!user && (
        <p className="mt-2 text-xs text-gray-500">未ログインでは「全体公開」の記事のみ表示されます。</p>
      )}

      {error && (
        <div className="mt-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-2">
          <p>記事の取得に失敗しました。</p>
          {isPolicyRecursionError && (
            <p>RLSポリシーの循環参照が原因です。Supabaseで `fix_policy_recursion.sql` を実行してください。</p>
          )}
          {isMissingColumnError && (
            <p>DBスキーマ差分が原因の可能性があります。Supabaseで `init_schema.sql` を再実行してください。</p>
          )}
          <p className="text-xs text-red-800 break-all">詳細: {errorMessage}</p>
        </div>
      )}

      {!error && (!posts || posts.length === 0) && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-700">まだ公開記事はありません。ログイン後、記事を投稿してください。</p>
        </div>
      )}

      {!error && posts && posts.length > 0 && (
        <div className="mt-6 space-y-4">
          {posts.map((post) => {
            const fallbackExcerpt = post.content.replace(/\s+/g, ' ').slice(0, 120);
            const excerpt = post.excerpt ?? fallbackExcerpt;
            const publishedAt = new Date(post.created_at).toLocaleDateString('ja-JP');

            return (
              <article key={post.id} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    <Link href={`/blog/${encodeURIComponent(post.slug)}`} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{publishedAt}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm text-gray-500">slug: {post.slug}</p>
                  {isAdmin && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${post.is_published ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                      {post.is_published ? '公開中' : '下書き'}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${post.is_public ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {post.is_public ? '全体公開' : '部内限定'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                  {excerpt || '本文なし'}
                </p>
                <div className="mt-4">
                  <Link
                    href={`/blog/${encodeURIComponent(post.slug)}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    続きを読む
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
