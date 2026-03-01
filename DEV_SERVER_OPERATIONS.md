# 🧰 開発サーバー運用手順（Windows / Next.js）

**対象**: MMA NextGen Wiki  
**更新日**: 2026-03-01

---

## 目的

- 開発サーバーの多重起動を防ぐ
- `lock` 残骸やポート競合で重くなる/起動できない問題を減らす
- 起動と停止を毎回同じ手順で安全に行う

---

## 基本ルール

1. `npm run dev` は **1つだけ** 起動する
2. 起動前に作業ディレクトリを必ず確認する
3. 終了時はターミナルを閉じる前に `Ctrl + C` で停止する

---

## 安全な起動手順（推奨）

PowerShell で以下を実行:

```powershell
Set-Location "c:\MMA\New-MMA-wiki-demo\mma-wiki-demo"
Get-Location
Test-Path package.json
npm run dev
```

確認ポイント:
- `Get-Location` が `...\mma-wiki-demo`
- `Test-Path package.json` が `True`

---

## 安全な停止手順（通常）

- 開発サーバーを起動しているターミナルで `Ctrl + C`
- `Terminate batch job (Y/N)?` が出た場合は `Y`

---

## 強制停止が必要なとき

### 1) Nodeプロセスを止める

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 2) Next.js の lock ファイルを消す

```powershell
Set-Location "c:\MMA\New-MMA-wiki-demo\mma-wiki-demo"
if (Test-Path ".next\dev\lock") { Remove-Item ".next\dev\lock" -Force }
```

### 3) 再起動する

```powershell
npm run dev
```

---

## よくあるトラブルと対処

### `ENOENT ... package.json`
- 原因: カレントディレクトリが違う
- 対処: `Set-Location` で `mma-wiki-demo` へ移動

### `Unable to acquire lock ... .next/dev/lock`
- 原因: 前回プロセスの残骸
- 対処: Node停止 + lock削除

### ポートが使用中で起動が不安定
- 原因: 多重起動
- 対処: Node全停止してから再起動

---

## 運用メモ（チーム向け）

- 開発開始時に `npm run dev` を連打しない
- VS Codeターミナルを複数開いている場合は、どのターミナルで起動したか明示する
- スクショ共有時はエラーメッセージの先頭3行（原因部分）を必ず残す

---

## チェックリスト

- [ ] 起動前に作業ディレクトリ確認
- [ ] 既存Nodeプロセスが不要なら停止
- [ ] lockが残っていない
- [ ] 停止時は `Ctrl + C` を使う
- [ ] 再起動は1ターミナルでのみ実施
