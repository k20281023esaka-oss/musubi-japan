# Musubi Japan

宗教や食の決まりがある旅行者が、姫路と浅草で食べられるお店・料理・観光地を探せるWebサイトです。

- サイト本体：`index.html`（これ1つで動きます）
- 開発のメモ：`CLAUDE.md`（Claude Code が最初に読みます）
- 公開のしかた：`公開のしかた.txt`（GitHub Pages。push すると自動で公開）
- スマホの「ホーム画面に追加」でアプリのように使えます（PWA）

```bash
npm install
npx playwright install chromium
npm run serve   # http://localhost:8000
npm test        # 動作チェック
npm run build   # 写真入りの公開用 dist/ を作る（python3 だけで動きます）
```
