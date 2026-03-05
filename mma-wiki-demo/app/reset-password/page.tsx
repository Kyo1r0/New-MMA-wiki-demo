import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold mb-4">パスワード再設定（デモ）</h1>
      <p className="text-sm text-gray-700 mb-6 leading-relaxed">
        このデモ環境では、パスワード再設定はセルフサービス対応していません。
        管理者に連絡してアカウント対応を依頼してください。
      </p>

      <div className="flex gap-3">
        <Link
          href="/login"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          ログイン画面へ戻る
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          問い合わせ
        </Link>
      </div>
    </main>
  );
}
