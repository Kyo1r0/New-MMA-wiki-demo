# GitHub Flow運用ガイド

**プロジェクト**: MMA NextGen Wiki  
**ブランチ戦略**: GitHub Flow（シンプル版）  
**更新日**: 2026年3月1日

---

## 📖 概要

このプロジェクトは **GitHub Flow** を採用しています。シンプルな運用で、小規模～中規模チーム向けに最適化されています。

### ポイント
- **マスターブランチ**: `main` （常に本番可能な状態）
- **開発ブランチ**: `feature/*` （個別機能の開発）
- **PR ベース**: 全ての変更は PR でコードレビュー後にマージ
- **デプロイ**: main へのマージ = 自動デプロイ（本番環境に反映）

---

## 🔄 ブランチ命名規則

### 基本形式
```
feature/<機能名>
```

### 命名例

| 機能 | ブランチ名 |
|------|----------|
| Supabase認証連携 | `feature/supabase-auth` |
| ブログ一覧表示 | `feature/blog-list-page` |
| ユーザー権限机能 | `feature/user-permissions` |
| UI ポーランド | `feature/polish-ui` |
| バグ修正 | `feature/fix-editor-bug` |

### 命名ルール
- **小文字のみ** 使用
- **単語区切りはハイフン** (`-`)
- **説明的で簡潔** （20文字以内が目安）
- **Issueが存在する場合**: `feature/issue-123-機能名` 形式も可

---

## 🚀 ワークフロー

### ステップ1: ブランチを切る

```bash
# main から最新コードを取得
git checkout main
git pull origin main

# 新しい feature ブランチを作成 + 切り替え
git checkout -b feature/your-feature-name
```

### ステップ2: 開発 & コミット

```bash
# ファイル編集
# ... コード変更 ...

# 変更をステージング
git add <ファイル名>

# コミット（わかりやすいメッセージ）
git commit -m "feat: ブログ一覧ページを実装"
git commit -m "fix: エディタバグを修正"
git commit -m "docs: README を更新"
```

#### コミットメッセージのプリフィックス
- `feat:` - 新機能
- `fix:` - バグ修正
- `docs:` - ドキュメント更新
- `style:` - スタイル変更（コード整形など）
- `refactor:` - リファクタリング
- `test:` - テスト追加
- `chore:` - ビルド・依存関係などの変更

### ステップ3: リモートへプッシュ

```bash
# ブランチの履歴を確認
git log --oneline origin/main..HEAD

# リモートにプッシュ
git push -u origin feature/your-feature-name
```

### ステップ4: PR（プルリクエスト）を作成

1. GitHub の **Pull Requests** タブへアクセス
2. **New Pull Request** をクリック
3. **base**: `main`、**compare**: `feature/your-feature-name` を選択
4. PR タイトルと説明を記入

#### PR テンプレート（説明欄の記入例）

```markdown
## 📝 変更内容
ブログ一覧ページを実装し、Supabase から記事を取得・表示できるようにしました。

## ✅ 実装内容
- [ ] `/blog` ページコンポーネント作成
- [ ] Supabase から記事一覧を取得
- [ ] ブログカード形式で表示
- [ ] ページネーション機能

## 🧪 テスト実施
- [ ] ローカルで `npm run dev` で動作確認
- [ ] 異なる権限ユーザーで閲覧確認

## 📸 スクリーンショット（該当する場合）
[画像やGIFを添付]

## 関連 Issue
Closes #123
```

### ステップ5: コードレビュー ＆ 修正

1. **レビュアーが確認**: 他のチームメンバーが PR をレビュー
2. **修正依頼があれば**: ローカルで修正して再度プッシュ
   ```bash
   git add .
   git commit -m "fix: レビューで指摘された問題を修正"
   git push origin feature/your-feature-name
   ```
3. **Approve**: レビュアーが全て OK なら Approve

### ステップ6: マージ & デプロイ

1. **PR をマージ**: GitHub 上で **Merge pull request** をクリック
2. **ブランチ削除**: PR 画面から feature ブランチを削除
3. **ローカルでもクリーンアップ**:
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/your-feature-name
   ```

---

## 📋 チェックリスト

開発開始時：
- [ ] `git pull origin main` で最新コード取得
- [ ] `git checkout -b feature/...` で新規ブランチ作成
- [ ] 関連 Issue があれば記録

開発中：
- [ ] コミットメッセージに prefix を付ける
- [ ] 定期的に `git push` でリモート保存
- [ ] テスト実施（`npm run dev`, 手動確認）

PR 前：
- [ ] 최新の main とマージ競合がないか確認
- [ ] ESLint / TypeScript チェック: `npm run lint`
- [ ] ローカルでビルド成功: `npm run build`

PR 後：
- [ ] テンプレートに従って説明記入
- [ ] 該当 Issue をリンク (`Closes #123`)
- [ ] 関連 Issue や PR にコメント

マージ前：
- [ ] 全ての指摘が解決
- [ ] 最低1名のレビュー Approve
- [ ] CI/CD パイプライン（あれば）が成功

---

## 🔀 競合（Conflict）の対応

同じファイルを複数人が編集すると、マージ時に競合が発生します。

### 例：feature ブランチで競合が起きた場合

```bash
# main の最新を feature にマージしようとする
git fetch origin
git merge origin/main

# 競合ファイルが表示されます
# エディタで <<<<<<< HEAD ... ======= ... >>>>>>> origin/main を確認
# 手動で修正

# 修正後
git add <修正ファイル>
git commit -m "merge: main との競合を解決"
git push origin feature/your-feature-name
```

**ベストプラクティス**: feature ブランチが長く生きないように、**3～5日以内にマージ** することで競合を最小化。

---

## 📊 フェーズ別の主要ブランチ

### フェーズ1（デモ＆基本機能版）- 2026年2月～3月

実施済み/進行中の主要 feature ブランチ：

| ブランチ | 説明 | 優先度 | 状態 |
|---------|------|--------|------|
| `feature/supabase-setup` | DB・テーブル設計・RLS基本設定 | 🔴 高 | ✅ 完了 |
| `feature/user-auth` | ユーザー認証（メール+パスワード） | 🔴 高 | ✅ 完了 |
| `feature/profile-auto-init` | Session出し分け、ポータル導線、ログアウト導線 | 🔴 高 | ✅ 完了 |
| `feature/blog-page` | ブログ一覧・カード表示・ページネーション | 🔴 高 | ⏳ 次ステップ |
| `feature/polish-ui` | 雑誌掲載用 UI ブラッシュアップ | 🔴 高 | ⏳ 保留 |

### フェーズ2（本番版）- 2026年4月～9月

複数チーム並行により、複数の feature ブランチが同時並行で動作：
- フロントエンドチーム: `feature/search`, `feature/toc-generation`, etc.
- バックエンド/インフラ: `feature/oauth-integration`, `feature/image-upload`, etc.
- QA: テスト結果に基づく `feature/bugfix-*` ブランチ

---

## 💡 Tips & Best Practices

### ✅ 良い例
```bash
# わかりやすい、小ぶりな PRs
git checkout -b feature/add-blog-list-page
git checkout -b feature/fix-editor-preview-lag
git checkout -b feature/add-user-role-selector
```

### ❌ 避けるべき例
```bash
# 大きすぎる、複数機能が混在
git checkout -b feature/refactor-everything

# 何をしてるかわからない
git checkout -b feature/wip
git checkout -b feature/update

# メインブランチから直接 commit
git commit -m "..." # これは main をはうかけます（避ける！）
```

### 定期的なメンテナンス
マージ済み feature ブランチはリモートから削除：
```bash
# リモートのマージ済みブランチ一覧
git branch -r --merged origin/main

# 不要なブランチを削除
git push origin --delete feature/old-branch
```

---

## 📞 質問・困った時

- **競合が解決できない** → チームリードに相談
- **ブランチ戦略がわからない** → [GitHub Flow 公式ドキュメント](https://docs.github.com/ja/get-started/using-github/github-flow)
- **PR がなぜ拒否されたか** → レビュアーのコメントを確認、改善提案に従う

---

このガイドに従って、チーム開発をスムーズに進めましょう！🚀

