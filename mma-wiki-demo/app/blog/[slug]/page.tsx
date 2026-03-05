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

  const primaryResult = await supabase
    .from('pages')
    .select('id, title, slug, content, created_at, author_id, is_public, internal_read_all, internal_write_all')
    .eq('slug', decodedSlug)
    .eq('is_published', true)
    .maybeSingle();

  let post:
    | {
        id: string;
        title: string;
        slug: string;
        content: string | null;
        created_at: string;
        author_id: string;
        is_public?: boolean | null;
        internal_read_all?: boolean | null;
        internal_write_all?: boolean | null;
      }
    | null = primaryResult.data;
  let error = primaryResult.error;

  const schemaDriftError =
    !!error &&
    (error.message.includes('is_public') ||
      error.message.includes('internal_read_all') ||
      error.message.includes('internal_write_all') ||
      error.message.includes('column') ||
      error.message.includes('schema cache'));

  if (schemaDriftError) {
    const fallbackResult = await supabase
      .from('pages')
      .select('id, title, slug, content, created_at, author_id')
      .eq('slug', decodedSlug)
      .eq('is_published', true)
      .maybeSingle();

    post = fallbackResult.data;
    error = fallbackResult.error;
  }

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

  const isPublic = 'is_public' in post ? Boolean(post.is_public) : false;
  const internalReadAll = 'internal_read_all' in post ? Boolean(post.internal_read_all) : true;
  const internalWriteAll = 'internal_write_all' in post ? Boolean(post.internal_write_all) : false;

  let canEditPost = isAuthor || isAdmin || internalWriteAll;
  if (!canEditPost && user) {
    const { data: editPermission } = await supabase
      .from('page_permissions')
      .select('can_write')
      .eq('page_id', post.id)
      .eq('user_id', user.id)
      .eq('can_write', true)
      .maybeSingle();
    canEditPost = Boolean(editPermission?.can_write);
  }

  let initialMemberReaders: string[] = [];
  const initialReadMode: 'public' | 'all-members' | 'members' = isPublic ? 'public' : (internalReadAll ? 'all-members' : 'members');
  let initialMemberEditors: string[] = [];
  let initialWriteMode: 'owner' | 'members' | 'all-members' = internalWriteAll ? 'all-members' : 'owner';
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

    if (!internalWriteAll && initialMemberEditors.length > 0) {
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
        <div className="flex items-center gap-3">
          {canEditPost && (
            <Link
              href={`/edit?slug=${encodeURIComponent(post.slug)}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              編修する
            </Link>
          )}
          <span className="text-xs text-gray-500">公開日: {publishedAt}</span>
        </div>
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
