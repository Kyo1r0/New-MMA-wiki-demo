import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/utils/supabase/server';

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from('pages')
    .select('id, title, slug, content, created_at')
    .eq('slug', decodedSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  const publishedAt = new Date(post.created_at).toLocaleDateString('ja-JP');

  return (
    <article className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/blog" className="text-sm text-blue-600 hover:text-blue-700">
          ← ブログ一覧へ戻る
        </Link>
        <span className="text-xs text-gray-500">公開日: {publishedAt}</span>
      </div>

      <h1 className="mt-4 text-2xl md:text-3xl font-bold text-gray-900">{post.title}</h1>
      <p className="mt-2 text-xs text-gray-500">slug: {post.slug}</p>

      <div className="mt-6 prose prose-sm md:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
      </div>
    </article>
  );
}
