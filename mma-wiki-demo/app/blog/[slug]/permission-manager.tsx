'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';

type ReadAccessMode = 'public' | 'all-members' | 'members';
type WriteAccessMode = 'owner' | 'members' | 'all-members';

type PermissionManagerProps = {
  pageId: string;
  initialReadMode: ReadAccessMode;
  initialMemberReaders: string[];
  initialWriteMode: WriteAccessMode;
  initialMemberEditors: string[];
  candidateUsers: Array<{
    id: string;
    role: 'member' | 'admin';
    displayName: string | null;
  }>;
};

const formatCandidateLabel = (candidate: { id: string; role: 'member' | 'admin'; displayName: string | null }) => {
  const fallbackName = candidate.id.slice(0, 8);
  const name = candidate.displayName?.trim() || fallbackName;
  return `${name} (${candidate.role})`;
};

export default function PermissionManager({
  pageId,
  initialReadMode,
  initialMemberReaders,
  initialWriteMode,
  initialMemberEditors,
  candidateUsers,
}: PermissionManagerProps) {
  const [readAccessMode, setReadAccessMode] = useState<ReadAccessMode>(initialReadMode);
  const [memberReaders, setMemberReaders] = useState<string[]>(
    initialMemberReaders.length > 0 ? initialMemberReaders : ['']
  );
  const [writeAccessMode, setWriteAccessMode] = useState<WriteAccessMode>(initialWriteMode);
  const [memberEditors, setMemberEditors] = useState<string[]>(
    initialMemberEditors.length > 0 ? initialMemberEditors : ['']
  );

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const candidateIdSet = new Set(candidateUsers.map((candidate) => candidate.id));

  const addMemberReaderRow = () => {
    setMemberReaders((previous) => [...previous, '']);
  };

  const removeMemberReaderRow = (index: number) => {
    setMemberReaders((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
  };

  const updateMemberReader = (index: number, value: string) => {
    setMemberReaders((previous) =>
      previous.map((memberId, rowIndex) => (rowIndex === index ? value : memberId))
    );
  };

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

  const normalizeMemberReaderIds = () =>
    memberReaders.map((memberId) => memberId.trim()).filter((memberId) => memberId.length > 0);

  const normalizeMemberEditorIds = () =>
    memberEditors.map((memberId) => memberId.trim()).filter((memberId) => memberId.length > 0);

  const validateCandidateList = (memberIds: string[], label: string) => {
    const invalidMemberId = memberIds.find((memberId) => !candidateIdSet.has(memberId));
    if (invalidMemberId) {
      setError(`${label}は候補ユーザーから選択してください。`);
      return false;
    }

    const loweredIds = memberIds.map((memberId) => memberId.toLowerCase());
    const duplicatedId = loweredIds.find((id, index) => loweredIds.indexOf(id) !== index);
    if (duplicatedId) {
      setError(`${label}に同じユーザーIDが重複しています。1ユーザー1行にしてください。`);
      return false;
    }

    return true;
  };

  const validateMemberReaders = (memberReaderIds: string[]) => {
    if (readAccessMode !== 'members') {
      return true;
    }

    if (memberReaderIds.length === 0) {
      setError('「指定メンバーのみ閲覧可」を選んだ場合は、少なくとも1名を追加してください。');
      return false;
    }

    return validateCandidateList(memberReaderIds, '閲覧メンバー');
  };

  const validateMemberEditors = (memberEditorIds: string[]) => {
    if (writeAccessMode !== 'members') {
      return true;
    }

    if (memberEditorIds.length === 0) {
      setError('「指定メンバーを追加」を選んだ場合は、少なくとも1名を追加してください。');
      return false;
    }

    return validateCandidateList(memberEditorIds, '編集メンバー');
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    const memberReaderIds = normalizeMemberReaderIds();
    const memberEditorIds = normalizeMemberEditorIds();

    if (!validateMemberReaders(memberReaderIds)) {
      return;
    }

    if (!validateMemberEditors(memberEditorIds)) {
      return;
    }

    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('権限更新にはログインが必要です。');
        return;
      }

      let updatePageError: { message: string } | null = null;
      let partialWarning = '';

      const primaryUpdate = await supabase
        .from('pages')
        .update({
          is_public: readAccessMode === 'public',
          internal_read_all: readAccessMode === 'all-members',
          internal_write_all: writeAccessMode === 'all-members',
        })
        .eq('id', pageId);

      updatePageError = primaryUpdate.error;

      const schemaDriftError =
        !!updatePageError &&
        (updatePageError.message.includes('is_public') ||
          updatePageError.message.includes('internal_read_all') ||
          updatePageError.message.includes('internal_write_all') ||
          updatePageError.message.includes('column') ||
          updatePageError.message.includes('schema cache'));

      if (schemaDriftError) {
        const fallbackUpdate = await supabase
          .from('pages')
          .update({
            internal_write_all: writeAccessMode === 'all-members',
          })
          .eq('id', pageId);

        updatePageError = fallbackUpdate.error;

        if (!fallbackUpdate.error) {
          partialWarning = '編集権限は保存しましたが、公開範囲/閲覧範囲はDBスキーマ未反映のため未適用です。init_schema.sql または fix_public_visibility.sql を実行してください。';
        }
      }

      if (updatePageError) {
        const isPermissionError =
          updatePageError.message.includes('row-level security') ||
          updatePageError.message.includes('permission denied');

        if (isPermissionError) {
          setError('公開範囲・編集範囲の更新権限がありません。作成者または admin で実行してください。');
          return;
        }

        setError(`公開範囲・編集範囲の更新に失敗しました: ${updatePageError.message}`);
        return;
      }

      const { error: deleteError } = await supabase
        .from('page_permissions')
        .delete()
        .eq('page_id', pageId);

      if (deleteError) {
        setError('既存のメンバー権限の削除に失敗しました。');
        return;
      }

      const permissionsByUser = new Map<string, { can_read: boolean; can_write: boolean }>();

      if (readAccessMode === 'members') {
        memberReaderIds.forEach((memberId) => {
          permissionsByUser.set(memberId, { can_read: true, can_write: false });
        });
      }

      if (writeAccessMode === 'members') {
        memberEditorIds.forEach((memberId) => {
          permissionsByUser.set(memberId, { can_read: true, can_write: true });
        });
      }

      const rows = Array.from(permissionsByUser.entries()).map(([memberId, permissions]) => ({
        page_id: pageId,
        user_id: memberId,
        can_read: permissions.can_read,
        can_write: permissions.can_write,
        granted_by: user.id,
      }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from('page_permissions')
          .upsert(rows, { onConflict: 'page_id,user_id' });

        if (insertError) {
          setError('メンバー権限の保存に失敗しました。');
          return;
        }
      }

      if (partialWarning) {
        setError(partialWarning);
        return;
      }

      setSuccess('権限を更新しました。');
    } catch {
      setError('権限更新中にエラーが発生しました。時間をおいて再試行してください。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-10 border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">閲覧・編集権限</h2>
        <p className="text-xs text-gray-600 mt-1">既定は閲覧: 部内全員 / 編集: 作成者のみです。</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">{success}</p>
      )}

      <div className="border border-gray-200 rounded-lg bg-white p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">閲覧権限（read）</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="detail-read-access"
              checked={readAccessMode === 'public'}
              onChange={() => setReadAccessMode('public')}
              disabled={isSaving}
            />
            全体公開（未ログインでも閲覧可）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="detail-read-access"
              checked={readAccessMode === 'all-members'}
              onChange={() => setReadAccessMode('all-members')}
              disabled={isSaving}
            />
            部内全員が閲覧可（既定）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="detail-read-access"
              checked={readAccessMode === 'members'}
              onChange={() => setReadAccessMode('members')}
              disabled={isSaving}
            />
            指定メンバーのみ閲覧可
          </label>
        </div>

        {readAccessMode === 'members' && (
          <div className="space-y-2">
            {candidateUsers.length > 0 && (
              <p className="text-xs text-gray-500">候補から選択してください（{candidateUsers.length}件）。</p>
            )}

            {memberReaders.map((memberId, index) => (
              <div key={`member-reader-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-center">
                <select
                  value={memberId}
                  onChange={(event) => updateMemberReader(index, event.target.value)}
                  className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSaving}
                >
                  <option value="">閲覧メンバーを選択</option>
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
                  onClick={() => removeMemberReaderRow(index)}
                  className="px-2 py-1 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-60"
                  disabled={isSaving || memberReaders.length === 1}
                >
                  削除
                </button>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={addMemberReaderRow}
                className="px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isSaving}
              >
                閲覧メンバーを追加
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-lg bg-white p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">編集権限（write）</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="detail-write-access"
              checked={writeAccessMode === 'owner'}
              onChange={() => setWriteAccessMode('owner')}
              disabled={isSaving}
            />
            作成者のみ（推奨）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="detail-write-access"
              checked={writeAccessMode === 'members'}
              onChange={() => setWriteAccessMode('members')}
              disabled={isSaving}
            />
            指定メンバーを追加
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="detail-write-access"
              checked={writeAccessMode === 'all-members'}
              onChange={() => setWriteAccessMode('all-members')}
              disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving || memberEditors.length === 1}
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
                disabled={isSaving}
              >
                編集メンバーを追加
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '権限を保存'}
        </button>
      </div>
    </section>
  );
}
