'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

type CandidateUser = {
  id: string;
  role: 'member' | 'admin';
  displayName: string | null;
};

type WriteAccessMode = 'owner' | 'members' | 'all-members';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatCandidateLabel = (candidate: CandidateUser) => {
  const fallbackName = candidate.id.slice(0, 8);
  const name = candidate.displayName?.trim() || fallbackName;
  return `${name} (${candidate.role})`;
};

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'guest' | 'member' | 'admin' | null>(null);

  const [candidateUsers, setCandidateUsers] = useState<CandidateUser[]>([]);
  const [writeAccessMode, setWriteAccessMode] = useState<WriteAccessMode>('owner');
  const [memberEditors, setMemberEditors] = useState<string[]>(['']);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(Boolean(user));
      setCurrentUserId(user?.id ?? null);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        setCurrentUserRole(profile?.role ?? null);
      } else {
        setCurrentUserRole(null);
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadCandidateUsers = async () => {
      if (!isLoggedIn) {
        setCandidateUsers([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .in('role', ['member', 'admin'])
        .order('created_at', { ascending: true });

      if (fetchError || !data) {
        setCandidateUsers([]);
        return;
      }

      setCandidateUsers(
        data
          .filter((profile) => profile.id && profile.id !== currentUserId)
          .map((profile) => ({
            id: profile.id,
            role: profile.role,
            displayName: profile.display_name,
          }))
      );
    };

    loadCandidateUsers();
  }, [isLoggedIn, currentUserId]);

  const addMemberEditorRow = () => {
    setMemberEditors((previous) => [...previous, '']);
  };

  const removeMemberEditorRow = (index: number) => {
    setMemberEditors((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  const updateMemberEditor = (index: number, value: string) => {
    setMemberEditors((previous) =>
      previous.map((memberId, rowIndex) => (rowIndex === index ? value : memberId))
    );
  };

  const validateArticleInput = () => {
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

  const normalizeMemberEditorIds = () =>
    memberEditors.map((memberId) => memberId.trim()).filter((memberId) => memberId.length > 0);

  const validateMemberEditors = (memberEditorIds: string[]) => {
    if (writeAccessMode !== 'members') {
      return true;
    }

    if (memberEditorIds.length === 0) {
      setError('「指定メンバー」を選んだ場合は、少なくとも1名を追加してください。');
      return false;
    }

    const invalidMemberId = memberEditorIds.find((memberId) => !UUID_REGEX.test(memberId));
    if (invalidMemberId) {
      setError('追加メンバーのユーザーIDは UUID 形式で入力してください。');
      return false;
    }

    const loweredIds = memberEditorIds.map((memberId) => memberId.toLowerCase());
    const duplicatedId = loweredIds.find((id, index) => loweredIds.indexOf(id) !== index);
    if (duplicatedId) {
      setError('追加メンバーに同じユーザーIDが重複しています。1ユーザー1行にしてください。');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const canPost = currentUserRole === 'member' || currentUserRole === 'admin';
    if (!canPost) {
      setError('現在の権限では投稿できません。管理者に member 権限の付与を依頼してください。');
      return;
    }

    if (!validateArticleInput()) {
      return;
    }

    const memberEditorIds = normalizeMemberEditorIds();
    if (!validateMemberEditors(memberEditorIds)) {
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

      const baseInsertPayload = {
        title: title.trim(),
        slug: slug.trim(),
        content: normalizedContent,
        excerpt: excerpt.length > 0 ? excerpt : null,
        is_published: true,
        author_id: user.id,
      };

      let createdPage: { id: string } | null = null;
      let insertError: { code?: string; message: string } | null = null;

      const withInternalWriteResult = await supabase
        .from('pages')
        .insert({
          ...baseInsertPayload,
          internal_write_all: writeAccessMode === 'all-members',
        })
        .select('id')
        .single();

      createdPage = withInternalWriteResult.data;
      insertError = withInternalWriteResult.error;

      const internalWriteColumnMissing =
        !!insertError &&
        (insertError.message.includes('internal_write_all') ||
          insertError.message.includes('column') ||
          insertError.message.includes('schema cache'));

      if (internalWriteColumnMissing) {
        const fallbackResult = await supabase
          .from('pages')
          .insert(baseInsertPayload)
          .select('id')
          .single();

        createdPage = fallbackResult.data;
        insertError = fallbackResult.error;

        if (!fallbackResult.error && writeAccessMode === 'all-members') {
          setError('投稿は完了しましたが、DBスキーマ未反映のため「部内全員を編集可」は未適用です。init_schema.sql を再実行してください。');
          router.push('/blog');
          router.refresh();
          return;
        }
      }

      if (insertError) {
        const isDuplicateSlug =
          insertError.code === '23505' ||
          insertError.message.includes('duplicate key') ||
          insertError.message.includes('pages_slug_key');

        if (isDuplicateSlug) {
          setError('その slug はすでに使用されています。別の slug を入力してください。');
          return;
        }

        const isRlsOrPermissionError =
          insertError.message.includes('row-level security') ||
          insertError.message.includes('permission denied') ||
          insertError.message.includes('new row violates row-level security');

        const isPolicyRecursionError = insertError.message.includes('infinite recursion detected in policy');

        if (isPolicyRecursionError) {
          setError('DBポリシー設定の循環参照で投稿に失敗しました。Supabase で fix_policy_recursion.sql を実行してください。');
          return;
        }

        if (isRlsOrPermissionError) {
          setError('投稿権限がありません。member/admin 権限か、profiles の role 設定を確認してください。');
          return;
        }

        setError(`投稿に失敗しました: ${insertError.message}`);
        return;
      }

      if (!createdPage) {
        setError('投稿結果の取得に失敗しました。時間をおいて再試行してください。');
        return;
      }

      if (writeAccessMode === 'members' && memberEditorIds.length > 0) {
        const permissionRows = memberEditorIds.map((memberId) => ({
          page_id: createdPage.id,
          user_id: memberId,
          can_read: true,
          can_write: true,
          granted_by: user.id,
        }));

        const { error: permissionError } = await supabase
          .from('page_permissions')
          .upsert(permissionRows, { onConflict: 'page_id,user_id' });

        if (permissionError) {
          setError('記事投稿は完了しましたが、追加メンバー権限の保存に失敗しました。');
          return;
        }
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
        <p className="mt-1 text-sm text-gray-600">タイトル・slug・Markdown本文を入力して部内記事を作成します。</p>
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

        {!isCheckingAuth && isLoggedIn && currentUserRole === 'guest' && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            guest 権限では投稿できません。管理者に member 権限の付与を依頼してください。
          </p>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">{success}</p>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">タイトル</label>
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
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1.5">slug</label>
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
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1.5">本文（Markdown）</label>
          <textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="w-full h-80 p-4 font-mono text-sm text-gray-700 rounded-lg border border-gray-300 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="# 見出し\n\n本文をMarkdownで入力..."
            disabled={isSubmitting}
          />
        </div>

        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">編集権限（write）</h2>
          <p className="text-xs text-gray-600">既定は「作成者のみ」。閲覧（read）は部内全員に許可されます。</p>

          <div className="space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="write-access"
                checked={writeAccessMode === 'owner'}
                onChange={() => setWriteAccessMode('owner')}
                disabled={isSubmitting}
              />
              作成者のみ（推奨）
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="write-access"
                checked={writeAccessMode === 'members'}
                onChange={() => setWriteAccessMode('members')}
                disabled={isSubmitting}
              />
              指定メンバーを追加
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="write-access"
                checked={writeAccessMode === 'all-members'}
                onChange={() => setWriteAccessMode('all-members')}
                disabled={isSubmitting}
              />
              部内全員を編集可（注意: 変更者が増えます）
            </label>
          </div>

          {writeAccessMode === 'members' && (
            <div className="space-y-2">
              {candidateUsers.length > 0 && (
                <>
                  <datalist id="permission-user-candidates">
                    {candidateUsers.map((candidate) => (
                      <option key={candidate.id} value={candidate.id} label={formatCandidateLabel(candidate)} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500">候補ユーザーを入力補完できます（{candidateUsers.length}件）。</p>
                </>
              )}

              {memberEditors.map((memberId, index) => (
                <div key={`member-editor-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                  <input
                    type="text"
                    value={memberId}
                    onChange={(event) => updateMemberEditor(index, event.target.value)}
                    placeholder="追加メンバーのユーザーID(UUID)"
                    list="permission-user-candidates"
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  />

                  <button
                    type="button"
                    onClick={() => removeMemberEditorRow(index)}
                    className="px-2 py-1 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-60"
                    disabled={isSubmitting || memberEditors.length === 1}
                  >
                    削除
                  </button>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addMemberEditorRow}
                  className="px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={isSubmitting}
                >
                  メンバーを追加
                </button>
              </div>
            </div>
          )}
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
            disabled={isSubmitting || isCheckingAuth || !isLoggedIn || (currentUserRole !== 'member' && currentUserRole !== 'admin')}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  );
}
