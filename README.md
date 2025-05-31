# Webツール集 (Static HTML Version)

これは、便利なウェブツールを提供する静的HTMLベースのウェブサイトです。GitHub Pagesでのホスティングを念頭に置いて作成されています。

## 現在利用可能なツール

-   **[BMI計算機](tools/bmi_calculator.html)**: 体重と身長からBMI（ボディマス指数）を計算します。

## 特徴

-   モダンでシンプルなデザイン
-   HTML, CSS, JavaScriptのみで構築 (サーバーサイド処理なし)
-   日本語インターフェース
-   簡単に追加可能なツールフレームワーク

## ローカルでの実行方法

1.  このリポジトリをクローンまたはダウンロードします。
2.  ルートディレクトリにある `index.html` ファイルを直接お好みのウェブブラウザで開いてください。
    -   例: `file:///path/to/repository/index.html`

特別なビルドプロセスや依存関係のインストールは不要です。

## 新しいツールの追加方法

1.  **HTMLファイルの作成**:
    -   新しいツールのためのHTMLファイルを作成し、`tools/` ディレクトリに配置します。
    -   例: `tools/my_new_tool.html`
    -   このHTMLファイルには、ツールのユーザーインターフェース全体を記述します。
    -   CSSは、メインの `css/style.css` を利用するか、ツール固有のスタイルをHTMLファイル内に `<style>` タグで記述、または `css/` ディレクトリに専用CSSファイルを作成してリンクします。

2.  **JavaScriptロジックの作成 (必要な場合)**:
    -   ツールがクライアントサイドでの動的な処理を必要とする場合は、`js/` ディレクトリに専用のJavaScriptファイルを作成します。
    -   例: `js/my_new_tool.js`
    -   作成したツールのHTMLファイルから、このJavaScriptファイルを `<script src="../js/my_new_tool.js"></script>` のように相対パスで読み込みます。

3.  **トップページへのリンク追加**:
    -   作成した新しいツールへのリンクを、ルートの `index.html` ファイル内にある `<ul id="tool-list">` のリストに手動で追加します。
    -   例: `<li><a href="tools/my_new_tool.html">新しいツールの名前</a></li>`

## JavaScriptテスト (BMI計算機)

BMI計算機 (`js/bmi_calculator.js`) には、基本的なテスト関数が含まれています。テストを実行するには:

1.  `tools/bmi_calculator.html` をブラウザで開きます。
2.  ブラウザの開発者コンソールを開きます。
3.  コンソールで `runBmiTests()` と入力して実行します。
    -   テストのPASS/FAILがコンソールに出力されます。
    -   このテストは、`calculateBmiValue` 関数と `getBmiCategory` 関数の基本的な動作を確認するためのものです。

## 今後の展望

-   さらに多くの便利なツールを追加。
-   PWA (Progressive Web App) 対応。
-   アクセシビリティの向上。

## コントリビューション

バグ報告や新しいツールの提案は、Issueを通じてお願いします。プルリクエストも歓迎します。
