import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

const services = [
  {
    name: "出欠管理（テスト）",
    description: "部会やイベントの出欠を登録するダミーページ",
    href: "/portal/attendance",
  },
  {
    name: "資料ストレージ（テスト）",
    description: "部内資料を整理するダミーページ",
    href: "/portal/storage",
  },
  {
    name: "部内カレンダー（テスト）",
    description: "予定確認用のダミーページ",
    href: "/portal/calendar",
  },
  {
    name: "タスク管理（テスト）",
    description: "運営タスクを並べるダミーページ",
    href: "/portal/tasks",
  },
];

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">部内ポータル</h1>
          <p className="mt-3 text-sm text-gray-600">このページはログイン後に利用できます。</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            ログインへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh]">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900">部内ポータル</h1>
        <p className="mt-2 text-sm text-gray-600">各サービスはテスト用ダミーページです。ここから遷移できます。</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="block rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
            >
              <h2 className="text-base font-semibold text-gray-900">{service.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{service.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
