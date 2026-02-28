/**
 * Supabase クライアント初期化
 * 
 * このファイルは Supabase との通信を管理するクライアント
 * フロントエンドのすべての Supabase 操作はここを経由します
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 環境変数の検証
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check .env.local file.'
  );
}

// Supabaseクライアント生成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * TypeScript型定義
 * Supabaseのテーブル構造を定義し、型安全な開発を実現
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'guest' | 'member' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'guest' | 'member' | 'admin';
        };
        Update: {
          id?: string;
          role?: 'guest' | 'member' | 'admin';
          updated_at?: string;
        };
      };
      pages: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string | null;
          is_published: boolean;
          author_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          title: string;
          slug: string;
          content?: string;
          excerpt?: string | null;
          is_published?: boolean;
          author_id: string;
        };
        Update: {
          title?: string;
          slug?: string;
          content?: string;
          excerpt?: string | null;
          is_published?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

/**
 * 便利な型エイリアス
 */
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Page = Database['public']['Tables']['pages']['Row'];
export type PageInsert = Database['public']['Tables']['pages']['Insert'];
export type PageUpdate = Database['public']['Tables']['pages']['Update'];
export type UserRole = 'guest' | 'member' | 'admin';
