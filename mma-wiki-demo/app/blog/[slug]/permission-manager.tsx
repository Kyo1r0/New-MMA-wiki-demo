'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';

type WriteAccessMode = 'owner' | 'members' | 'all-members';

type PermissionManagerProps = {
  pageId: string;
  initialWriteMode: WriteAccessMode;
  initialMemberEditors: string[];
  candidateUsers: Array<{
    id: string;
    role: 'member' | 'admin';
    displayName: string | null;
  }>;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatCandidateLabel = (candidate: { id: string; role: 'member' | 'admin'; displayName: string | null }) => {
  const fallbackName = candidate.id.slice(0, 8);
  const name = candidate.displayName?.trim() || fallbackName;
  return `${name} (${candidate.role})`;
};

export default function PermissionManager({
  pageId,
  initialWriteMode,
  initialMemberEditors,
  candidateUsers,
}: PermissionManagerProps) {
  const [writeAccessMode, setWriteAccessMode] = useState<WriteAccessMode>(initialWriteMode);
  const [memberEditors, setMemberEditors] = useState<string[]>(
    initialMemberEditors.length > 0 ? initialMemberEditors : ['']
  );

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const datalistId = `permission-candidates-${pageId}`;

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
      setError('同じユーザーIDが重複しています。1ユーザー1行にしてください。');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    const memberEditorIds = normalizeMemberEditorIds();
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

      const { error: updatePageError } = await supabase
        .from('pages')
        .update({ internal_write_all: writeAccessMode === 'all-members' })
        .eq('id', pageId);

      if (updatePageError) {
        setError('編集範囲の更新に失敗しました。時間をおいて再試行してください。');
        return;
      }

      const { error: deleteError } = await supabase
        .from('page_permissions')
        .delete()
        .eq('page_id', pageId)
        .eq('can_write', true);

      if (deleteError) {
        setError('既存の追加メンバー権限の削除に失敗しました。');
        return;
      }

      if (writeAccessMode === 'members' && memberEditorIds.length > 0) {
        const rows = memberEditorIds.map((memberId) => ({
          page_id: pageId,
          user_id: memberId,
          can_read: true,
          can_write: true,
          granted_by: user.id,
        }));

        const { error: insertError } = await supabase
          .from('page_permissions')
          .upsert(rows, { onConflict: 'page_id,user_id' });

        if (insertError) {
          setError('追加メンバー権限の保存に失敗しました。');
          return;
        }
      }

      setSuccess('権限を更新しました。');
    } catch {
      setError('権限更新中にエラーが発生しました。時間をおいて再試行してください。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-10 border border-gray-200 rounded-lg bg-gray-50 p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">編集権限（write）</h2>
        <p className="text-xs text-gray-600 mt-1">既定は「作成者のみ」。閲覧（read）は部内全員に許可されます。</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">{success}</p>
      )}

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
            <>
              <datalist id={datalistId}>
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
                list={datalistId}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSaving}
              />

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
              メンバーを追加
            </button>
          </div>
        </div>
      )}

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
