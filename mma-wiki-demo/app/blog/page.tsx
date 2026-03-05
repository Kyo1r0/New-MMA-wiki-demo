import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function BlogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900">ブログ</h1>
        <p className="mt-3 text-sm text-gray-600">このページは部内向けです。ログインして閲覧してください。</p>
        <div className="mt-6">
          <Link
            href="/login?next=/blog"
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            ログインする
          </Link>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role;
  const canViewInternal = role === 'member' || role === 'admin';

  if (!canViewInternal) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900">ブログ</h1>
        <p className="mt-3 text-sm text-gray-600">現在の権限では閲覧できません。管理者に member 権限の付与を依頼してください。</p>
      </div>
    );
  }

  const { data: posts, error } = await supabase
    .from('pages')
    .select('id, title, slug, excerpt, content, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">ブログ</h1>
      <p className="mt-3 text-sm text-gray-600">公開記事（即公開）を新着順で表示しています。</p>

      {error && (
        <p className="mt-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          記事の取得に失敗しました。時間をおいて再読み込みしてください。
        </p>
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
                <p className="mt-2 text-sm text-gray-500">slug: {post.slug}</p>
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
