// 校验语法高亮 / diff 配色算法：把 client.js 里的 mix / contrastOf / toneTo 原样搬过来，
// 对五套浅色纸面与五套深色主题逐个算，确认色相没被洗掉、对比度都过线。
// 用法：node scripts/check-tokens.js
function mix(a, b, ratio) {
  const q = Math.max(0, Math.min(1, ratio));
  return "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - q) + parseInt(b.slice(i, i + 2), 16) * q).toString(16).padStart(2, "0")).join("").toUpperCase();
}
function luminance(color) {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(color.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrastOf(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function toneTo(base, fg, bg, target) {
  let best = base, bestK = contrastOf(base, bg);
  for (let r = 0.04; r <= 1.0001; r += 0.04) {
    const out = mix(base, fg, r), k = contrastOf(out, bg);
    if (k >= target) return out;
    if (k > bestK) { bestK = k; best = out; }
  }
  return best;
}
const SYNTAX = [
  ["constant", "#1C7ED6", "#4DABF7", 4.5],
  ["string", "#2F9E44", "#69DB7C", 4.5],
  ["comment", "#868E96", "#ADB5BD", 3.6],
  ["keyword", "#D6336C", "#FAA2C1", 4.5],
  ["parameter", "#E8590C", "#FFA94D", 4.5],
  ["function", "#6741D9", "#B197FC", 4.5],
  ["string-expression", "#2B8A3E", "#8CE99A", 4.5],
  ["punctuation", "#495057", "#CED4DA", 4.5],
  ["link", "#1971C2", "#74C0FC", 4.5]
];
const LIGHT = {
  暖白: ["#F1F1EE", "#262F3C"], 米纸: ["#F2EBDC", "#3B3226"], 豆沙绿: ["#E1E7DB", "#2C3228"],
  雾蓝: ["#E0E6ED", "#293139"], 石墨: ["#EDECEA", "#2E2E2C"]
};
const DARK = {
  蓝灰: ["#2A313A", "#1B2028", "#DAD6D6"], 纯黑: ["#121416", "#090A0B", "#D3D6D9"],
  北境: ["#2E3440", "#21262F", "#D8DEE9"], 暖褐: ["#2B2721", "#1C1915", "#E2D8C7"],
  墨绿: ["#1F2823", "#141C18", "#D0DDD4"]
};
const ct = 0.4;
let bad = 0;
console.log("=== 浅色（代码块底色 = level4）");
for (const [name, [content, fg]] of Object.entries(LIGHT)) {
  const bg = mix(content, fg, 0.045 + ct * 0.130);
  const cells = SYNTAX.map(([n, lb, , target]) => {
    const c = toneTo(lb, fg, bg, target);
    const k = contrastOf(c, bg);
    if (k < target - 0.02) bad++;
    return `${n}:${c}(${k.toFixed(2)})`;
  });
  console.log(`${name} bg=${bg}\n  ${cells.join("  ")}`);
}
console.log("\n=== 深色（代码块底色 = mix(mix(base,fg,.12),fg,.16)）");
for (const [name, [bgBase, base, fg]] of Object.entries(DARK)) {
  const bg = mix(mix(base, fg, 0.12), fg, 0.16);
  const cells = SYNTAX.map(([n, , db, target]) => {
    const c = toneTo(db, fg, bg, target);
    const k = contrastOf(c, bg);
    if (k < target - 0.02) bad++;
    return `${n}:${c}(${k.toFixed(2)})`;
  });
  console.log(`${name} bg=${bg}\n  ${cells.join("  ")}`);
}
console.log("\n=== diff 叠加色（浅色纸面 / 深色内容区）");
for (const [name, [content, fg]] of Object.entries(LIGHT)) {
  const add = mix(content, "#2E8B57", 0.16), del = mix(content, "#C0392B", 0.14);
  console.log(`${name} +${add} -${del}  文字压在上面 ${contrastOf(fg, add).toFixed(1)}:1 / ${contrastOf(fg, del).toFixed(1)}:1`);
}
for (const [name, [, base, fg]] of Object.entries(DARK)) {
  const content = mix(base, fg, 0.12);
  const add = mix(content, "#3FA96B", 0.22), del = mix(content, "#FF6B5E", 0.20);
  console.log(`${name} +${add} -${del}  文字 ${contrastOf(fg, add).toFixed(1)}:1 / ${contrastOf(fg, del).toFixed(1)}:1`);
}
console.log(bad === 0 ? "\nALL OK：所有语法色都达到目标对比度" : `\n${bad} 处未达标`);

// 追加：diff 标记色（+/- 号与行号槽左侧的色条）在同一行底色上的对比度。
console.log("\n=== diff marker 对比度（标记色 vs 加了底色后的行）");
for (const [name, [content, fg]] of Object.entries(LIGHT)) {
  const add = mix(content, "#2E8B57", 0.16), del = mix(content, "#C0392B", 0.14);
  for (const [label, base] of [["+", "#2E8B57"], ["-", "#C0392B"]]) {
    const bg = label === "+" ? add : del;
    for (const r of [0.25, 0.38, 0.5]) {
      const c = mix(base, fg, r);
      process.stdout.write(`${name}${label} r${r}: ${c} ${contrastOf(c, bg).toFixed(2)}  `);
    }
    console.log("");
  }
}
