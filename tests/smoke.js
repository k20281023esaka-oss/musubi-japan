// サイト全体のかんたんな動作チェック（Playwright）
// 使い方:  npm install  →  npx playwright install chromium  →  npm test
// 公開版と同じく「AIなし」で動かす。エラーが1つでも出たら終了コード1。
const { chromium } = require('playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const ok = [], bad = [];
function check(name, cond, info) { (cond ? ok : bad).push(name + (info ? ' — ' + info : '')); }

(async () => {
  const browser = await chromium.launch();
  for (const lang of ['ja', 'en']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/google|gstatic/, r => r.abort()); // 外部に出ない
    await ctx.addInitScript(l => {
      if (window === top && !sessionStorage.getItem('t')) {
        localStorage.clear(); localStorage.setItem('cie-lang', l); sessionStorage.setItem('t', '1');
      }
    }, lang);
    const p = await ctx.newPage();
    const errors = []; p.on('pageerror', e => errors.push(e.message));
    const T = s => lang + ' ' + s;

    // 1. 診断（例の旅行者ですぐ結果）
    await p.goto(FILE + '#start'); await p.waitForTimeout(500);
    await p.click('[data-demo="0"]'); await p.waitForTimeout(1300);
    const c = await p.$('#dt-in [data-dtclose].btn'); if (c) await c.click();
    check(T('診断の結果でお店カードが出る'), (await p.$$('.sc')).length > 0);

    // 2. 地図
    await p.click('#bnav [data-nav="map"]'); await p.waitForTimeout(400);
    const pick = await p.$('[data-mplace="city"]'); if (pick) { await pick.click(); await p.waitForTimeout(500); }
    check(T('地図に一覧が出る'), (await p.$$('.mlist li')).length > 0);
    await p.click('[data-mday="1"]'); await p.waitForTimeout(400);
    check(T('地図の1日目が出る'), (await p.$$('.mday-box li')).length > 0);

    // 3. カメラ判定（文字で入れる）
    await p.click('#bnav [data-nav="scan"]'); await p.waitForTimeout(400);
    await p.fill('#scan-text', '砂糖、小麦粉、ショートニング、卵、洋酒、乳化剤');
    await p.click('#scan-textgo'); await p.waitForTimeout(300);
    const v = await p.$eval('.scan-res', e => e.className).catch(() => '');
    check(T('ムスリムで洋酒入りは✕になる'), /v-no/.test(v), v);

    // 4. 日程（AIなしの自動）
    await p.click('#bnav [data-nav="me"]'); await p.waitForTimeout(300);
    await p.click('[data-me="trip"]'); await p.waitForTimeout(300);
    await p.click('#trip-go'); await p.waitForTimeout(500);
    check(T('日程が2日分できる'), (await p.$$('.trip-day')).length === 2);

    check(T('JavaScriptのエラーがない'), errors.length === 0, errors.join(' / '));
    await ctx.close();
  }
  await browser.close();
  ok.forEach(s => console.log('OK  ' + s));
  bad.forEach(s => console.log('NG  ' + s));
  console.log(`\n${ok.length} OK / ${bad.length} NG`);
  process.exit(bad.length ? 1 : 0);
})();
