import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient } from '@/utils/supabase/server';
import PermissionManager from './permission-manager';

type BlogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error } = await supabase
    .from('pages')
    .select('id, title, slug, content, created_at, author_id, internal_read_all, internal_write_all')
    .eq('slug', decodedSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  const publishedAt = new Date(post.created_at).toLocaleDateString('ja-JP');
  const isAuthor = Boolean(user && user.id === post.author_id);

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }

  const canManagePermissions = isAuthor || isAdmin;

  let initialMemberReaders: string[] = [];
  let initialReadMode: 'all-members' | 'members' = post.internal_read_all ? 'all-members' : 'members';
  let initialMemberEditors: string[] = [];
  let initialWriteMode: 'owner' | 'members' | 'all-members' = post.internal_write_all ? 'all-members' : 'owner';
  let candidateUsers: Array<{ id: string; role: 'member' | 'admin'; displayName: string | null }> = [];
  if (canManagePermissions) {
    const { data: permissionRows } = await supabase
      .from('page_permissions')
      .select('user_id, can_read, can_write')
      .eq('page_id', post.id)
      .order('created_at', { ascending: true });

    initialMemberReaders = (permissionRows ?? [])
      .filter((permission) => permission.can_read)
      .map((permission) => permission.user_id);

    initialMemberEditors = (permissionRows ?? [])
      .filter((permission) => permission.can_write)
      .map((permission) => permission.user_id);

    if (!post.internal_write_all && initialMemberEditors.length > 0) {
      initialWriteMode = 'members';
    }

    const { data: profileRows } = await supabase
      .from('profiles')
      .select('id, role, display_name')
      .in('role', ['member', 'admin'])
      .order('created_at', { ascending: true });

    candidateUsers = (profileRows ?? [])
      .filter((profile) => profile.id && profile.id !== user?.id)
      .map((profile) => ({
        id: profile.id,
        role: profile.role,
        displayName: profile.display_name,
      }));
  }

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

      {canManagePermissions && (
        <PermissionManager
          pageId={post.id}
          initialReadMode={initialReadMode}
          initialMemberReaders={initialMemberReaders}
          initialWriteMode={initialWriteMode}
          initialMemberEditors={initialMemberEditors}
          candidateUsers={candidateUsers}
        />
      )}
    </article>
  );
}
