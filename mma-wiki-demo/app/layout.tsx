import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Search, Plus, Building2, CircleUserRound, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  async function handleSignOut() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}>
        {/* ヘッダー: サイドバーを廃止してヘッダーのみ */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* 左: ロゴ */}
              <div className="flex items-center gap-4">
                <Link href="/" className="text-lg font-bold text-gray-900 hover:text-blue-600">
                  MMA Wiki
                </Link>
              </div>

              {/* 中央: ナビリンク */}
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/about" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  MMAとは
                </Link>
                <Link href="/news" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  お知らせ
                </Link>
                <Link href="/blog" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  ブログ
                </Link>
                <Link href="/activities" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  活動紹介
                </Link>
                <Link href="/contact" className="text-sm text-gray-700 hover:text-blue-600 transition-colors">
                  お問い合わせ
                </Link>
              </nav>

              {/* 右: 機能ボタン */}
              <div className="flex items-center gap-3">
                <button aria-label="検索" className="p-2 rounded-md hover:bg-gray-100 transition-colors">
                  <Search size={18} className="text-gray-600" />
                </button>

                {!isLoggedIn ? (
                  <Link href="/login" className="px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    ログイン
                  </Link>
                ) : (
                  <>
                    <Link href="/portal" className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                      <Building2 size={14} />
                      部内ポータル
                    </Link>

                    <Link href="/edit" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm">
                      <Plus size={14} />
                      新規作成
                    </Link>

                    <details className="relative">
                      <summary
                        aria-label="ユーザーメニュー"
                        className="list-none p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <CircleUserRound size={20} className="text-gray-600" />
                      </summary>

                      <div className="absolute right-0 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-sm p-1 z-50">
                        <form action={handleSignOut}>
                          <button
                            type="submit"
                            className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            <LogOut size={14} />
                            ログアウト
                          </button>
                        </form>
                      </div>
                    </details>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-screen">
          <div className="max-w-5xl mx-auto w-full p-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
