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
// 行内代码（B 方案）：淡底 + 发丝描边 + 不跟代码块同字号 + 折行每行独立圆角
check(/body :not\(pre\) > code \{[^}]*border: 1px solid #[0-9A-F]{6} !important/.test(light.css), "行内代码有发丝描边");
check(/body :not\(pre\) > code \{[^}]*font-size: 0\.92em !important/.test(light.css), "行内代码字号按正文 0.92em");
check(/box-decoration-break: clone/.test(light.css), "折行时每行独立圆角");
// 会话进行时的「停止」按钮呼吸光晕：靠图标形状判定状态，不依赖 aria-label 文案
check(/GRgSLq_primary"\]:has\(svg rect\)/.test(light.css), "停止态按钮用 :has(svg rect) 命中");
check(/GRgSLq_primary"\]\[aria-label\*="停止"\]/.test(light.css), "再有 aria-label 兜底一条");
check(/@keyframes dca-breathe/.test(light.css), "呼吸关键帧已注入");
check(/inset 0 0 0 3px rgb\(255 255 255 \/ \.95\)/.test(light.css), "峰值是 3px 内环（画在按钮内部，不会被裁切）");
check(/scale\(1\.06\)/.test(light.css), "呼吸带 1.06 缩放，幅度肉眼可辨");
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
check(/text-decoration: underline 1px dotted !important/.test(light.css), "下划线带 !important（压过 DSH 的 text-decoration:none）");
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
]) {
  const r = run(opts);
  let all = [];
  try { all = texts(r.component ? r.component({}) : null); } catch (e) { failures++; console.log("FAIL 设置页渲染抛错:", e.message); continue; }
  const has = (t) => all.some((x) => x === t);
  for (const t of want) check(has(t), `[${label}] 设置页含「${t}」`);
  for (const t of forbid) check(!has(t), `[${label}] 设置页不含「${t}」`);
}

console.log(failures === 0 ? "ALL OK" : (failures + " 项失败"));
process.exit(failures === 0 ? 0 : 1);
