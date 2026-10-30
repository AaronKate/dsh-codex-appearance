// 链接色校验：浅色五套要"比纸面/卡片都够对比"，深色五套要"与正文色明显不同色"。
// 与 client.js 的 linkToneOf / toneTo 同式。用法：node scripts/check-links.js
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
// 近似 CIE76，只用来判断"是否同色"的量级
function labOf(hex) {
  const lin = [1, 3, 5].map(i => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  const [r, g, b] = lin;
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const Z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > Math.pow(6 / 29, 3) ? Math.cbrt(t) : t / (3 * Math.pow(6 / 29, 2)) + 4 / 29);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
function deltaE(a, b) {
  const A = labOf(a), B = labOf(b);
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}
const LINK_BLUE = "#2F6FD0";
// [纸面, 正文, linkLight, 是否要求色相拉开（暖纸/绿纸正文带色相，必须换色相）]
const LIGHT = {
  暖白: ["#F1F1EE", "#262F3C", "#244F94", false], 米纸: ["#F2EBDC", "#3B3226", "#4A3B6B", true],
  豆沙绿: ["#E1E7DB", "#2C3228", "#24596B", true], 雾蓝: ["#E0E6ED", "#293139", "#1B4A7C", false],
  石墨: ["#EDECEA", "#2E2E2C", "#354F6A", true]
};
const DARK = {
  蓝灰: ["#2A313A", "#1B2028", "#DAD6D6", "#339CFF"], 纯黑: ["#121416", "#090A0B", "#D3D6D9", "#5AA9FF"],
  北境: ["#2E3440", "#21262F", "#D8DEE9", "#88C0D0"], 暖褐: ["#2B2721", "#1C1915", "#E2D8C7", "#D79B54"],
  墨绿: ["#1F2823", "#141C18", "#D0DDD4", "#6FB98F"]
};
const ct = 0.4;
let bad = 0;
const need = (ok, msg) => { if (!ok) { bad++; console.log("FAIL", msg); } };

console.log("=== 浅色：专属链接色 vs 纸面 / 卡片 / 正文");
for (const [name, [content, fg, tone, needHue]] of Object.entries(LIGHT)) {
  const card = mix(content, fg, 0.02 + ct * 0.06);
  const dE = deltaE(tone, fg);
  const hue = (h) => { const [L, a, b] = labOf(h); return (Math.atan2(b, a) * 180 / Math.PI + 360) % 360; };
  const dH = Math.abs(((hue(tone) - hue(fg) + 540) % 360) - 180);
  console.log(`  ${name} ${tone} vs纸面 ${contrastOf(content, tone).toFixed(2)} vs卡片 ${contrastOf(card, tone).toFixed(2)} ΔE(正文) ${dE.toFixed(1)} 色相差 ${dH.toFixed(0)}°`);
  need(contrastOf(card, tone) >= 4.5, `${name} 卡片上链接对比不足`);
  need(dE >= 15, `${name} 链接与正文色差不足`);
  if (needHue) need(dH >= 90, `${name} 链接与正文色相没拉开`);
}

console.log("\n=== 深色：链接 vs 卡片对比 / 与正文色差（新做法）");
for (const [name, [bg, base, fg, accent]] of Object.entries(DARK)) {
  const content = mix(base, fg, 0.12);
  const card = mix(content, fg, 0.02 + ct * 0.06);
  const tone = toneTo(accent, "#FFFFFF", card, 5.0);
  const old = mix(accent, "#FFFFFF", 0.62);
  console.log(`  ${name} 旧 ${old} 对比${contrastOf(card, old).toFixed(2)} ΔE ${deltaE(old, fg).toFixed(1)} | 新 ${tone} 对比${contrastOf(card, tone).toFixed(2)} ΔE ${deltaE(tone, fg).toFixed(1)}`);
  need(contrastOf(card, tone) >= 4.5, `${name} 深色链接对比不足`);
  need(deltaE(tone, fg) >= 12, `${name} 深色链接与正文色差不足`);
}

console.log(bad === 0 ? "\nALL OK" : `\n${bad} 项失败`);
process.exit(bad === 0 ? 0 : 1);
