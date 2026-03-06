'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/utils/supabase/client';

type CandidateUser = {
  id: string;
  role: 'member' | 'admin';
  displayName: string | null;
};

type ReadAccessMode = 'public' | 'internal';
type WriteAccessMode = 'owner' | 'members' | 'all-members';

const formatCandidateLabel = (candidate: CandidateUser) => {
  const fallbackName = candidate.id.slice(0, 8);
  const name = candidate.displayName?.trim() || fallbackName;
  return `${name} (${candidate.role})`;
};

export default function EditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get('slug')?.trim() ?? '';
  const isEditMode = editSlug.length > 0;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'guest' | 'member' | 'admin' | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [canEditCurrentArticle, setCanEditCurrentArticle] = useState(false);
  const [isLoadingEditArticle, setIsLoadingEditArticle] = useState(false);

  const [candidateUsers, setCandidateUsers] = useState<CandidateUser[]>([]);
  const candidateIdSet = new Set(candidateUsers.map((candidate) => candidate.id));
  const [readAccessMode, setReadAccessMode] = useState<ReadAccessMode>('internal');
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

  useEffect(() => {
    const loadEditTarget = async () => {
      if (!isEditMode || isCheckingAuth) {
        return;
      }

      setIsLoadingEditArticle(true);
      setError('');
      setSuccess('');

      if (!isLoggedIn || !currentUserId) {
        setCanEditCurrentArticle(false);
        setError('記事編集にはログインが必要です。');
        setIsLoadingEditArticle(false);
        return;
      }

      const initialResult = await supabase
        .from('pages')
        .select('id, title, slug, content, author_id, is_public, internal_write_all')
        .eq('slug', editSlug)
        .maybeSingle();

      let pageData:
        | {
            id: string;
            title: string;
            slug: string;
            content: string | null;
            author_id: string;
            is_public?: boolean | null;
            internal_write_all?: boolean | null;
          }
        | null = initialResult.data;
      let pageError = initialResult.error;

      const schemaDriftError =
        !!pageError &&
        (pageError.message.includes('is_public') ||
          pageError.message.includes('internal_write_all') ||
          pageError.message.includes('column') ||
          pageError.message.includes('schema cache'));

      if (schemaDriftError) {
        const fallbackResult = await supabase
          .from('pages')
          .select('id, title, slug, content, author_id')
          .eq('slug', editSlug)
          .maybeSingle();

        pageData = fallbackResult.data;
        pageError = fallbackResult.error;
      }

      if (pageError || !pageData) {
        setCanEditCurrentArticle(false);
        setError('編集対象の記事が見つかりませんでした。');
        setIsLoadingEditArticle(false);
        return;
      }

      const isAuthor = pageData.author_id === currentUserId;
      const internalWriteAll = 'internal_write_all' in pageData ? Boolean(pageData.internal_write_all) : false;

      let canEdit = currentUserRole === 'admin' || isAuthor || internalWriteAll;

      if (!canEdit) {
        const { data: permission } = await supabase
          .from('page_permissions')
          .select('can_write')
          .eq('page_id', pageData.id)
          .eq('user_id', currentUserId)
          .eq('can_write', true)
          .maybeSingle();
        canEdit = Boolean(permission?.can_write);
      }

      if (!canEdit) {
        setCanEditCurrentArticle(false);
        setError('この記事の編集権限がありません。');
        setIsLoadingEditArticle(false);
        return;
      }

      setEditingPageId(pageData.id);
      setCanEditCurrentArticle(true);
      setTitle(pageData.title ?? '');
      setSlug(pageData.slug ?? '');
      setContent(pageData.content ?? '');
      setReadAccessMode('is_public' in pageData && pageData.is_public ? 'public' : 'internal');
      setWriteAccessMode(internalWriteAll ? 'all-members' : 'owner');
      setMemberEditors(['']);

      if (currentUserRole === 'admin' || isAuthor) {
        const { data: permissions } = await supabase
          .from('page_permissions')
          .select('user_id, can_write')
          .eq('page_id', pageData.id)
          .eq('can_write', true)
          .order('created_at', { ascending: true });

        const writerIds = (permissions ?? []).map((permission) => permission.user_id).filter((userId) => userId.length > 0);
        if (!internalWriteAll && writerIds.length > 0) {
          setWriteAccessMode('members');
          setMemberEditors(writerIds);
        }
      }

      setIsLoadingEditArticle(false);
    };

    loadEditTarget();
  }, [isEditMode, isCheckingAuth, isLoggedIn, currentUserId, currentUserRole, editSlug]);

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

    const invalidMemberId = memberEditorIds.find((memberId) => !candidateIdSet.has(memberId));
    if (invalidMemberId) {
      setError('追加メンバーは候補ユーザーから選択してください。');
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

    if (isDeleting) {
      return;
    }

    if (!isEditMode) {
      const canPost = currentUserRole === 'member' || currentUserRole === 'admin';
      if (!canPost) {
        setError('現在の権限では投稿できません。管理者に member 権限の付与を依頼してください。');
        return;
      }
    } else if (!editingPageId || !canEditCurrentArticle) {
      setError('この記事を編集する権限がありません。');
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

      if (isEditMode && editingPageId) {
        const baseUpdatePayload = {
          title: title.trim(),
          slug: slug.trim(),
          content: normalizedContent,
          excerpt: excerpt.length > 0 ? excerpt : null,
        };

        let updateError: { code?: string; message: string } | null = null;

        const withPermissionColumnsResult = await supabase
          .from('pages')
          .update({
            ...baseUpdatePayload,
            is_public: readAccessMode === 'public',
            internal_write_all: writeAccessMode === 'all-members',
          })
          .eq('id', editingPageId);

        updateError = withPermissionColumnsResult.error;

        const permissionColumnsMissing =
          !!updateError &&
          (updateError.message.includes('is_public') ||
            updateError.message.includes('internal_write_all') ||
            updateError.message.includes('column') ||
            updateError.message.includes('schema cache'));

        if (permissionColumnsMissing) {
          const fallbackUpdateResult = await supabase
            .from('pages')
            .update(baseUpdatePayload)
            .eq('id', editingPageId);

          updateError = fallbackUpdateResult.error;

          if (!fallbackUpdateResult.error && (writeAccessMode === 'all-members' || readAccessMode === 'public')) {
            setError('記事更新は完了しましたが、DBスキーマ未反映のため公開/編集範囲の一部が未適用です。init_schema.sql または fix_public_visibility.sql を実行してください。');
            router.push(`/blog/${encodeURIComponent(slug.trim())}`);
            router.refresh();
            return;
          }
        }

        if (updateError) {
          const isDuplicateSlug =
            updateError.code === '23505' ||
            updateError.message.includes('duplicate key') ||
            updateError.message.includes('pages_slug_key');

          if (isDuplicateSlug) {
            setError('その slug はすでに使用されています。別の slug を入力してください。');
            return;
          }

          const isRlsOrPermissionError =
            updateError.message.includes('row-level security') ||
            updateError.message.includes('permission denied');

          if (isRlsOrPermissionError) {
            setError('この記事を編集する権限がありません。');
            return;
          }

          setError(`記事更新に失敗しました: ${updateError.message}`);
          return;
        }

        setSuccess('更新しました。記事ページへ移動します。');
        router.push(`/blog/${encodeURIComponent(slug.trim())}`);
        router.refresh();
        return;
      }

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
          is_public: readAccessMode === 'public',
          internal_write_all: writeAccessMode === 'all-members',
        })
        .select('id')
        .single();

      createdPage = withInternalWriteResult.data;
      insertError = withInternalWriteResult.error;

      const internalWriteColumnMissing =
        !!insertError &&
        (insertError.message.includes('internal_write_all') ||
          insertError.message.includes('is_public') ||
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

        if (!fallbackResult.error && (writeAccessMode === 'all-members' || readAccessMode === 'public')) {
          setError('投稿は完了しましたが、DBスキーマ未反映のため公開/編集範囲の一部が未適用です。init_schema.sql を再実行してください。');
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

  const handleDeleteArticle = async () => {
    setError('');
    setSuccess('');

    if (isSubmitting) {
      return;
    }

    if (!isEditMode || !editingPageId) {
      setError('削除対象の記事が見つかりませんでした。');
      return;
    }

    if (currentUserRole !== 'admin') {
      setError('記事を削除できるのは admin のみです。');
      return;
    }

    const shouldDelete = window.confirm('この記事を削除します。元に戻せません。よろしいですか？');
    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('記事削除にはログインが必要です。');
        return;
      }

      const { error: deleteError } = await supabase
        .from('pages')
        .delete()
        .eq('id', editingPageId);

      if (deleteError) {
        const isRlsOrPermissionError =
          deleteError.message.includes('row-level security') ||
          deleteError.message.includes('permission denied');

        if (isRlsOrPermissionError) {
          setError('この記事を削除する権限がありません。');
          return;
        }

        setError(`記事の削除に失敗しました: ${deleteError.message}`);
        return;
      }

      setSuccess('記事を削除しました。ブログ一覧へ移動します。');
      router.push('/blog');
      router.refresh();
    } catch {
      setError('記事削除中にエラーが発生しました。時間をおいて再試行してください。');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-900">{isEditMode ? '記事を編集' : '記事を投稿'}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {isEditMode
            ? '既存記事のタイトル・slug・Markdown本文を更新します。'
            : 'タイトル・slug・Markdown本文を入力して部内記事を作成します。'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {isCheckingAuth && (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            ログイン状態を確認しています...
          </p>
        )}

        {!isCheckingAuth && !isLoggedIn && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {isEditMode ? '編集には' : '投稿には'}ログインが必要です。<Link href="/login" className="underline">ログインページ</Link>からログインしてください。
          </p>
        )}

        {!isCheckingAuth && !isEditMode && isLoggedIn && currentUserRole === 'guest' && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            guest 権限では投稿できません。管理者に member 権限の付与を依頼してください。
          </p>
        )}

        {isEditMode && isLoadingEditArticle && (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            編集対象の記事を読み込んでいます...
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
          <h2 className="text-sm font-semibold text-gray-900">公開範囲（read）</h2>
          <p className="text-xs text-gray-600">記事ごとに「全体公開」か「部内限定」を選択できます。</p>

          <div className="space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="read-access"
                checked={readAccessMode === 'public'}
                onChange={() => setReadAccessMode('public')}
                disabled={isSubmitting}
              />
              全体公開（未ログインでも閲覧可）
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="read-access"
                checked={readAccessMode === 'internal'}
                onChange={() => setReadAccessMode('internal')}
                disabled={isSubmitting}
              />
              部内限定（ログイン + 権限に応じて閲覧可）
            </label>
          </div>
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
                <p className="text-xs text-gray-500">候補から選択してください（{candidateUsers.length}件）。</p>
              )}

              {memberEditors.map((memberId, index) => (
                <div key={`member-editor-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                  <select
                    value={memberId}
                    onChange={(event) => updateMemberEditor(index, event.target.value)}
                    className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">編集メンバーを選択</option>
                    {memberId && !candidateIdSet.has(memberId) && (
                      <option value={memberId}>不明ユーザー ({memberId.slice(0, 8)})</option>
                    )}
                    {candidateUsers.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {formatCandidateLabel(candidate)}
                      </option>
                    ))}
                  </select>

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
          <h2 className="text-sm font-semibold text-gray-900 mb-2">プレビュー（Markdown）</h2>
          <div className="prose prose-sm md:prose-base max-w-none min-h-20 prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800 prose-code:text-gray-800">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="m-0 text-sm text-gray-500">本文を入力するとMarkdownプレビューがここに表示されます。</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            {isEditMode && (
              <button
                type="button"
                onClick={handleDeleteArticle}
                disabled={
                  isDeleting ||
                  isSubmitting ||
                  isCheckingAuth ||
                  isLoadingEditArticle ||
                  !isLoggedIn ||
                  !canEditCurrentArticle ||
                  currentUserRole !== 'admin'
                }
                className="px-4 py-2 rounded-md border border-red-300 text-sm text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? '削除中...' : '記事の削除'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
          <Link
            href="/blog"
            className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              isDeleting ||
              isCheckingAuth ||
              isLoadingEditArticle ||
              !isLoggedIn ||
              (!isEditMode && currentUserRole !== 'member' && currentUserRole !== 'admin') ||
              (isEditMode && !canEditCurrentArticle)
            }
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (isEditMode ? '更新中...' : '投稿中...') : (isEditMode ? '更新する' : '投稿する')}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}
