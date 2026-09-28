// 交叉引用对照表：把正文里每一处「第 X 条」引用解析成它实际指向的条目标题，
// 写进 docs/引用对照.md。那份文件入库，所以插入或删除条目导致引用指向变化时，
// git diff 会直接把变化摆出来——条号没动而标题变了，就是错位。
//
//   node tools/check-refs.mjs            # 重新生成对照表（sync-stats.ps1 末尾会自动调用）
//   node tools/check-refs.mjs --check    # 只校验不写文件，有失效引用则退出码 1（CI 用）
//   node tools/check-refs.mjs --suspect  # 额外列出措辞和目标标题对不上的，误报多，排查历史遗留时用
//
// 为什么需要它：条号是位置依赖的，正文里的引用只记了位置不记内容。2026-09-19
// 在第 7 节发现 6 处指错（医疗救助指到低保、救助站指错条），全都在条号范围内，
// 越界检查一条都抓不到。
// 注意：切行一律用 /\r?\n/，不能用 '\n'。book/ 下的文件行尾不统一（有 CRLF 有 LF），
// 而 JS 正则的 . 不匹配 \r（CR 也算行终止符，这点和 Python、Perl 不一样），
// 留着 \r 会让 /^### (\d+)\. (.*)$/ 在 CRLF 文件上一条都匹配不到。
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');

// 节内的裸引用（「见第 8 条」）只在这几个栏位里找：来源栏里的「第 N 条」几乎都是
// 法条条款号，扫进来全是误报。
const FIELDS = /^- (说人话|收益|备注|成本)：/;
// 但带节号的跨节引用（「见第 11 节第 16 条」）不会和法条混淆，来源栏里也有，一并扫。
// book/26 第 103 条那处「日志留存见第 11 节第 16 条」就写在来源栏里，差点漏掉。
const CROSS_FIELDS = /^- (说人话|收益|备注|成本|来源)：/;

const files = readdirSync(resolve(ROOT, 'book')).filter(f => /^\d\d-.*\.md$/.test(f)).sort();

// 先把每节的条目标题读出来：sections[节号] = { file, titles: { 条号: 标题 } }
const sections = new Map();
for (const f of files) {
  const num = Number(f.slice(0, 2));
  const titles = new Map();
  for (const line of readFileSync(resolve(ROOT, 'book', f), 'utf8').split(/\r?\n/)) {
    const m = /^### (\d+)\. (.*)$/.exec(line);
    if (m) titles.set(Number(m[1]), m[2].trim());
  }
  sections.set(num, { file: f, titles });
}

// 一处引用可能写成「第 3、10、11 条」，拆成多个条号
const nums = s => s.split(/[、,]/).map(x => Number(x.trim())).filter(n => Number.isFinite(n));

const out = [];
const problems = [];
const suspects = [];
const weak = [];
let total = 0;

for (const f of files) {
  const num = Number(f.slice(0, 2));
  const self = sections.get(num);
  const lines = readFileSync(resolve(ROOT, 'book', f), 'utf8').split(/\r?\n/);
  const rows = [];
  let cur = 0;

  // 引用前面那句话往往就写着它想指什么（「医疗救助（见第 11 条）」），把整个分句
  // 列出来，人工扫对照表时不用翻正文就能判断指对没有。
  // 取到最近的句读为界而不是固定字数——固定 14 字曾让好几处正确引用看起来可疑
  // （「一氧化碳见第 18 条，烧烫伤见第 13 条」截断后只剩「氧化碳」对着「烫伤」）。
  const ctxOf = (line, idx) => {
    const before = line.slice(0, idx);
    let start = -1;
    for (const p of ['。', '；', '！', '？', '：']) start = Math.max(start, before.lastIndexOf(p));
    return before.slice(start + 1).slice(-44).replace(/\|/g, '｜');
  };
  // 验锚点时用的窗口比上面这个窄：只取引用所在的那个逗号分句。整句那么宽的窗口里
  // 「自己」「公司」这类常见词很容易和别的条目标题偶然重合，锚点就成了假的——
  // 2026-09-20 第 31 节插条目，第 1 条备注里「……的贷款见本节第 15 条」被顺延撞到
  // 新条目「在家给境外公司远程干活……个税自己报」上，整句窗口里两个逗号之外的
  // 「你自己还」撞上标题里的「个税自己报」，--check 报了通过。
  // 分句太短时（「……，见第 11 条」这种，窗口只剩一个「见」字）往前再退一个分句，
  // 否则会把本来正确的引用误判成裸条号。
  // 顿号和引号、括号都不算分句边界：「含糖饮料、加工肉（本节第 3 条）」的锚点隔着顿号，
  // 「为『比别人强一档』而加的预算见本节第 24 条」的锚点在引号里，切了都会误伤。
  const CLAUSE = ['。', '；', '！', '？', '：', '，'];
  const narrowOf = (line, idx) => {
    const before = line.slice(0, idx);
    const cut = s => {
      let start = -1;
      for (const p of CLAUSE) start = Math.max(start, s.lastIndexOf(p));
      return { head: s.slice(0, start + 1), tail: s.slice(start + 1) };
    };
    const last = cut(before);
    if (last.tail.replace(/[见按同和依据参照的在]/g, '').length >= 4) return last.tail.slice(-24);
    return (cut(last.head.slice(0, -1)).tail + last.tail).slice(-24);
  };
  // 引用后面的文字也算锚点：「第 16 条（借条和担保）」这种把关键词写在条号之后
  // 取到引用后的第一个句读为止（最多 40 字）。不能用固定字符数：「见第 1 节第 7、8、
  // 14、17、18、19、23、24、29 条（血压、血糖…）」这种长条号串会把标注挤出窗口。
  const afterOf = (line, idx) => {
    const rest = line.slice(idx).replace(/^第\s*\d+\s*节?第?\s*[\d、,\s]*\s*条/, '');
    const end = rest.search(/[。；！？]/);
    return (end === -1 ? rest : rest.slice(0, end)).slice(0, 40).replace(/\|/g, '｜');
  };

  lines.forEach((line, i) => {
    const t = /^### (\d+)\./.exec(line);
    if (t) { cur = Number(t[1]); return; }
    if (!CROSS_FIELDS.test(line)) return;

    // 相对指路（「见下一条」「罚则见上一条」）一律禁掉：它不带条号，插入条目时跟着
    // 整体平移，撞歪了对照表的 diff 也看不出来，--check 的裸条号检查更是扫不到它。
    // 2026-09-20 一次扫描就查出三处早就指错的：HPV 疫苗条的「见下一条」指到了乳腺癌
    // 筛查（该指宫颈癌筛查），扬言条的「罚则见上一条」指到了念头条，失业登记条的
    // 「上一条不签主动辞职」指到了存证据条。排除「最后一条」「之后一条腿」这类误命中。
    for (const m of line.matchAll(/(?<![最之以])(上一条|下一条|前一条|后一条|上面那条|上面这条|前面那条)/g)) {
      problems.push(`${f}:${i + 1} 第 ${cur} 条用了相对指路「${m[1]}」——改成「第 N 条（锚点词）」`);
    }

    // 跨节：第 N 节第 X 条
    for (const m of line.matchAll(/第\s*(\d+)\s*节第\s*([\d、,\s]+?)\s*条/g)) {
      const target = sections.get(Number(m[1]));
      for (const x of nums(m[2])) {
        const title = target?.titles.get(x);
        rows.push({ from: cur, ref: `第 ${m[1]} 节第 ${x} 条`, title, line: i + 1, ctx: ctxOf(line, m.index), narrow: narrowOf(line, m.index), after: afterOf(line, m.index) });
        if (!title) problems.push(`${f}:${i + 1} 第 ${cur} 条引用「第 ${m[1]} 节第 ${x} 条」——该节没有这一条`);
      }
    }

    // 节内：扫所有「第 X 条」，不限引导词——正文里的写法远不止「见第 X 条」，还有
    // 「按第 1 条压胸」「判断方法同第 4 条」「先对照第 8 条」「和第 4 条二选一」，
    // 早先只认三种引导词，这些全漏在扫描之外。来源栏整行不扫（全是法条条款号）。
    if (!FIELDS.test(line)) return;
    const stripped = line.replace(/第\s*\d+\s*节第\s*[\d、,\s]+?\s*条/g, '');
    for (const m of stripped.matchAll(/第\s*([\d、,\s]+?)\s*条/g)) {
      // 前面十几个字里出现法规名或文号的，是法条条款号不是条目引用，跳过
      const pre = stripped.slice(Math.max(0, m.index - 16), m.index);
      if (/法|条例|办法|规定|准则|解释|细则|号〕|〕|号，|公约|宪法/.test(pre)) continue;
      for (const x of nums(m[1])) {
        const title = self.titles.get(x);
        rows.push({ from: cur, ref: `本节第 ${x} 条`, title, line: i + 1, ctx: ctxOf(stripped, m.index), narrow: narrowOf(stripped, m.index), after: afterOf(stripped, m.index) });
        // 节内引用超出本节条目数的，多半是法条条款号被误当成条目引用，列出来人工看
        if (!title) problems.push(`${f}:${i + 1} 第 ${cur} 条引用「第 ${x} 条」——本节只有 ${self.titles.size} 条（可能是法条条款号）`);
        if (x === cur) problems.push(`${f}:${i + 1} 第 ${cur} 条引用了它自己`);
      }
    }
  });

  // 能不能自动验证这处引用指对了：引用前后的文字里，有没有一段字也出现在目标条目
  // 标题里。有 → 这处引用自带锚点，改动导致错位时会被察觉；没有 → 它是个裸条号
  // （「实际算法可以看第 34 条」），错了也看不出来，需要补一个显式标注。
  // 两个汉字的重合太容易偶然发生（「自己」「公司」「时间」），所以按长度和距离分级：
  // 整句里连着三个汉字对上（「含糖饮料」「居民医保」）算实锚点；只有两个汉字对上时，
  // 要求它落在引用所在的分句里才算——隔着两个逗号的「你自己还」撞上标题里的
  // 「个税自己报」，就是 2026-09-20 那处漂移蒙过检查的原因。
  const longest = (text, title) => {
    let best = 0;
    for (let i = 0; i < text.length; i++) {
      for (let n = 1; i + n <= text.length; n++) {
        const seg = text.slice(i, i + n);
        if (!/^[一-龥]+$/.test(seg)) break;
        if (!title.includes(seg)) break;
        best = Math.max(best, n);
      }
    }
    return best;
  };
  // 数字和英文串也是锚点：12356、AED、CT、BMI、LPR 这些常常就是引用要指的东西
  const token = (text, title) => (text.match(/[0-9A-Za-z]{2,}/g) ?? []).some(t => title.includes(t));
  for (const r of rows) {
    if (!r.title) continue;
    const wide = r.ctx + r.after;
    if (token(wide, r.title) || longest(wide, r.title) >= 3) continue;
    if (longest(r.narrow + r.after, r.title) >= 2) continue;
    // 只在分句之外撞上两个字的，按弱锚点单独列：修法和裸条号一样是补显式标注。
    const list = longest(wide, r.title) >= 2 ? weak : suspects;
    list.push(`${f}:${r.line} 第 ${r.from} 条 →「${r.ref}」${r.title.slice(0, 20)}…　…${r.ctx}【${r.ref}】${r.after}…`);
  }

  if (!rows.length) continue;
  total += rows.length;
  out.push(`## ${basename(f, '.md')}\n`);
  out.push('| 出处 | 引用 | 指向的条目 | 引用处的上下文 |');
  out.push('| --- | --- | --- | --- |');
  for (const r of rows) {
    const title = r.title ? r.title : '**指向不存在的条目**';
    out.push(`| 第 ${r.from} 条 | ${r.ref} | ${title} | …${r.ctx}… |`);
  }
  out.push('');
}

const body = [
  '# 交叉引用对照表',
  '',
  '本文件由 `node tools/check-refs.mjs` 生成，不要手改。',
  '',
  '正文里的「第 X 条」只记条号不记内容，插入或删除条目会让后面的引用集体错位，',
  '而错位后的条号往往仍在范围内，光查越界抓不到。所以把每处引用**实际指向的标题**',
  '摊开写在这里并入库：改完条目重新生成，`git diff` 里凡是条号没动而标题变了的，',
  '就是被顺延撞歪的引用。',
  '',
  '另一道保险是**锚点**：每处引用的前后文里都得有一个词和目标条目标题对得上',
  '（「医疗救助见第 11 条」里的「医疗救助」，或显式写成「见第 16 条（借条和担保）」）。',
  '`node tools/check-refs.mjs --check` 会把没有锚点的裸条号判为失败——那种引用一旦',
  '被撞歪，对照表的 diff 也看不出异常，只能靠锚点兜住。',
  '',
  '锚点算不算数按长度和距离判：整句里连着三个汉字和标题对上（「含糖饮料」「居民医保」），',
  '或者引用所在的那个逗号分句里有两个汉字对上，才算实锚点；只在分句之外撞上两个常见汉字',
  '（「自己」「公司」）的，按没有锚点处理。这道加严是 2026-09-20 补的：第 31 节插条目时',
  '「……的贷款见本节第 15 条」被顺延撞到新条目「在家给境外公司远程干活……个税自己报」上，',
  '隔着两个逗号的「你自己还」冒充了锚点，`--check` 当时报的是通过。',
  '',
  `共 ${total} 处引用。`,
  '',
  ...out,
].join('\n');

if (problems.length) {
  console.log('需要人工确认：');
  for (const p of problems) console.log('  ' + p);
  console.log('');
}

// 这个启发式当年误报率极高（中文里「未遂之后的长期结局见第 30 条」指向「念头一冒出来
// 先告诉身边的一个人」完全正确，却一个字都不重叠），288 处能报出 159 处；后来全书 345 处
// 引用逐一补了锚点，这两类现在正常情况下都应该是 0，报出来就是真有一处该补标注。
// 但它只保证「错位能被察觉」，不保证「错位一定被拦下」：模拟把节内引用整体顺延一条，
// 能当场拦下的约七成，剩下的（相邻两条讲同一件事、标题共用词）仍要靠对照表的 diff。
if (process.argv.includes('--suspect') && suspects.length) {
  console.log(`引用处的措辞和目标标题对不上（${suspects.length} 处，误报很多，仅供人工排查参考）：`);
  for (const s of suspects) console.log('  ' + s);
  console.log('');
}

if (process.argv.includes('--suspect') && weak.length) {
  console.log(`锚点只在分句之外对上（${weak.length} 处，多半是常见词偶然撞上，等于没有锚点）：`);
  for (const s of weak) console.log('  ' + s);
  console.log('');
}

if (CHECK_ONLY) {
  const fatal = problems.filter(p => p.includes('该节没有这一条') || p.includes('引用了它自己') || p.includes('相对指路'));
  for (const p of fatal) console.log('  ' + p);
  // 裸条号（引用前后没有一个词和目标标题对得上）同样算失败：这种引用一旦被条目顺延
  // 撞歪，谁也看不出来。修法是补个锚点——「见第 16 条（借条和担保）」，
  // 括号里的词取自目标条目标题即可。
  if (suspects.length) {
    console.log(`${suspects.length} 处引用是裸条号，错了看不出来，请补锚点（跑 --suspect 看清单）：`);
    for (const s of suspects.slice(0, 10)) console.log('  ' + s.split('　')[0]);
    if (suspects.length > 10) console.log(`  …另有 ${suspects.length - 10} 处`);
  }
  // 弱锚点同样算失败：整句里只有两个常见汉字对上、还隔着分句，等于没有锚点。
  if (weak.length) {
    console.log(`${weak.length} 处引用的锚点只在分句之外偶然对上，等于没有锚点，请补显式标注（跑 --suspect 看清单）：`);
    for (const s of weak.slice(0, 10)) console.log('  ' + s.split('　')[0]);
    if (weak.length > 10) console.log(`  …另有 ${weak.length - 10} 处`);
  }
  const bad = fatal.length + suspects.length + weak.length;
  console.log(bad ? `共 ${bad} 处要处理` : `引用检查通过：${total} 处全部指向正确，且都带锚点`);
  process.exit(bad ? 1 : 0);
}

writeFileSync(resolve(ROOT, 'docs/引用对照.md'), body, 'utf8');
console.log(`已写入 docs/引用对照.md，共 ${total} 处引用`);
