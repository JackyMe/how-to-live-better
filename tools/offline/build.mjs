// 把 index.html + README + book/*.md 打成一个自包含的 HTML：双击就能看，不用服务器、不用联网。
// 用法：node tools/offline/build.mjs [输出路径]   默认输出 dist/HowToLiveBetter.html
// 正文内联进 window.__CORPUS__，index.html 的 init() 认这个变量就不再发请求；
// 正文内联，保留页面内置的 SVG 和样式。
import '../companions/build.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { ROOT, REPO, SITE, read, gitCommit, buildStamp } from '../lib/book.mjs';

const OUT = resolve(ROOT, process.argv[2] ?? 'dist/HowToLiveBetter.html');
const STAMP = buildStamp();
const COMMIT = gitCommit();

// ---------- 正文 ----------
const readme = read('CONTENT.md');
const files = [...new Set([...readme.matchAll(/\]\((book\/[^)]+\.md)\)/g)].map(m => m[1]))].sort();
if (!files.length) throw new Error('README 目录里没找到 book/ 文件，离线版会是空的');
const corpus = { readme, parts: Object.fromEntries(files.map(f => [f, read(f)])) };
// </script 会提前关掉脚本标签；\/ 在 JS 字符串里就是 /，内容不变
const corpusJson = JSON.stringify(corpus).replace(/<\/script/gi, '<\\/script');

// ---------- 页面 ----------
let html = read('index.html');
const must = (needle, label) => {
  if (!html.includes(needle)) throw new Error(`index.html 里找不到${label}，离线版脚本要跟着改：${needle}`);
};

// 相对链接在本地打开时是死的，改成线上地址
must('href="README.md"', ' README.md 链接');
must('href="book/"', ' book/ 链接');
html = html
  .replaceAll('href="README.md"', `href="${REPO}/blob/main/README.md"`)
  .replaceAll('href="book/"', `href="${REPO}/tree/main/book"`)
  .replaceAll('<a class="title" href="./"', `<a class="title" href="${SITE}"`);

// 本版视觉由内联 SVG/CSS 构成，无远程字体或图片依赖。

// 页脚注明这是哪一版的离线副本
const foot = '<div class="foot">';
must(foot, '页脚');
const commitNote = COMMIT ? `，正文提交 ${COMMIT.slice(0, 7)}` : '';
html = html.replace(foot, `${foot}离线副本，生成于 ${STAMP}（北京时间）${commitNote}；正文会继续更新，以 <a href="${SITE}">项目主页</a> 为准。<br>`);

// 正文要在主脚本之前就位
const mainScript = '\n<script>\n/* ---------- 调试面板';
must(mainScript, '主脚本的开头');
html = html.replace(mainScript, `\n<script>window.__CORPUS__=${corpusJson}</script>${mainScript}`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
const kb = n => (n / 1024 | 0) + ' KB';
console.log(`已生成 ${OUT}：${files.length} 个正文文件，${kb(Buffer.byteLength(html))}（其中正文 ${kb(Buffer.byteLength(corpusJson))}）`);
