import Link from "next/link";

export default function CalendarPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">部内カレンダー（テスト）</h1>
        <p className="mt-3 text-sm text-gray-600">これはダミーのカレンダーページです。予定表示機能は未実装です。</p>
        <Link href="/portal" className="mt-6 inline-flex text-sm text-blue-600 hover:text-blue-700">
          ← 部内ポータルに戻る
        </Link>
      </div>
    </div>
  );
}
