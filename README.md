# 日本地図クイズ

[![Deploy to GitHub Pages](https://github.com/ma38su/japan-map-quiz/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ma38su/japan-map-quiz/actions/workflows/deploy-pages.yml)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-%E3%81%82%E3%81%9D%E3%81%B6-2ea44f?logo=github)](https://ma38su.github.io/japan-map-quiz/)
[![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232a)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

公開ページ: [https://ma38su.github.io/japan-map-quiz/](https://ma38su.github.io/japan-map-quiz/)

世界地図クイズから独立して開発する、都道府県学習用のWebアプリです。このディレクトリ単体で別リポジトリへ移動できます。

## 現在の範囲

- 都道府県名と場所（地図→名前／名前→地図／ミックス）
- 小学生向け：小学校の社会科で学ぶ範囲として、47都道府県すべての名前と場所を出題。選択肢は離れた地方を中心に構成
- 中学生向け：同じく47都道府県すべてを出題。同じ地方・近隣県を選択肢に優先し、位置をより厳密に見分ける構成
- 1回10問、同じ都道府県は重複出題しない
- スコアと苦手な都道府県を端末内に保存

## 県庁所在地

県庁所在地は都道府県問題へ混在させず、将来 `capital` カテゴリとして別に実装します。

## 起動

```sh
npm install
npm run dev -- --host 0.0.0.0
```

都道府県境は国土数値情報を加工した `open-data-jp-prefectures-geojson`（MIT License）を利用します。
