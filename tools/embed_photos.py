"""写真を index.html の中に埋めこんだ公開用フォルダ dist/ を作る。
使い方:  python3 tools/embed_photos.py
- index.html の中の "img/xxx.jpg" と "himeji.jpg" を data: URI に置きかえる
- worldmap.js と firebase-config.js は dist/ にコピーする（この2つは別ファイルのまま）
- ホーム画面に追加（PWA）用の manifest.webmanifest・sw.js・icons/ もコピーする
  sw.js の __VERSION__ は中身から作った番号に書きかえる（中身が変わるとスマホの保存分も新しくなる）
- GitHub Pages 用に .nojekyll も置く
"""
import base64, hashlib, os, re, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
src = open(os.path.join(ROOT, "index.html"), encoding="utf8").read()
def emb(m):
    p = os.path.join(ROOT, m.group(1))
    if not os.path.exists(p):
        print("見つからない写真:", m.group(1)); return m.group(1)
    return "data:image/jpeg;base64," + base64.b64encode(open(p, "rb").read()).decode()
out = re.sub(r'(?<=["\'(])(img/[\w\-.]+\.jpg|himeji\.jpg)(?=["\')])', emb, src)

if os.path.isdir(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST)
open(os.path.join(DIST, "index.html"), "w", encoding="utf8").write(out)

ver = hashlib.sha1(out.encode())
for f in ("worldmap.js", "firebase-config.js", "manifest.webmanifest"):
    shutil.copy(os.path.join(ROOT, f), os.path.join(DIST, f))
    ver.update(open(os.path.join(ROOT, f), "rb").read())
shutil.copytree(os.path.join(ROOT, "icons"), os.path.join(DIST, "icons"))
ver = ver.hexdigest()[:10]
sw = open(os.path.join(ROOT, "sw.js"), encoding="utf8").read().replace("__VERSION__", ver)
open(os.path.join(DIST, "sw.js"), "w", encoding="utf8").write(sw)
open(os.path.join(DIST, ".nojekyll"), "w").close()

print("dist/ を作りました（index.html %d KB、版 %s）" % (len(out.encode()) // 1024, ver))
