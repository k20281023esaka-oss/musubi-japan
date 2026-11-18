/* Musubi Japan：service worker（ホーム画面に追加したとき・電波が弱いときに使う）
   - サイトのファイルは「まずネットから、だめなら保存してある分」を出す（いつも新しい情報が出る）
   - 文字の書体（Google Fonts）は保存した分を先に使う
   - Googleマップやログインなど、ほかのサイトへの通信にはさわらない
   __VERSION__ は npm run build のときに自動で書きかわる（中身が変わると古い保存分が消える） */
var CACHE = "musubi-__VERSION__";
var CORE = [
  "./",
  "index.html",
  "worldmap.js",
  "firebase-config.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf("musubi-") === 0 && k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isFont(url) {
  return url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  /* 書体：保存した分を先に使う */
  if (isFont(url)) {
    e.respondWith(
      caches.open(CACHE).then(function (c) {
        return c.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) { c.put(req, res.clone()); return res; });
        });
      })
    );
    return;
  }

  /* ほかのサイト（地図・ログインなど）はそのまま */
  if (url.origin !== self.location.origin) return;

  /* サイトのファイル：まずネットから、だめなら保存した分 */
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        if (req.mode === "navigate") return caches.match("index.html");
        return Response.error();
      });
    })
  );
});
