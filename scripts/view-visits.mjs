#!/usr/bin/env node
/**
 * 查看主站访问记录（analytics/days/YYYY-MM-DD.jsonl）
 * ------------------------------------------------------------------
 * 为什么用命令行读：Worker 侧的 /hit 端点**只写不读** —— 线上不提供任何读取接口，
 * 新增的公开面就只有"一个只写端点"。所以查看只能从本机发起。
 *
 * 用法（在项目根目录执行，需本机已有 wrangler 凭证）：
 *   node scripts/view-visits.mjs                 # 今天 + 昨天，倒序，简要表格
 *   node scripts/view-visits.mjs --days 7        # 最近 7 天
 *   node scripts/view-visits.mjs --json          # 输出原始 JSON（便于自己接 jq 等）
 *   node scripts/view-visits.mjs --human-only    # 只显示「看起来像真人」的记录
 *   node scripts/view-visits.mjs --verbose       # 逐天打印读取结果（含"无对象"）
 *
 * ⚠️ 「0 条」有两种完全不同的含义，本脚本会分开报（2026-09-15 修）：
 *   · 真的没有对象 —— 那天没人来，或采集还没上线（属正常）
 *   · 读失败了     —— 网络超时 / Key 不存在 / 权限问题，**结论不成立**
 *   旧版把三者都吞成 null 并打印"7 天无对象"，曾把一次 10.7s 的连接超时
 *   误报成"没有记录"（详见 交接文档/2026-09-15-访问数据显示异常排查.md）。
 *   任何一天读失败时**退出码为 1**，便于接 CI / 一眼看出。
 *
 * 判定口径（启发式，只作提示，不是结论）：
 *   · 机器：UA 命中 headless / bot / crawler / curl / python-requests 等，或无 UA
 *   · 疑似机房：ASN 属常见云厂商（Cloudflare 13335、AWS、Azure、GCP…）且没有来源页
 *   · 疑似真人：常规浏览器 UA，且带来源页或地区/语言能对上
 * 更可靠的判别方式：同一 IP 哈希是否在短时间内反复出现（配合 --json 自行统计）。
 */
import { execFileSync } from 'node:child_process';

const BUCKET = 'myself-web-game';
const PREFIX = 'analytics/days/';
const args = process.argv.slice(2);
const getFlag = (n, d) => {
  const i = args.indexOf(n);
  if (i === -1) return d;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const days = Number(getFlag('--days', 2)) || 2;
const asJson = !!getFlag('--json', false);
const humanOnly = !!getFlag('--human-only', false);
const verbose = !!getFlag('--verbose', false);

// Windows 上 Node ≥ 20 不允许直接 spawn .cmd（EINVAL），且带 args 数组的 shell 调用会触发
// DEP0190 警告 —— 因此这里把参数逐项做安全转义后拼成完整命令再交给 shell。
const isWin = process.platform === 'win32';
const q = (s) => `"${String(s).replace(/(["\\])/g, '\\$1')}"`;
function runWrangler(argv) {
  if (isWin) {
    return execFileSync(`npx.cmd wrangler ${argv.map(q).join(' ')}`, {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
  }
  return execFileSync('npx', ['wrangler', ...argv], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

/**
 * 把 wrangler 的失败原因分成四类 —— 这是本脚本存在的意义：
 * 「没有对象」和「没读到」必须分开，否则会把网络故障读成"没人访问"。
 */
function classifyError(err) {
  const raw = [err?.stderr, err?.message, err?.stdout].filter(Boolean).join('\n');
  const low = raw.toLowerCase();
  // 合并 stdout 后优先看 stderr：wrangler 成功时也可能往 stdout 写东西
  const probe = `${err?.stderr || ''}\n${err?.message || ''}`.toLowerCase() || low;
  if (
    /specified key does not exist|the object does not exist|key not found|no such key|10007|not_found/.test(probe)
  ) {
    return { kind: 'missing', raw };
  }
  if (
    /fetch failed|network|connect|econn|etimedout|socket hang up|terminated|timeout|proxy|tls|dns/.test(probe)
  ) {
    return { kind: 'error', reason: '网络/连接失败', raw };
  }
  if (/authentication|unauthorized|forbidden|10000|permission|not authorized|401|403/.test(probe)) {
    return { kind: 'error', reason: '权限/登录失效', raw };
  }
  if (/no such bucket|bucket not found|10006/.test(probe)) {
    return { kind: 'error', reason: '桶不存在（名字写错？）', raw };
  }
  return { kind: 'error', reason: '未识别的失败', raw };
}

function fetchDay(day) {
  try {
    const out = runWrangler(['r2', 'object', 'get', `${BUCKET}/${PREFIX}${day}.jsonl`, '--pipe', '--remote']);
    const rows = out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('{'))
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return { ok: true, rows };
  } catch (err) {
    const c = classifyError(err);
    if (c.kind === 'missing') return { ok: true, rows: [] }; // 对象不存在 = 那天没有记录，正常
    return { ok: false, reason: c.reason, raw: c.raw };
  }
}

function classify(r) {
  const ua = (r.ua || '').toLowerCase();
  if (!ua) return '机器';
  if (/headless|lighthouse|bot|crawler|spider|scrapy|python-requests|curl|wget|monitor|uptime|ahrefs|semrush|bytespider|petalbot/.test(ua)) return '机器';
  const cloudAsn = ['13335', '16509', '14618', '14061', '8075', '15169', '20940'];
  if (cloudAsn.includes(String(r.asn)) && !r.r) return '疑似机房';
  return '疑似真人';
}

const today = Date.now();
const wanted = [];
for (let i = 0; i < days; i++) {
  wanted.push(new Date(today - i * 86400000).toISOString().slice(0, 10));
}

const records = [];
let empty = 0; // 对象不存在（正常）
const failed = []; // 读失败（结论不成立）
for (const day of wanted) {
  const r = fetchDay(day);
  if (!r.ok) {
    failed.push({ day, reason: r.reason, raw: r.raw });
    if (verbose) console.log(`  ✗ ${day}  读失败：${r.reason}`);
    continue;
  }
  if (!r.rows.length) {
    empty++;
    if (verbose) console.log(`  · ${day}  无对象（那天没有记录）`);
    continue;
  }
  if (verbose) console.log(`  ✓ ${day}  ${r.rows.length} 条`);
  records.push(...r.rows);
}

// 读失败时把 wrangler 原始报错的最后一行也印出来 —— 不然只看到"网络失败"无法自查
const firstRaw = failed.find((f) => f.raw)?.raw || '';
const rawLines = firstRaw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => /error|failed|不存在|forbidden|unauthorized/i.test(l))
  .slice(0, 3);

const credError = failed.some((f) => f.reason.includes('权限') || f.reason.includes('桶'));

records.sort((a, b) => String(b.t).localeCompare(String(a.t)));
const shown = humanOnly ? records.filter((r) => classify(r) !== '机器') : records;

if (asJson) {
  // --json 也要能被机器判断"结果是否可信"：把读取状态一并放进载荷
  console.log(
    JSON.stringify(
      {
        ok: failed.length === 0,
        queried: { days, from: wanted[wanted.length - 1], to: wanted[0] },
        counted: { records: records.length, shown: shown.length, emptyDays: empty },
        failed,
        records: shown,
      },
      null,
      2
    )
  );
} else {
  console.log(
    `\n共 ${records.length} 条记录（显示 ${shown.length} 条），查询 ${days} 天（${empty} 天无对象，${failed.length} 天读取失败）\n`
  );
  if (!records.length && failed.length) {
    console.log(`⚠️ 本次结果不可信：有 ${failed.length} 天读取失败，不代表"没有访问"。`);
    console.log(
      `   失败日期：${failed.map((f) => f.day).join(', ')}（${[...new Set(failed.map((f) => f.reason))].join(' / ')}）`
    );
    for (const l of rawLines) console.log(`   wrangler: ${l}`);
    console.log(
      credError
        ? '   → 权限类：跑一次 `npx wrangler login` 或检查账号（本机 wrangler 凭证过期/无权时即如此）\n'
        : '   → 连接类：本机到 api.cloudflare.com 不稳，重跑一次通常就好（本机网络对 CF 时通时断）\n'
    );
  } else if (!records.length) {
    console.log('没有记录 —— 已确认所有日期都读到了，是"确实没有访问"。');
    console.log('  ① 新 Worker 还没部署（cd worker && npx wrangler deploy）');
    console.log('  ② 这段时间确实没有真实页面加载');
    console.log('  ③ 访问都命中了机器 UA 过滤 —— 那正是我们要的效果\n');
  }
  if (failed.length && records.length) {
    console.log(
      `⚠️ 注意：${failed.map((f) => f.day).join(', ')} 读取失败（${[...new Set(failed.map((f) => f.reason))].join(' / ')}），上面只是"读到的部分"。\n`
    );
  }
  const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
  const header = pad('时间(本地)', 21) + pad('国家', 5) + pad('ASN', 8) + pad('判定', 10) + pad('路径', 24) + '来源';
  if (shown.length) {
    console.log(header);
    console.log('-'.repeat(112));
    for (const r of shown) {
      const local = new Date(r.t).toLocaleString('zh-CN', { hour12: false });
      console.log(pad(local, 21) + pad(r.c, 5) + pad(r.asn, 8) + pad(classify(r), 10) + pad(r.p, 24) + (r.r || '-'));
    }
  }
  const byKind = shown.reduce((m, r) => ((m[classify(r)] = (m[classify(r)] || 0) + 1), m), {});
  console.log('\n判定分布:', JSON.stringify(byKind));
  // 同一 IP 哈希复现次数 —— 比 UA 更可靠的"机器"信号
  const byIp = shown.reduce((m, r) => ((m[r.ip] = (m[r.ip] || 0) + 1), m), {});
  const repeat = Object.entries(byIp).filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]);
  console.log('同一 IP 哈希出现 ≥5 次:', repeat.length ? repeat.map(([k, n]) => `${k}×${n}`).join(', ') : '无');
  console.log('');
  if (shown.length) {
    console.log('各项能判断出什么（列名与上表一一对应）：');
    console.log('  时间   本地时区。密集且等间隔（如每 30 分钟一次）＝ 定时任务；零星分布 ＝ 真人随手看。');
    console.log('  国家   访问来源国。你自己走直连是 CN；出现你没用过的国家才值得注意。');
    console.log('  ASN    网络运营商/机房编号。同一个 ASN 大量重复 ≈ 同一来源；');
    console.log('         常见云厂商 ASN（13335 等）多为机房抓取，家宽 ASN 更像真人。');
    console.log('  判定   仅按 UA 猜测，**不可当结论**：搜索引擎爬虫会伪装成正常浏览器 UA，');
    console.log('         大概率被判成「疑似真人」。它只用来快速筛掉明显的脚本。');
    console.log('  路径   被访问的页面。集中在新页面/列表页 ＝ 在枚举站内链接（重爬）；');
    console.log('         反复访问同一批固定 URL ＝ 监控或固定清单。');
    console.log('  来源   上一页地址（Referer）。为空多为直接输入/收藏/爬虫；');
    console.log('         若显示某个站外域名，说明访客是从那里点进来的。');
    console.log('  同IP≥5 同一哈希反复出现 —— **比「判定」可靠得多的机器信号**；');
    console.log('         注意哈希按天换盐，跨天无法关联，也不能反查明文 IP。');
    console.log('');
  }
}

// 有任何一天读失败 → 退出码 1：让"结果不可信"这件事无法被忽略
process.exit(failed.length ? 1 : 0);
