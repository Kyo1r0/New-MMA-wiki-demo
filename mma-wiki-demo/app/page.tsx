import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = Boolean(user);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Welcome to MMA Wiki</h1>
        <p className="mt-3 text-sm md:text-base text-gray-600">
          ユーザーのログイン状態（Session）に応じて、同じページの表示を切り替えるデモです。
        </p>

        {!isLoggedIn ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm text-gray-700">
              現在は未ログインです。ログインすると編集導線や部内向け機能が表示されます。
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                ログインする
              </Link>
              <Link
                href="/blog"
                className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                公開記事を見る
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
            <p className="text-sm text-gray-800">
              ログイン済みです。編集画面と部内ポータルにアクセスできます。
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href="/edit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                記事を新規作成
              </Link>
              <Link
                href="/portal"
                className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                部内ポータルへ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}