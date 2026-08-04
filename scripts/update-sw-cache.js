// ビルドのたびにService WorkerのCACHE_NAMEを自動で更新するスクリプト。
// 手動でバージョン文字列を上げ忘れると、既に開いたことのある端末に
// 古いアプリシェルがキャッシュされたまま残ってしまうため（`npm run build`前に
// `prebuild`として自動実行される）。

const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "..", "public", "sw.js");
const buildId = Date.now().toString(36);

const content = fs.readFileSync(swPath, "utf-8");
const updated = content.replace(
  /const CACHE_NAME = "our-session-shell-[^"]*";/,
  `const CACHE_NAME = "our-session-shell-${buildId}";`
);

if (content === updated) {
  console.warn("[update-sw-cache] CACHE_NAME の置換パターンが見つかりませんでした。public/sw.js を確認してください。");
  process.exit(1);
}

fs.writeFileSync(swPath, updated, "utf-8");
console.log(`[update-sw-cache] CACHE_NAME を our-session-shell-${buildId} に更新しました`);
