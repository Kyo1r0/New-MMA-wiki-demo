"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = authMode === "login";

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setError("");
    setConfirmPasswordError("");
  };

  const toDemoEmail = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.includes("@")) return trimmed;
    return `${trimmed}@a.com`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setConfirmPasswordError("");

    if (!username || !password) {
      setError("ユーザー名とパスワードを入力してください。");
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      setError("ユーザー名は英数字・._- のみ使用できます。");
      return;
    }

    const emailForAuth = toDemoEmail(username);

    if (!isLogin) {
      if (password !== confirmPassword) {
        setConfirmPasswordError("パスワードが一致しません。");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: emailForAuth,
          password,
          options: {
            data: {
              display_name: username,
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("認証処理中にエラーが発生しました。時間をおいて再試行してください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 pb-6">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            {authMode === "login" ? "ログイン" : "新規登録"}
          </h1>
          <p className="mt-2 text-sm text-gray-600 text-center">
            {authMode === "login"
              ? "MMA Wiki にログインして記事を管理します"
              : "アカウントを作成して編集機能を利用します"}
          </p>
        </div>

        <div className="px-8">
          <div className="grid grid-cols-2 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className={`h-9 rounded-md text-sm font-medium transition-colors ${
                authMode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("signup")}
              className={`h-9 rounded-md text-sm font-medium transition-colors ${
                authMode === "signup"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              新規登録
            </button>
          </div>
        </div>

        <form className="px-8 pt-6 pb-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
              ユーザー名
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="例: a"
                className="w-full h-11 rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500">デモ版では、ユーザー名を内部的に `@a.com` メールへ変換して認証します（例: `a` → `a@a.com`）。</p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              パスワード
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="8文字以上で入力"
                className="w-full h-11 rounded-lg border border-gray-300 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {authMode === "signup" && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード（確認）
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="同じパスワードを再入力"
                  className="w-full h-11 rounded-lg border border-gray-300 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? "確認用パスワードを隠す" : "確認用パスワードを表示"}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPasswordError && <p className="mt-1.5 text-sm text-red-600">{confirmPasswordError}</p>}
            </div>
          )}

          {isLogin && (
            <div className="flex items-center justify-end">
              <Link href="/reset-password" className="text-sm text-blue-600 hover:text-blue-700">
                パスワードをお忘れですか？
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "処理中..." : isLogin ? "ログインする" : "アカウントを作成"}
          </button>

          <p className="text-xs text-gray-500 text-center leading-relaxed">
            {isLogin
              ? "ログインすることで、MMA Wiki の利用規約に同意したものとみなします。"
              : "アカウント作成により、MMA Wiki の利用規約・プライバシーポリシーに同意したものとみなします。"}
          </p>
        </form>
      </div>
    </div>
  );
}
