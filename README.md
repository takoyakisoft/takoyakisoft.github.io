# ウェブツール集 (React + TypeScript + Vite 版)
https://takoyakisoft.github.io/takoyakisoft/

これは、日常的に使える便利なウェブツールを提供するアプリケーションです。
React, TypeScript, Vite を使用して構築されています。

## 主な機能

現在利用可能なツールは以下の通りです。

- **BMI計算機**: 体重と身長からBMI（体格指数）を計算します。
- **温度変換ツール**: 摂氏と華氏の温度を相互に変換します。

## 使用技術

- [Vite](https://vitejs.dev/) - 高速なフロントエンドビルドツール
- [React](https://reactjs.org/) - UI構築のためのJavaScriptライブラリ
- [TypeScript](https://www.typescriptlang.org/) - JavaScriptに静的型付けを追加
- [React Router DOM](https://reactrouter.com/) - Reactアプリケーションのためのルーティング

## セットアップと実行方法

1.  **リポジトリをクローンします (もしクローンしていない場合):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **依存関係をインストールします:**
    ```bash
    bun install
    ```
    もし `typescript` や `tsc` に関するエラーが出る場合は、`bun install` を再度実行するか、グローバルに `typescript` がインストールされているか確認してください。

3.  **開発サーバーを起動します:**
    ```bash
    bun run dev
    ```
    開発サーバーが起動し、通常は `http://localhost:5173` (または利用可能なポート) でアプリケーションにアクセスできます。

## ビルド方法

プロダクション用にアプリケーションをビルドするには、以下のコマンドを実行します:

```bash
bun run build
```

このコマンドは `tsc -b && vite build` を実行し、TypeScriptの型チェックとViteによるビルドを行います。
(注意: 環境によっては `package.json` の build スクリプトを `./node_modules/.bin/tsc -b && vite build` のようにローカルのtscを明示的に指す必要がある場合があります。)

## 成果物

ビルドされた静的ファイルは、プロジェクトルートの `dist` ディレクトリに出力されます。
この `dist` ディレクトリの内容をウェブサーバーにデプロイすることで、アプリケーションを公開できます。

## 今後の展望 (例)

- さらに多くの便利なツールを追加
- ユニットテスト/E2Eテストの拡充
- PWA対応
- デザインのさらなる洗練

---
&copy; {new Date().getFullYear()} ウェブツール集
