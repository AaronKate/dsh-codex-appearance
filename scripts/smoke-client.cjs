// 冒烟测试：不开真实应用，用最小 DOM 桩把 lib/client.js 的插件主体跑起来，
// 检查三件事——主题 token 生成、语法/diff 变量是否随深浅色变化、定时模式是否
// 把解析结果（而不是 "schedule"）交给宿主。用法：node scripts/smoke-client.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const code = fs.readFileSync(path.join(__dirname, "..", "lib", "client.js"), "utf8");

function run({ stored, darkAttr }) {
  const created = [];
  const mkEl = (tag) => ({
    tagName: tag, id: "", type: "", className: "", dataset: {}, files: null,
    style: { cssText: "", setProperty() {} },
    children: [], textContent: "", href: "", download: "",
    appendChild(c) { this.children.push(c); return c; },
    setAttribute(k, v) { this[k] = v; },
    remove() {}, click() {}, addEventListener() {},
    getBoundingClientRect: () => ({ width: 100, height: 16, top: 0, left: 0 }),
  });
  const head = mkEl("head");
  head.appendChild = (el) => { created.push(el); return el; };
  const body = mkEl("body");
  let bodyDark = !!darkAttr;
  body.hasAttribute = (a) => a === "data-ds-dark-theme" && bodyDark;
  const document = {
    head, body,
    getElementById: (id) => created.find((e) => e.id === id) || null,
    createElement: mkEl,
    querySelectorAll: () => [],
    addEventListener() {},
    documentElement: mkEl("html"),
  };
  // 设置键名是插件内部常量，测试不需要知道：任何读都返回同一份存档。
  const store = new Map();
  const localStorage = {
    getItem: () => (stored ? JSON.stringify(stored) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: () => store.clear(),
  };
  const React = {
    createElement: (...a) => ({ a }), useState: (v) => [v, () => {}],
    useEffect() {}, useMemo: (f) => f(), useRef: () => ({ current: null }),
  };
  let spec = null;
  const window = { __ModuleLoader__: { load: (s) => { spec = s; } } };
  const ctxEnv = {
    window, document, localStorage, React, console,
    setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
    fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
    requestAnimationFrame: (f) => f(), URL: { createObjectURL: () => "blob:", revokeObjectURL() {} },
    Blob: class {}, FileReader: class {}, MutationObserver: class { observe() {} disconnect() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  };
  ctxEnv.globalThis = ctxEnv;
  vm.createContext(ctxEnv);
  vm.runInContext(code, ctxEnv, { filename: "client.js" });
  if (!spec) throw new Error("模块未注册");
  const plugin = spec.factory((name) => (name === "react" ? React : {}));
  const themes = [];
  const effects = [];
  const ctx = {
    effect(fn) { effects.push(fn); return () => {}; },
    inject(names, cb) {
      const scope = {
        theme: {
          setTheme: (t) => themes.push(t),
          overrideTokens: (id, tokens) => { scope.tokens = tokens; return () => {}; },
        },
        effect: (fn) => { effects.push(fn); return () => {}; },
      };
      cb(scope);
      ctx.scope = scope;
    },
    slots: { inject(name, cb) { if (typeof cb === "function") cb(); }, register: (a, ...rest) => { ctx.component = rest.find((x) => typeof x === "function") || null; return () => {}; } },
  };
  plugin.apply(ctx);
  const css = created.map((e) => e.textContent).join("\n");
  return { css, themes, tokens: ctx.scope && ctx.scope.tokens, store, component: ctx.component };
}

// 对比度工具：链接小字要按 WCAG 相对亮度算真实对比度，而不是只看色值"亮不亮"。
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const grab = (css, name) => {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : "(缺失)";
};

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log("FAIL", msg); } else console.log("ok  ", msg); };

// 1) 浅色 + 豆沙绿
const light = run({ stored: { mode: "light", theme: "green" }, darkAttr: false });
console.log("—— 浅色 / 豆沙绿");
for (const k of ["shiki-token-keyword", "shiki-token-comment", "dsw-alias-file-diff-added-bg", "dsw-alias-file-diff-deleted-marker", "dsw-alias-markdown-inline-code"]) {
  console.log(`  ${k} = ${grab(light.css, k)}`);
}
check(/--shiki-token-keyword:\s*#[0-9a-f]{6}/i.test(light.css), "语法高亮变量已输出");
check(grab(light.css, "shiki-token-keyword") !== "(缺失)", "关键字色存在");
check(/--dsw-alias-file-diff-added-bg:\s*#[0-9a-f]{6}/i.test(light.css), "diff 行底色已输出");
check(/--dsw-alias-code-diff-added:\s*#[0-9a-f]{8}/i.test(light.css), "diff 叠加色带 alpha");
check(light.tokens && light.tokens["--dsw-alias-bg-base"], "主题 token 层仍正常");
// 发送/停止主按钮：底色必须跟主题强调色走（DSH 默认钉在 static-deepseek-500），且白图标 ≥3:1
const fillLight = light.tokens["--dsw-alias-button-info-fill"].light;
const fillHover = light.tokens["--dsw-alias-button-info-hover"].light;
console.log("  button-info-fill =", fillLight, " hover =", fillHover);
check(/^#[0-9A-F]{6}$/.test(fillLight) && fillLight !== "#4D6BFE", "主按钮底色由主题推导，不再钉在 static-deepseek");
check(!!fillLight && contrast(fillLight, "#FFFFFF") >= 3, `白图标对底色 ≥3:1（${fillLight ? contrast(fillLight, "#FFFFFF").toFixed(2) : "n/a"}）`);
check(!!fillHover && fillHover !== fillLight, "hover 有独立的一档（浅色加深）");
// 对比度够的强调色必须原样使用，不能被"为了白图标"无脑压暗（绿主题白对比 5.08）
const themed = run({ stored: { mode: "light", theme: "green", accent: "#4A7A3A", light: { accent: "#4A7A3A" } }, darkAttr: false });
const themedFill = themed.tokens["--dsw-alias-button-info-fill"].light;
console.log("  豆沙绿 button-info-fill =", themedFill);
check(themedFill === "#4A7A3A", `够对比的强调色原样当底色（${themedFill}）`);
// 行内代码（B 方案）：淡底 + 发丝描边 + 不跟代码块同字号 + 折行每行独立圆角
check(/body :not\(pre\) > code \{[^}]*border: 1px solid #[0-9A-F]{6} !important/.test(light.css), "行内代码有发丝描边");
check(/body :not\(pre\) > code \{[^}]*font-size: 0\.92em !important/.test(light.css), "行内代码字号按正文 0.92em");
check(/box-decoration-break: clone/.test(light.css), "折行时每行独立圆角");
// 停止按钮跟 Codex 保持一致：静态圆钮，插件不注入任何光环/呼吸/缩放
check(!/GRgSLq_primary/.test(light.css), "停止按钮完全交给 DSH 原生样式（插件不再写任何 GRgSLq_primary 规则）");
check(!/dca-aurora/.test(light.css), "没有自造的光环关键帧");
// 期望值一律用源码同一个 mix()/hexA() 现算：手写常量会差一档（#D7DDD2 vs 实际 #D7DDD1）。
function mixHex(a, b, ratio) {
  const q = Math.max(0, Math.min(1, ratio));
  return "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - q) + parseInt(b.slice(i, i + 2), 16) * q).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function alphaHex(a) { return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0").toUpperCase(); }
function over(hex8, bg) {
  const a = parseInt(hex8.slice(7, 9), 16) / 255;
  const c = [1, 3, 5].map(i => Math.round(parseInt(hex8.slice(i, i + 2), 16) * a + parseInt(bg.slice(i, i + 2), 16) * (1 - a)));
  return "#" + c.map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}
const GREEN = { accent: "#4A7A3A", content: "#E1E7DB" };
// 侧栏选中态：强调色淡染（豆沙绿 = #C3D0BC），且 token 与两条行规则同值
const selRow = (light.css.match(/wnFoaW_selected"\] \{ background: (#[0-9A-F]{6}) !important/) || [])[1];
console.log("  侧栏选中行 =", selRow, " 导航 token =", light.tokens["--dsw-specific-sidebar-nav-item-active"].light);
check(selRow === "#C3D0BC", "会话选中行 = 侧栏底色 + accent 14%");
check(light.tokens["--dsw-specific-sidebar-nav-item-active"].light === selRow, "导航选中 token 与行规则同值");
console.log("  行内代码底 =", grab(light.css, "dsw-alias-markdown-inline-code"), " （豆沙绿应为 #D7DDD1）");

// 1b) 文件链接可见性：路径必须是链接色 + 常驻下划线，且不再被灰色行色规则波及
check(/body \[class\*="HOHHba_path"\] \{ color: #[0-9A-F]{6} !important; text-decoration: underline/.test(light.css), "改动卡片路径是链接色 + 下划线");
check(!/\[class\*="HOHHba_row"\], body \[class\*="HOHHba_path"\]/.test(light.css), "灰色行色规则不再包含 HOHHba_path");
check(/fileLink"\]:hover[^}]*text-decoration-style: solid/.test(light.css), "文件链接悬停转实线");
check(/body \.hKdVjq_fileLink, body \.HOHHba_path, body \.K5rwea_fileName \{ text-decoration: underline 1px solid !important/.test(light.css), "文件链接静止态就是常驻实线下划线（不靠 hover）");
check(/text-decoration-skip-ink: none !important/.test(light.css), "下划线跳过字形已关闭，长路径折行也连续");
check(/\[class\*="fileLink"\], body \[class\*="fileMention"\]/.test(light.css), "文件引用（fileMention 带 </> 图标）也覆盖到了");

// 2) 深色 + 纯黑，且色盲友好关
const dark = run({ stored: { mode: "dark", darkTheme: "black" }, darkAttr: true });
console.log("—— 深色 / 纯黑");
console.log("  bg-base =", dark.tokens["--dsw-alias-bg-base"]);
console.log("  sidebar-fill =", dark.tokens["--dsw-specific-sidebar-fill"]);
console.log("  keyword =", grab(dark.css, "shiki-token-keyword"));
check(dark.tokens["--dsw-specific-sidebar-fill"].dark === "#090A0B", "深色侧栏基准跟随纯黑主题");
check(grab(dark.css, "shiki-token-keyword") !== grab(light.css, "shiki-token-keyword"), "深色语法色与浅色不同");
check(grab(dark.css, "dsw-alias-file-diff-added-bg") !== grab(light.css, "dsw-alias-file-diff-added-bg"), "深色 diff 底色与浅色不同");
const fillDark = dark.tokens["--dsw-alias-button-info-fill"].dark;
const fillDarkHover = dark.tokens["--dsw-alias-button-info-hover"].dark;
console.log("  深色 button-info-fill =", fillDark, " hover =", fillDarkHover);
check(!!fillDark && /^#[0-9A-F]{6}$/.test(fillDark), "深色主按钮底色由深色调色板推导");
check(!!fillDark && contrast(fillDark, "#FFFFFF") >= 3, `深色白图标对底色 ≥3:1（${fillDark ? contrast(fillDark, "#FFFFFF").toFixed(2) : "n/a"}）`);
// 深色链接色：必须来自强调色族，且和正文色明显不同（旧做法是朝白混 .62，接近正文）
const darkLink = (dark.css.match(/\[class\*="fileLink"\][^{]*\{ color: (#[0-9A-F]{6})/) || [])[1];
console.log("  深色链接色 =", darkLink, " 深色正文 =", dark.tokens["--dsw-alias-label-primary"].dark);
check(!!darkLink && darkLink !== light.css.match(/\[class\*="fileLink"\][^{]*\{ color: (#[0-9A-F]{6})/)[1], "深色链接色与浅色不同");
const darkBg = dark.tokens["--dsw-alias-bg-base"].dark;
const darkHover = (dark.css.match(/\[class\*="fileLink"\]:hover[^{]*\{ color: (#[0-9A-F]{6})/) || [])[1];
check(!!darkLink && /^#[0-9A-F]{6}$/.test(darkLink), "深色链接色是 6 位 hex");
check(!!darkLink && contrast(darkLink, darkBg) >= 7, `深色链接色对底色 ≥7:1（${darkLink} vs ${darkBg} = ${darkLink ? contrast(darkLink, darkBg).toFixed(2) : "n/a"}）`);
check(!!darkHover && contrast(darkHover, darkBg) > contrast(darkLink, darkBg), `深色链接悬停更亮（${darkHover} = ${darkHover ? contrast(darkHover, darkBg).toFixed(2) : "n/a"}）`);
check(!!darkLink && parseInt(darkLink.slice(5, 7), 16) > parseInt(darkLink.slice(1, 3), 16), "深色链接偏蓝，没有洗成正文灰");
check(dark.tokens["--dsw-alias-link"].dark === darkLink, "深色 --dsw-alias-link 与 fileLink 同色");

// 3) 色盲友好档：增删色相变成蓝/橙
const cvd = run({ stored: { mode: "light", theme: "warm", colorblind: true }, darkAttr: false });
console.log("—— 色盲友好 / 浅色");
console.log("  added-marker =", grab(cvd.css, "dsw-alias-file-diff-added-marker"), " deleted-marker =", grab(cvd.css, "dsw-alias-file-diff-deleted-marker"));
check(grab(cvd.css, "dsw-alias-file-diff-added-marker").split(" ")[0] === "#2F6FD0", "色盲档：新增是蓝");
check(grab(cvd.css, "dsw-alias-file-diff-deleted-marker").split(" ")[0] === "#C2661A", "色盲档：删除是橙");

// 4) 定时模式：不能把 "schedule" 交给宿主
const before = new Date();
const hh = String(before.getHours()).padStart(2, "0");
const sched = run({ stored: { mode: "schedule", lightAt: `${hh}:00`, darkAt: `${hh}:00` }, darkAttr: false });
check(sched.themes.every((t) => t === "light" || t === "dark"), `定时模式交给宿主的只有深浅色（${sched.themes.join(",")}）`);
const late = run({ stored: { mode: "schedule", lightAt: "07:00", darkAt: "19:00" }, darkAttr: false });
const hour = new Date().getHours();
const expected = hour >= 7 && hour < 19 ? "light" : "dark";
check(late.themes[late.themes.length - 1] === expected, `定时表按当前时间解析为 ${expected}`);
// 极昼/极夜（纬度 90°，太阳整天不过地平线）：拿不到日出日落时必须退回固定时间，
// 不能算出一堆 NaN 把主题卡在某个不存在的状态上。
const polar = run({ stored: { mode: "schedule", sun: true, lat: 90, lon: 0, lightAt: `${hh}:00`, darkAt: `${hh}:00` }, darkAttr: false });
check(polar.themes.length > 0 && polar.themes.every((t) => t === "light" || t === "dark"), `极昼极夜回退固定时间（${polar.themes.join(",")}）`);

// 5) 设置页真的能渲染：用极简 React 桩把组件调一次，收集所有文字，检查新增控件的出现条件。
function texts(node, out = []) {
  if (node == null) return out;
  if (typeof node === "string" || typeof node === "number") { out.push(String(node)); return out; }
  if (Array.isArray(node)) { node.forEach((n) => texts(n, out)); return out; }
  if (node.a) {
    const props = node.a[1];
    if (props && typeof props === "object") for (const k of ["value", "aria-label"]) if (typeof props[k] === "string") out.push(props[k]);
    node.a.forEach((n) => texts(n, out));
  }
  return out;
}
for (const [label, opts, want, forbid] of [
  ["浅色", { stored: { mode: "light", theme: "green" }, darkAttr: false }, ["护眼主题", "模式", "定时", "色盲友好 diff", "导出设置", "导入设置"], ["深色主题", "定时切换"]],
  ["深色", { stored: { mode: "dark", darkTheme: "nord" }, darkAttr: true }, ["深色主题", "北境", "模式"], ["护眼主题"]],
  ["定时", { stored: { mode: "schedule", lightAt: "08:30", darkAt: "20:15" }, darkAttr: false }, ["定时切换", "08:30", "20:15"], []],
  ["日出日落", { stored: { mode: "schedule", sun: true, lat: 39.9042, lon: 116.4074 }, darkAttr: false }, ["日出日落", "今日日出日落", "重新定位"], ["定时切换"]],
]) {
  const r = run(opts);
  let all = [];
  try { all = texts(r.component ? r.component({}) : null); } catch (e) { failures++; console.log("FAIL 设置页渲染抛错:", e.message); continue; }
  const has = (t) => all.some((x) => x === t);
  for (const t of want) check(has(t), `[${label}] 设置页含「${t}」`);
  for (const t of forbid) check(!has(t), `[${label}] 设置页不含「${t}」`);
}

// 5) 设置项 → CSS 变量：设进去的值必须真的出现在注入的 CSS 里（不是只存进 state/localStorage）。
//    以后新增设置项时，在 PROBES 里加一行 {label, stored, want} 即可；期望值由设置值现算，不写死。
const bodyRule = (css) => {
  const at = css.indexOf("--dsh-font-family-text");
  if (at < 0) return "";
  const a = css.lastIndexOf("{", at), z = css.indexOf("}", at);
  return a < 0 || z < 0 ? "" : css.slice(a + 1, z);
};
const bodyDecl = (css, prop) => {
  for (const part of bodyRule(css).split(";")) {
    const k = part.indexOf(":");
    if (k > 0 && part.slice(0, k).trim() === prop) { const v = part.slice(k + 1).trim(); return v || "(缺失)"; }
  }
  return "(缺失)";
};
const PROBES = [
  { label: "界面字号 17 / 代码字号 16 / 行高舒适",
    stored: { mode: "light", theme: "green", uiSize: 17, codeSize: 16, fontStyle: "comfortable" },
    want: { uiSize: 17, codeSize: 16, lineHeight: "1.65" } },
  { label: "界面字号 13 / 代码字号 11 / 行高紧凑",
    stored: { mode: "light", theme: "green", uiSize: 13, codeSize: 11, fontStyle: "compact" },
    want: { uiSize: 13, codeSize: 11, lineHeight: "1.3" } },
];
for (const p of PROBES) {
  const out = run({ stored: p.stored, darkAttr: false });
  const got = { uiSize: bodyDecl(out.css, "font-size"), codeSize: bodyDecl(out.css, "--dsh-code-font-size"), lineHeight: bodyDecl(out.css, "line-height") };
  console.log(`  [${p.label}] body: font-size=${got.uiSize} --dsh-code-font-size=${got.codeSize} line-height=${got.lineHeight}`);
  check(got.uiSize === `${p.want.uiSize}px`, `设置 uiSize=${p.want.uiSize} → body 的 font-size 输出 ${p.want.uiSize}px`);
  check(got.codeSize === `${p.want.codeSize}px`, `设置 codeSize=${p.want.codeSize} → --dsh-code-font-size 输出 ${p.want.codeSize}px`);
  check(got.lineHeight === p.want.lineHeight, `行高样式 ${p.stored.fontStyle} → body 的 line-height 输出 ${p.want.lineHeight}`);
}
// 6) 安装副本必须与源码逐字节一致（目录名以实际 node_modules 为准；未安装则跳过，不判失败）
const crypto = require("crypto");
const INSTALL = "C:/Users/79294/.dsh/profiles/desktop/node_modules/dsh-eye-comfort/lib/client.js";
const SRC = path.join(__dirname, "..", "lib", "client.js");
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
if (fs.existsSync(INSTALL)) {
  const a = sha(SRC), b = sha(INSTALL);
  console.log(`  源码 sha=${a.slice(0, 8)}  安装副本 sha=${b.slice(0, 8)}`);
  console.log(`  副本路径 ${INSTALL}`);
  check(a === b, `安装副本与源码逐字节一致（sha ${a.slice(0, 8)}）`);
} else {
  console.log(`  skip 安装副本检查：${INSTALL} 不存在`);
}

console.log(failures === 0 ? "ALL OK" : (failures + " 项失败"));
process.exit(failures === 0 ? 0 : 1);
