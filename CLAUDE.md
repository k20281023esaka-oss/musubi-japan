# Musubi Japan — Claude Code 用メモ

「あなたの決まりと、日本の旅を結ぶ」。宗教や食の決まり（ハラール、ヴィーガン、コーシャなど）がある旅行者が、姫路と浅草で食べられるお店・料理・観光地を探せるWebサイト。

- 作っている人：佼成学園高等学校2年 榎阪 悠（ひとりで開発）
- 応募するコンテスト：ひめじ観光ビジネスコンテスト（締め切り 2026/11/30）。地方創生☆政策アイデアコンテスト2026 は 11/16 に締め切り済み。
- **返事・説明・画面の文言は日本語で。** 中学生でも分かる、やさしい言葉にする。

## まず知っておくこと

- **サイトは `index.html` 1ファイル。** HTML・CSS・JavaScript・データが全部この中にある（約4,300行、約1.4MB）。フレームワークもビルドもない。
- JavaScript は全体が1つの即時関数の中。**`var` と `function` で書く（ES5 風）。** アロー関数・`let`・`class` は使っていないので合わせる。
- 写真は `img/*.jpg` と `himeji.jpg`。公開用には `npm run build` で写真を埋めこんだ `dist/index.html` を作る。
- `worldmap.js`（世界地図の形）と `firebase-config.js`（Googleログイン設定）は別ファイルのまま置く。
- 変更したら **`npm test`** で動作チェック（Playwright）。12項目すべて OK を確認してから終わる。

## ファイル

| ファイル | 中身 |
| --- | --- |
| `index.html` | サイト本体（ここを直す） |
| `img/`、`himeji.jpg` | 写真。名前は撮影リストの番号（`shop-02.jpg` など） |
| `worldmap.js` | 「お店・学校の方へ」ページの世界地図データ |
| `firebase-config.js` | Googleログインの設定。空なら「準備中」表示で、ほかは全部動く |
| `Googleログインの設定方法.txt` | Firebase の設定手順（先生・保護者のアカウントで作る） |
| `himeji-places.csv` | Googleマイマップに読みこめる場所の一覧 |
| `tools/embed_photos.py` | 写真入りの `dist/` を作る（PWA のファイルもコピー、`sw.js` の版を自動で入れる） |
| `manifest.webmanifest`、`icons/` | ホーム画面に追加（PWA）の設定とアイコン（藍地に朱の判子「結」） |
| `sw.js` | service worker。サイトのファイルは「ネット優先、だめなら保存分」。書体は保存分優先。ほかのサイト（地図・ログイン）にはさわらない |
| `.github/workflows/pages.yml` | main に push → `npm test` → build → GitHub Pages に公開 |
| `公開のしかた.txt` | GitHub Pages で公開する手順（本人向け） |
| `tests/smoke.js` | 動作チェック |

## 動かし方

```bash
npm install
npx playwright install chromium
npm run serve      # http://localhost:8000 で確認（Googleマップの埋めこみはサーバーで開いたときだけ出る）
npm test           # 動作チェック
npm run build      # 公開用 dist/ を作る
```

## 画面のしくみ

- **下のメニュー（`#bnav`）**：ホーム ｜ 食べる ｜ 📷カメラ判定（真ん中の丸ボタン）｜ 地図 ｜ マイページ。切りかえは `navGo(k)`、選択状態は `syncNav()`。
- **場面（phase）**：`home` → `quiz`（診断）→ `result`。`showPhase(ph)` で切りかえ。
- **result の中のタブ（`tab`）**：`eat`（食べる）・`scan`（撮って判定）・`trip`（日程）・`plan`（1日の予定）・`map`・`me`（マイページ）・`cafe`・`see`（観光・体験）・`inaka`（田舎）・`buy`・`guide`・`tell`・`feed`（みんなの声。今は非表示 `FEED_ON=false`）。描画は `render()` の中の `if(tab==="...")`。
- **診断は1つだけ**（2026/11/18 に統一）：「食べる」「1日の流れ」なども、診断前なら同じ診断（`drawQ`）へ進む。診断前の「食べる」タブは `eatStartHTML`（診断へのボタン）だけ。地図・カメラ判定・マイページは診断前でも見られる（`peekRes=true` で `showPhase("result")`。`done` は true にしない）。古い `relFirstHTML` / `cityFirstHTML` は今は使っていない。
- **診断の質問の順番**：誰と → 街（姫路／浅草、`data-qcity`）→ 食事 → 予算 → 宗教 → 宗教ごとの質問 → 入るかもしれない食材 → 生もの → アレルギー（自由記述あり）→ お店の種類 → 好き → 苦手（自由記述あり）→ ほかに探すもの → 確認。
- **自由記述**：`freeRead` が `LBL` 辞書（`scanMatch`）で食材を見つける。AIは使わない。アレルギーで見つかった食材は `S.allergyX`（✕）、苦手は `S.dislikeX`（△）になる。分からない言葉は `S.allergyTxt` / `S.dislikeTxt` のまま、お店に見せる文（`dietText`）に入る。
- **1日の流れ（`tab="plan"`）の入口**：ホームの横長ボタン（`data-qa="plan"`）と、診断のあとの「食べる」の上のバナー（`planBannerHTML`）。

## データ（すべて index.html の中）

| 変数 | 中身 |
| --- | --- |
| `RELIGIONS` | 宗教・食の決まり10種類。`a` が避ける材料のキー |
| `ING` / `ING_ORDER` | 材料のキーと名前（pork, beef, alcohol, dashi, gelatin, allium など） |
| `MAPS.himeji` / `MAPS.asakusa` | 地図の点。`k:"rest"` お店、`"land"` 観光地、`"pray"` 礼拝室、`"info"` 案内所、`"item"` 料理 |
| `SIGHTS` | 姫路の観光地（`area`: castle / station / shosha / far） |
| `RURAL` / `RURAL_AREAS` | 田舎（家島・夢前・香寺・安富） |
| `cafeWA()` / `cafeCF()`、`ASA_WA` / `ASA_CF` | 和菓子とカフェ（姫路／浅草） |
| `CLOSED` | お店の定休日 `{店名:{d:[曜日]}}`（0=日曜） |
| `VERIFY` | 信頼度（だれがいつ確認したか）。半年たつと「古い」表示 |
| `LBL` | カメラ判定の辞書（原材料ラベルの言葉 → 材料キー）。`?` 付きは「かも」 |
| `DEMOS` | 「例の旅行者ですぐ結果」の答え |
| `CITIES`、`place` | 今の街（`"himeji"` / `"asakusa"`）。切りかえは `setCity(c)` |

## 判定のしくみ

- `judge(item, av, kind)` → `{s:"ok"|"ask"|"no", why}`。`av` はその人が避ける材料（`avoidSet` で診断の答え `S` から作る）。
- お店は `restStatus(r)`、ランキングは `topRests(P)`。定休日は `closedNote(r)`。
- 印と色は `PINM`（○△✕）と `PINC`（緑・黄・赤）。
- **「ok」と言い切らない方へ寄せる。** 分からないものは「ask（お店で確認）」にする。

## 主な機能と関数

- **お店カード**：`restCard`。食べるの条件パネル：`eatCtl`（決まり・街・検索）。
- **地図**：`mapHTML`。Claudeのページでは絵の地図（番号付きの印）、公開版（`CAN_EMBED`）では Googleマップの埋めこみ。下に「日程」の 1日目・2日目 切りかえ（`mapDay`）と一覧。
- **1日の流れ**：`courseHTML`（朝・昼・おやつ・夜のごはん＋観光地）。
- **日程（何日か）**：`tripHTML` / `bindTrip`。AIがあれば `tripAI`、なければ `tripAuto`。AIの答えはサイトのデータにある名前だけ使う（ないものは消す）。保存は `localStorage["musubi-trip"]`。
- **カメラ判定**：`scanHTML` / `bindScan`。AIは原材料の文字を書き写すだけで、判定は `scanMatch`（`LBL` 辞書）＋ `judge` でサイト側がする。AIなしでは文字入力で判定。
- **マイページ**：アイコン（`musubi-avatar`）、保存したお店（`musubi-fav`）、スタンプ（`musubi-stamps`）、追加オプション（課金の枠だけ）、アカウント（Googleログイン）。

## AIについて（大事）

- AI（日程・カメラ判定・質問）は **Claude のページの中でだけ動く**（`window.claude.use("sample")` → `sampleRef`）。公開版では `sampleRef` が `null` になり、自動の代わりの動きになる。
- 公開版で AI を使うなら、**APIキーは絶対に index.html に書かない。** Cloudflare Workers などに小さなサーバーを作り、キーはそこだけに置く。回数制限も入れる。まだ作っていない。

## 言葉（5か国語：ja / en / id / zh / hi）

- 画面の文字は日本語で書き、`_("日本語")` で囲む。`LANG` に合わせて訳が出る。データの日本語名に戻すのは `JA(x)`。
- **新しい文言を足すとき**は、`TRD.hi={` の行の直前に次の形のブロックを足し、ヒンディー語は `TRD.hi` の JSON にも足す：
  ```js
  (function(){var add={"日本語":["English","Indonesia","中文"]};
  for(var k in add){EN[k]=add[k][0];TRD.id[k]=add[k][1];TRD.zh[k]=add[k][2];DICT[k]=LANG==="id"?add[k][1]:LANG==="zh"?add[k][2]:add[k][0];}})();
  ```
- 後から入れたHTMLは `i18nDom(el)` で訳す。ラベルの原文など訳したくない所は `lang="ja"` を付ける。

## デザイン「和の遊び心」

- 色は `:root` のトークン（`--accent` 朱色、`--ai` 藍色、`--bg` 生成り、`--ok/--ask/--no`）。ダークモードも同じトークンで定義済み。**色を直に書かずトークンを使う。**
- 見出しの書体は `--f-wa`（Dela Gothic One）。藍のヘッダーとギザギザの縁、判子風のロゴ、のれん。
- スマホ幅（390px）を基準に確認。下のメニューのカメラボタンはバーから上に出ているので、画面下に固定するものはその分あける。

## 気をつけること

- お店の情報は高校生が調べたもので、多くが「未確認」。**確かめていないことを「確認済み」「ハラール」と書かない。**
- 監修は宗教団体にお願い中（東京ジャーミイは協力OK、日程調整中）。監修が終わったら `VERIFY` に記録する。
- 写真は自分で撮ったか、お店に許可をもらったものだけ。ネットの写真は使わない。
- 個人のメールアドレスなどをコードに書かない。
- 運営画面（admin）は作らない方針（本人の希望）。

## これからやりたいこと

1. ~~GitHub Pages で公開する~~ → 2026/11/18 公開済み：https://k20281023esaka-oss.github.io/musubi-japan/ 。本人はブラウザの「Upload files」でファイルを上げている。この方法では「.」で始まるファイル（`.github` など）は上がらないので、`.github/workflows/pages.yml` を直すときは GitHub の画面で直接編集してもらう。**作業フォルダはデスクトップの `musubi-japan-最新`**（ダウンロードの `musubi-japan` は 11/17 の古い版なので使わない）
2. ~~ホーム画面に追加できるようにする（PWA）~~ → できた。service worker の登録は公開版だけ（Claudeのページと file:// ではしない）
3. 写真を増やす（撮影リストの番号のファイル名で `img/` に入れる）
4. 宗教団体のヒアリング結果で判定と説明を直し、`VERIFY` に記録する
5. 公開版でも AI を使うためのサーバー（Cloudflare Workers）※先生と相談してから
6. お店向けの「対応できますシート」とQRコード、自治体向けの集計
