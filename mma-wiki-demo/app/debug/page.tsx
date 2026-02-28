/**
 * デバッグページ: Supabase環境変数と接続確認
 * 
 * このページは開発時にのみ使用
 * ブラウザで http://localhost:3000/debug にアクセスして確認
 */

import { supabase } from '@/lib/supabase';

export default async function DebugPage() {
  // 環境変数が読み込まれているか確認
  const envLoaded = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Loaded' : '❌ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing',
  };

  // Supabaseに接続してpagesテーブルを確認
  let dbTest = { success: false, error: null, data: null };
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .limit(1);
    
    if (error) {
      dbTest = { success: false, error: error.message, data: null };
    } else {
      dbTest = { success: true, error: null, data };
    }
  } catch (err) {
    dbTest = { success: false, error: String(err), data: null };
  }

  // profilesテーブルも確認
  let profilesTest = { success: false, error: null, data: null };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      profilesTest = { success: false, error: error.message, data: null };
    } else {
      profilesTest = { success: true, error: null, data };
    }
  } catch (err) {
    profilesTest = { success: false, error: String(err), data: null };
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '14px' }}>
      <h1>🔧 Supabase 接続テスト</h1>
      
      <section style={{ marginBottom: '20px' }}>
        <h2>📋 環境変数チェック</h2>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(envLoaded, null, 2)}
        </pre>
        {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <p style={{ color: 'red' }}>
            ⚠️ .env.local ファイルが見つかりません。
            mma-wiki-demo/.env.local を作成してください。
          </p>
        )}
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h2>📊 pages テーブル接続テスト</h2>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(dbTest, null, 2)}
        </pre>
        {dbTest.success ? (
          <p style={{ color: 'green' }}>✅ ページテーブルに接続成功</p>
        ) : (
          <p style={{ color: 'red' }}>❌ エラーが発生しました：{dbTest.error}</p>
        )}
      </section>

      <section style={{ marginBottom: '20px' }}>
        <h2>👤 profiles テーブル接続テスト</h2>
        <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
          {JSON.stringify(profilesTest, null, 2)}
        </pre>
        {profilesTest.success ? (
          <p style={{ color: 'green' }}>✅ プロフィールテーブルに接続成功</p>
        ) : (
          <p style={{ color: 'red' }}>❌ エラーが発生しました：{profilesTest.error}</p>
        )}
      </section>

      <section>
        <h2>📖 トラブルシューティング</h2>
        <ul>
          <li>
            <strong>環境変数が読み込まれていない場合：</strong>
            <ul>
              <li>Supabase ダッシュボードから Project URL と API キーをコピー</li>
              <li>mma-wiki-demo/.env.local ファイルを作成</li>
              <li>
                以下の形式で記入：
                <pre>{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here`}</pre>
              </li>
              <li>開発サーバーを再起動（Ctrl+C → npm run dev）</li>
            </ul>
          </li>
          <li>
            <strong>テーブルが見つからない場合：</strong>
            <ul>
              <li>Supabase ダッシュボード → SQL Editor で tables テーブルが作成されているか確認</li>
              <li>SUPABASE_SETUP.md のステップ2を確認して適切に作直す</li>
            </ul>
          </li>
          <li>
            <strong>RLS エラーが出ている場合：</strong>
            <ul>
              <li>Supabase ダッシュボード → Authentication → Policies で RLS ポリシーを確認</li>
              <li>Anonymous user でもアクセス可能なポリシーになっているか確認</li>
            </ul>
          </li>
        </ul>
      </section>
    </div>
  );
}
