window.__ModuleLoader__.load({
  id: "dsh-eye-comfort",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const KEY = "dsh-codex-appearance/v1";
    const BLUE = "#339CFF";
    // 浅色模式下的链接基色：偏蓝、饱和度足够，用来和暖色正文拉开冷暖对比。
    const LINK_BLUE = "#2F6FD0";
    const DEFAULT = {
      mode: "dark", separate: false, theme: "warm",
      accent: BLUE, background: "#2A313A", foreground: "#DAD6D6",
      light: {accent: BLUE, background: "#F7F8F9", foreground: "#262F3C", uiFont:"system", contentFont:"inherit", codeFont:"system"},
      dark: {accent: BLUE, background: "#2A313A", foreground: "#DAD6D6", uiFont:"system", contentFont:"inherit", codeFont:"system"},
      uiFont: "system", contentFont: "inherit", codeFont: "system",
      uiSize: 14, codeSize: 12, fontStyle: "normal", contentStyle: "normal", codeStyle: "normal",
      contentWidth: 920, contrast: 40, reducedMotion: "system",
      paper: false, paperStrength: 60,
      darkTheme: "slate", colorblind: false, lightAt: "07:00", darkAt: "19:00"
    };
    const FONTS = {system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", inherit: "inherit", sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", serif: "Georgia, 'Songti SC', serif", mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"};
    // 纸张颗粒纹理：feTurbulence 分形噪声 → 去饱和 → 以 0.5 为中性点做极小振幅抖动，
    // 再与主题底色相乘（feComposite arithmetic），输出一张"自带底色的纸面"。
    // 纹理本身不透明、不含 alpha，因此不依赖任何混合模式，也不要求元素自己有不透明背景色。
    //
    // 四条坑，全部由 Edge 真实渲染 + 像素统计验证出来：
    //   1. feTurbulence 的 alpha 通道本身是噪声 → 必须把 feFuncA 钉成 1，否则是一层"雾"。
    //   2. background-blend-mode: overlay 只与元素*自身*的 background-color 混合；DSH 里很多
    //      表面是透明底（靠祖先绘制），overlay 会把灰噪声直接糊上去 —— 整片变灰。
    //   3. SVG 滤镜默认在 linearRGB 运算，按 sRGB 算的参数会偏色（深色被提亮成灰绿）。
    //      必须显式 color-interpolation-filters="sRGB"。
    //   4. feFunc 的输出被硬性 clamp 到 [0,1]。把"目标标准差"换算成放大倍数（slope≈23）会让
    //      噪声几乎全部撞上 0/1 边界，得到的是大块黑白砂砾而不是细颗粒 —— 这正是
    //      "像砂纸"的成因。所以振幅必须留在 [0,1] 内：噪声先压到 0.5±amp，再乘底色。
    const NOISE_MID = 0.5;
    const NOISE_SD = 0.0917;
    function paperTexture(baseHex, amplitude) {
      const tint = [1, 3, 5].map((i) => parseInt(baseHex.slice(i, i + 2), 16) / 255);
      // amplitude 是 0–1 的亮度抖动幅度（相对值），先换算成噪声放大倍数，再夹在安全区间内。
      // 目标标准差 ÷ 噪声自身标准差 = 需要的放大倍数；超过 ~4 就会大面积撞到 clamp 边界。
      const k = Math.max(0, amplitude) / NOISE_SD;
      const slope = Math.max(0, Math.min(3.6, Math.round(k * 64) / 64)).toFixed(4);
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">' +
        '<filter id="n" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" seed="11" stitchTiles="stitch" result="t"/>' +
        '<feColorMatrix in="t" type="saturate" values="0" result="g"/>' +
        // 噪声压成 0.5 为中心、幅度受控的中性灰；alpha 钉成 1 避免"雾"
        '<feComponentTransfer in="g" result="n">' +
          '<feFuncR type="linear" slope="' + slope + '" intercept="' + (0.5 - Number(slope) * NOISE_MID).toFixed(4) + '"/>' +
          '<feFuncG type="linear" slope="' + slope + '" intercept="' + (0.5 - Number(slope) * NOISE_MID).toFixed(4) + '"/>' +
          '<feFuncB type="linear" slope="' + slope + '" intercept="' + (0.5 - Number(slope) * NOISE_MID).toFixed(4) + '"/>' +
          '<feFuncA type="linear" slope="0" intercept="1"/>' +
        '</feComponentTransfer>' +
        // arithmetic 的公式是 result = k1*i1*i2 + k2*i1 + k3*i2 + k4（i1=底色, i2=噪声）。
        // 要的是「底色 × (2·噪声)」：噪声均值 0.5 时系数为 1，即平均亮度仍等于底色，
        // 只叠加 ±抖动。因此必须是 k1=2（乘噪声），写成 k2=2 会变成底色翻倍 → 纯白。
        '<feComposite in="SourceGraphic" in2="n" operator="arithmetic" k1="2" k2="0" k3="0" k4="0"/>' +
        '</filter>' +
        // 底色作为 SourceGraphic 进入滤镜
        '<rect width="100%" height="100%" fill="rgb(' + tint.map((v) => Math.round(v * 255)).join(',') + ')" filter="url(#n)"/>' +
        '</svg>';
      return 'data:image/svg+xml;base64,' + btoa(svg);
    }
    // A value in a font setting is either one of the four built-in keys above, or a real
    // font family name picked from the machine. The browser cannot enumerate installed
    // fonts (and this host denies every permission, so `queryLocalFonts()` is unavailable),
    // so the picker offers a curated candidate list filtered by measurement: we render the
    // same text twice, once in the generic fallback and once with the candidate first in
    // the stack; if advance widths differ, the candidate is genuinely installed. Anything
    // outside the list can still be typed in by hand and is used as-is.
    const FONT_CANDIDATES = [
      // Windows 中文
      "Microsoft YaHei", "Microsoft YaHei UI", "微软雅黑", "DengXian", "等线", "SimSun", "宋体",
      "SimHei", "黑体", "KaiTi", "楷体", "FangSong", "仿宋", "NSimSun", "新宋体",
      "Source Han Sans SC", "思源黑体", "Source Han Serif SC", "思源宋体",
      "LXGW WenKai", "霞鹜文楷", "HarmonyOS Sans SC", "MiSans", "OPPO Sans", "Alibaba PuHuiTi",
      // macOS 中文
      "PingFang SC", "苹方", "Hiragino Sans GB", "STHeiti", "Songti SC", "Heiti SC",
      // 英文界面
      "Segoe UI", "Microsoft JhengHei", "Arial", "Helvetica Neue", "Inter", "Roboto",
      "Noto Sans", "Segoe UI Variable", "system-ui",
      // 等宽 / 代码
      "Cascadia Code", "Cascadia Mono", "Consolas", "JetBrains Mono", "Fira Code",
      "Source Code Pro", "IBM Plex Mono", "Roboto Mono", "SF Mono", "Menlo", "Monaco",
      "Courier New", "Lucida Console", "DejaVu Sans Mono", "Victor Mono", "Maple Mono"
    ];
    // Measurement needs a probe span. Two different reference glyph widths (iiii / mmmm)
    // make it far less likely that a candidate merely inherits the fallback's metrics.
    const FONT_PROBE = ["mmmmmmmmmmlli", "iiiiiiiiiiii"];
    const FONT_BASELINES = {
      monospace: "monospace",
      serif: "serif",
      "sans-serif": "sans-serif"
    };
    let detectedFonts = null;
    // 宿主路由返回的真实系统字体清单。启动时拉一次；在它到达之前（或路由不可用时）
    // 仍用下面的实测候选表兜底，下拉永远不会空。
    let hostFonts = [];
    let hostFontsAsked = false;
    const fontSubscribers = new Set();
    function loadHostFonts() {
      if (hostFontsAsked) return;
      hostFontsAsked = true;
      fetch("/api/dsh-eye-comfort/fonts", { credentials: "same-origin", cache: "no-cache" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.fonts)) return;
          hostFonts = data.fonts.filter((f) => typeof f === "string" && f.trim()).map((f) => f.trim());
          for (const notify of fontSubscribers) { try { notify(); } catch {} }
        })
        .catch(() => {});
    }
    function installedFontList() {
      if (hostFonts.length) return hostFonts;
      return detectInstalledFonts();
    }
    function detectInstalledFonts() {
      if (detectedFonts) return detectedFonts;
      // 测量需要真实布局；面板可能在 body 就绪前渲染，拿不到就退化为只用内置项，
      // 不要让字体探测把整个设置页拖崩。
      if (!document.body) return (detectedFonts = []);
      const span = document.createElement("span");
      span.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;font-size:72px;white-space:nowrap;";
      document.body.appendChild(span);
      try {
        const widthOf = (family, baseline) => {
          span.style.fontFamily = `"${family}", ${baseline}`;
          return FONT_PROBE.map((t) => { span.textContent = t; return span.getBoundingClientRect().width; }).join("|");
        };
        const base = {};
        for (const [k, v] of Object.entries(FONT_BASELINES)) base[k] = widthOf("__dca_probe__", v);
        const available = [];
        for (const family of FONT_CANDIDATES) {
          const installed = Object.entries(FONT_BASELINES).some(([k, v]) => widthOf(family, v) !== base[k]);
          if (installed) available.push(family);
        }
        detectedFonts = available;
        return available;
      } finally {
        span.remove();
      }
    }
    // Resolve a stored font setting to a CSS font-family value. Built-in keys keep their
    // curated stacks; a picked/typed family is quoted and keeps the same fallback class so
    // a missing glyph still lands on something sensible.
    function fontCss(value, fallback) {
      if (FONTS[value]) return FONTS[value];
      const name = typeof value === "string" ? value.trim() : "";
      if (!name) return FONTS[fallback];
      // "inherit" 不是字体族，拼成 `"Name", inherit` 是非法 CSS，整条声明会被丢弃。
      // 内容字体默认就是 inherit，这里换成真实字体族兜底。
      const tail = FONTS[fallback] === "inherit" ? FONTS.system : FONTS[fallback];
      return `"${name.replace(/"/g, "")}", ${tail}`;
    }
    // Eye-comfort presets for light mode.
    // `link` 是 token 层的原始链接色；`linkLight` 是"实际画在界面上的链接色"（见
    // linkToneOf）：冷色主题沿用自己的 link，暖纸／绿纸必须换色相——米纸的 link h81 与
    // 正文 h79 只差 2°，豆沙绿 h134 对 132°，直接用就成了"正文的另一档深浅"。 Each one keeps its own accent and link so the whole
    // surface stays in one temperature — a warm paper background with a blue accent reads as
    // two different palettes fighting. Every entry is tuned against the same targets: body text
    // ≥10:1, links (which carry file references — a path and a line number) ≥7:1 so a clickable
    // file never reads as dimmed prose, sidebar one clear step below the transcript, and the New
    // Session button lighter than the column it sits on. Dark mode is deliberately not themed
    // here. `accent` is deliberately NOT used for link text: it is the marker colour and sits at
    // 2.5–4.7:1, which is fine for a dot or an outline and unreadable as a filename.
    const THEMES = {
      warm: {
        label: "暖白",
        content: "#F1F1EE", foreground: "#262F3C", accent: BLUE, link: "#244F94", linkLight: "#244F94",
        base: "#F9FAFB", platform: "#F7F8FB", previewBg: "#F9FAFB",
        sidebarGlassFill: "#E8E8E5", sidebarButton: "#F2F1EE", sidebarButtonHover: "#F7F6F3",
        sidebarButtonBorder: "#D5D4CE", sidebarSelected: "#DEDEDA", sidebarRowHover: "#EFEEEB", bubble: "#F7F7F6", inputFill: "#F6F6F4"
      },
      paper: {
        label: "米纸",
        content: "#F2EBDC", foreground: "#3B3226", accent: "#8A6A2A", link: "#624813", linkLight: "#4A3B6B",
        base: "#F6F1E7", platform: "#F4EFE4", previewBg: "#F2EBDC",
        sidebarGlassFill: "#EAE2D4", sidebarButton: "#F3ECDE", sidebarButtonHover: "#FBF6EC",
        sidebarButtonBorder: "#D8CDBA", sidebarSelected: "#DED3C0", sidebarRowHover: "#F2EBDF", bubble: "#F7F2E8", inputFill: "#F6F1E6"
      },
      green: {
        label: "豆沙绿",
        // 用户反馈链：豆沙绿「有点刺眼」→ 改淡后「并不绿」→「五套里只有米纸最柔和」
        // → 按色温一致性改成暖调豆沙 → 又指出「豆沙绿和米纸颜色相差不是很大」。
        // 最后这条是对的，而且能量化：0.3.15 的纸面 #ECEADC（L*92.5 / C*7.2 / h103.8）
        // 与米纸 #F2EBDC 的 ΔE00 只有 2.4，低于刚可察觉阈（约 2.3–3）——两套主题在纸面
        // 这一层几乎是同一个颜色，差别只剩强调色与正文（正文 ΔE00 也只有 5.4）。
        //
        // 根因是 0.3.15 为了「柔和」把色相从 144° 压到 104°：LCh 的 90° 是黄、180° 是绿，
        // 104° 只比米纸的 91° 绿一点点，于是「豆沙绿」落成了「米纸的暗一档版本」。
        // 刺眼其实与彩度无关（米纸 C* 8.1 最高却不刺），只与「高亮度 + 绿色波段」有关。
        //
        // 本版把色相放回 129°：G 通道比 R 高 6、比 B 高 12，缩略尺度上就能读出绿；
        // 同时把明度从 92.5 降到 90.9 —— 浅绿落在人眼最敏感的光谱段（约 555nm），
        // 压低明度比压彩色更能去掉「刺眼」。色温 6382K 与米纸 6137K 同档，冷暖不打架。
        // 实测：纸面 ΔE00 对米纸 6.1、对暖白 6.0（都是一眼不同），对旧豆沙绿 3.7；
        // 层次 侧栏 87.6 < 纸面 90.9 < 气泡 94.2；正文 10.45:1、链接 7.08:1
        // （朝链接蓝混 .7 后 4.76:1）、强调 4.03:1，均达标。
        content: "#E1E7DB", foreground: "#2C3228", accent: "#4A7A3A", link: "#2F5223", linkLight: "#24596B",
        base: "#E8EDE3", platform: "#E5EAE0", previewBg: "#E1E7DB",
        sidebarGlassFill: "#D7DED1", sidebarButton: "#DDE3D7", sidebarButtonHover: "#ECF1E8",
        sidebarButtonBorder: "#CDD4C7", sidebarSelected: "#D2D9CC", sidebarRowHover: "#DDE3D7", bubble: "#EBF0E6", inputFill: "#E4EADF"
      },
      mist: {
        label: "雾蓝",
        // 用户反馈「雾蓝这个主题有点刺眼」。量化看，问题不在"蓝"而在"亮"：雾蓝纸面
        // #ECEFF4 的 L* 94.4 是五套里第二高（暖白 95.1，米纸 93.2、石墨 93.4 都在它下面），
        // 而同一亮度下冷色比暖色更"亮"——蓝色通道主导的近白最容易被读成刺眼。
        //
        // 只动亮度、不动色相：L* 94.4 → 91.0（Y 0.858 → 0.782，纸面亮度约降 9%），
        // 色相 268° → 260°（去掉一点紫味，回到正蓝），彩度 2.8 → 4.2（压暗后不提彩度
        // 会读成"灰"而不是"雾蓝"）。色温 6740K，仍是最冷的一套。
        //
        // 纸面一暗，深色字反而更清楚，但链接和强调要先深一档才不掉档：
        // link #1D5085 → #1B4A7C（对纸面 7.21:1，混蓝后 4.64:1），
        // accent #2F7BC4 → #2C74BB（对纸面 3.87:1，spinner 混前景后 5.01:1）。
        // 顺带拉开与另两套中性主题的重叠：对暖白 ΔE00 4.1 → 5.8、对石墨 3.7 → 5.2。
        // 层次 侧栏 87.8 < 纸面 91.0 < 气泡 94.3；正文 10.49:1。
        content: "#E0E6ED", foreground: "#293139", accent: "#2C74BB", link: "#1B4A7C", linkLight: "#1B4A7C",
        base: "#E8EDF2", platform: "#E5EAF0", previewBg: "#E0E6ED",
        sidebarGlassFill: "#D6DDE5", sidebarButton: "#DCE3EA", sidebarButtonHover: "#ECF1F5",
        sidebarButtonBorder: "#CCD3DB", sidebarSelected: "#D1D8E0", sidebarRowHover: "#DCE3EA", bubble: "#EBEFF4", inputFill: "#E4E9EF"
      },
      stone: {
        label: "石墨",
        content: "#EDECEA", foreground: "#2E2E2C", accent: "#4A6B8A", link: "#354F6A", linkLight: "#354F6A",
        base: "#F3F2F1", platform: "#F0EFED", previewBg: "#EDECEA",
        sidebarGlassFill: "#E4E3E1", sidebarButton: "#EEEDEB", sidebarButtonHover: "#F8F7F6",
        sidebarButtonBorder: "#D1CFCC", sidebarSelected: "#DAD8D5", sidebarRowHover: "#ECEBE9", bubble: "#F3F3F1", inputFill: "#F2F1F0"
      }
    };
    const THEME_IDS = Object.keys(THEMES);
    function themeOf(s) { return THEMES[s.theme] || THEMES.warm; }
    // 深色侧的主题包。之前深色只有一套写死的蓝灰，夜里没有选择。形状与浅色对齐：
    // background 是 DSH 的 --dsw-alias-bg-base，base 是"最深一档"（内容区/侧栏/菜单/
    // 代码块的基准，也就是原先满篇硬编码的 #1B2028），foreground 是正文，accent 是强调色。
    // 其余表面（layer、气泡、输入框、悬停、边框）都从 background 朝 foreground 混出来，
    // 所以只要这三个值定得成体系，整套深色就自洽。
    const DARK_THEMES = {
      slate: {label: "蓝灰", background: "#2A313A", base: "#1B2028", foreground: "#DAD6D6", accent: "#339CFF"},
      black: {label: "纯黑", background: "#121416", base: "#090A0B", foreground: "#D3D6D9", accent: "#5AA9FF"},
      nord: {label: "北境", background: "#2E3440", base: "#21262F", foreground: "#D8DEE9", accent: "#88C0D0"},
      ember: {label: "暖褐", background: "#2B2721", base: "#1C1915", foreground: "#E2D8C7", accent: "#D79B54"},
      pine: {label: "墨绿", background: "#1F2823", base: "#141C18", foreground: "#D0DDD4", accent: "#6FB98F"}
    };
    const DARK_IDS = Object.keys(DARK_THEMES);
    function darkOf(s) { return DARK_THEMES[s.darkTheme] || DARK_THEMES.slate; }
    // Picking a theme seeds the stored light palette with that theme's colours. Everything
    // downstream keeps reading s.light, so a theme switch and a manual colour edit travel the
    // same path — no second source of truth to keep in sync.
    function applyTheme(s, id) {
      const t = THEMES[id] || THEMES.warm;
      return {
        theme: id in THEMES ? id : "warm",
        light: {...s.light, accent: t.accent, background: t.content, foreground: t.foreground},
        accent: t.accent, foreground: t.foreground
      };
    }
    // 深色主题同理：写进 s.dark，下游继续读同一份存档，切换与手改走同一条路径。
    // 链接色。浅色：朝链接蓝混 .7，再朝前景压 .12（保证在比纸面暗一档的卡片上也过 AA）。
    // 深色：直接用主题强调色，只在必要时朝白提亮到够对比——旧做法是"朝白混 .62"，
    // 那会把链接洗成正文色：实测北境/暖褐/墨绿对正文的 ΔE00 只剩 7.3 / 5.4 / 5.8，
    // 用户反馈"深色下其它主题色还是区分不清链接"。直接用强调色则有 17–26，色相明确。
    function linkToneOf(s, scheme, palette, theme, ct) {
      // 浅色：每套主题一个专属链接色（linkLight），不再把五套都收敛到同一个蓝。
      // 为什么不直接用 theme.link：米纸 #624813 与正文 #3B3226 色相只差 2°（ΔE00 15）、
      // 豆沙绿 #2F5223 对 #2C3228 只差 2°（ΔE00 17）——那就是"正文的另一档深浅"。
      // 为什么不用两者对半混：棕＋蓝在 Lab 里互相消色，米纸会掉成 C* 15 的灰。
      // 现在的取值：冷色主题沿用自身 link；米纸用深靛 #4A3B6B（对正文色相差 227°）、
      // 豆沙绿用墨青 #24596B（差 102°），卡片对比 5.69–7.72，全部高于 AA。
      if (scheme === "light") return theme.linkLight || mix(mix(theme.link, LINK_BLUE, .7), palette.foreground, .12);
      // 链接会落在正文区/侧栏底色上（不只是卡片），所以按页面底色量 7:1；
      // 卡片比底色更亮，按底色达标后卡片上自然也在 AA 以上。
      return toneTo(palette.accent, "#FFFFFF", palette.background, 7.0);
    }
    function applyDarkTheme(s, id) {
      const t = DARK_THEMES[id] || DARK_THEMES.slate;
      return {
        darkTheme: id in DARK_THEMES ? id : "slate",
        dark: {...s.dark, accent: t.accent, background: t.background, foreground: t.foreground}
      };
    }
    const listeners = new Set();
    // The transcript/composer width belongs to DSH: ConversationWidthControls owns
    // `dsh.conversation.contentWidth` and republishes an inline --dsh-chat-user-width from its
    // ResizeObserver, resolving it against the column width. That value is clamped to
    // [640, columnWidth - 176], so a request larger than the window can hold is reduced, and a
    // stylesheet rule can never win against the inline write. Hence: persist the preference,
    // then set the same inline variable for immediate effect.
    const WIDTH_KEY = "dsh.conversation.contentWidth";
    function applyContentWidth(px) {
      try { localStorage.setItem(WIDTH_KEY, String(px)); } catch {}
      for (const el of document.querySelectorAll('[class*="an3WzG_body"],[class*="an3WzG_root"]')) {
        el.style.setProperty("--dsh-chat-user-width", px + "px");
      }
      // The embedded transcript hard-codes its own min(100% - 32px, 920px), so it needs the
      // resolved width rather than the user-facing variable.
      for (const el of document.querySelectorAll('[class*="an3WzG_embeddedBody"]')) {
        el.style.setProperty("--dsh-chat-content-width", `min(${px}px, calc(100% - 32px))`);
      }
    }
    function hex(value, fallback) { return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toUpperCase() : fallback; }
    function clamp(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback; }
    // 定时切换用的时间设置（"HH:MM"）与"一天中的第几分钟"。
    function timeValue(value, fallback) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "") ? value : fallback; }
    function minutesOf(value) { const [hh, mm] = timeValue(value, "00:00").split(":").map(Number); return hh * 60 + mm; }
    // WCAG 相对亮度与对比度。语法高亮必须按"实际代码块底色"逐个校验，不能靠眼估：
    // 同一个颜色落在米纸和雾蓝上，对比度差 0.8 左右，一处过 AA 另一处就不过。
    function luminance(color) {
      const [r, g, b] = [1, 3, 5].map(i => {
        const c = parseInt(color.slice(i, i + 2), 16) / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function contrastOf(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
    // 把 DSH 那套通用着色器配色拉回主题：先朝主题前景混一档（色温跟着主题走），
    // 没越过目标对比度就继续压／提，最多到 60%——再往上就丢掉色相辨识度了。
    function toneTo(base, fg, bg, target) {
      // 从"几乎不动"开始扫：先满足对比度的那一档保留最多色相。不能假设对比度随混合比例
      // 单调上升——深色下把浅蓝朝浅灰混，中途会先掉下去再上来（实测 4.48 → 4.42 → 4.55），
      // 单向往上找会以为无解。
      let best = base, bestK = contrastOf(base, bg);
      for (let r = 0.04; r <= 1.0001; r += 0.04) {
        const out = mix(base, fg, r), k = contrastOf(out, bg);
        if (k >= target) return out;
        if (k > bestK) { bestK = k; best = out; }
      }
      return best;
    }
    // 给十六进制颜色加 alpha，用于让纸张纹理从半透明遮罩下透出来。
    function hexA(color, alpha) {
      const a = Math.max(0, Math.min(1, alpha));
      const v = Math.round(a * 255).toString(16).padStart(2, "0").toUpperCase();
      return hex(color, "#FFFFFF") + v;
    }
    // A font setting is either a built-in key or a family name the user picked/typed.
    // Reject only shapes that cannot be a family or would break out of the CSS string.
    function fontValue(raw, fallback) {
      if (typeof raw !== "string") return fallback;
      if (FONTS[raw]) return raw;
      const name = raw.trim().slice(0, 80);
      if (!name || /[;{}\\<>]/.test(name) || /["']/.test(name)) return fallback;
      return name;
    }
    function sanitize(raw) {
      const x = raw && typeof raw === "object" ? raw : {};
      const palette = (v, base) => ({accent: hex(v?.accent, base.accent), background: hex(v?.background, base.background), foreground: hex(v?.foreground, base.foreground), uiFont:fontValue(v?.uiFont, "system"), contentFont:fontValue(v?.contentFont, "inherit"), codeFont:fontValue(v?.codeFont, "system")});
      return {
        mode: ["system", "light", "dark", "schedule"].includes(x.mode) ? x.mode : DEFAULT.mode,
        separate: !!x.separate,
        theme: THEME_IDS.includes(x.theme) ? x.theme : "warm",
        darkTheme: DARK_IDS.includes(x.darkTheme) ? x.darkTheme : "slate",
        accent: hex(x.accent, BLUE), background: hex(x.background, DEFAULT.background), foreground: hex(x.foreground, DEFAULT.foreground),
        light: palette(x.light, DEFAULT.light), dark: palette(x.dark, DEFAULT.dark),
        uiFont: fontValue(x.uiFont, "system"), contentFont: fontValue(x.contentFont, "inherit"), codeFont: fontValue(x.codeFont, "system"),
        uiSize: clamp(x.uiSize, 11, 20, 14), codeSize: clamp(x.codeSize, 10, 20, 12),
        contentWidth: clamp(x.contentWidth, 680, 1400, 920),
        fontStyle: ["normal", "compact", "comfortable"].includes(x.fontStyle) ? x.fontStyle : "normal",
        contentStyle: ["normal", "compact", "comfortable"].includes(x.contentStyle) ? x.contentStyle : "normal",
        codeStyle: ["normal", "compact", "comfortable"].includes(x.codeStyle) ? x.codeStyle : "normal",
        contrast: clamp(x.contrast, 0, 100, 40),
        reducedMotion: ["system", "on", "off"].includes(x.reducedMotion) ? x.reducedMotion : "system",
        paper: !!x.paper,
        paperStrength: clamp(x.paperStrength, 1, 100, 60),
        colorblind: !!x.colorblind,
        lightAt: timeValue(x.lightAt, DEFAULT.lightAt), darkAt: timeValue(x.darkAt, DEFAULT.darkAt)
      };
    }
    let state, rawState = null;
    try { rawState = JSON.parse(localStorage.getItem(KEY)); state = sanitize(rawState); } catch { state = sanitize(null); }
    // 主题色板是「点选时播种进 s.light」的，之后所有下游都读存档 —— 只改 THEMES 不会让
    // 老存档跟着变。重做豆沙绿后，老存档会继续沿用旧的暖黄纸面与暖褐正文，用户就会看到
    // 「改了但没生效」。这里只在存档与旧豆沙绿三项完全一致（说明没手改过颜色）时重新播种，
    // 任何动过颜色的存档一律不动。
    // 主题色板是「点选时播种进 s.light」的，之后所有下游都读存档 —— 只改 THEMES 不会让
    // 老存档跟着变，用户就会看到「改了但没生效」。这里按主题登记上一版的旧色板：存档与旧值
    // 三项完全一致（说明没手改过颜色）时重新播种，任何动过颜色的存档一律不动。
    const LEGACY_PALETTES = {
      green: {accent: "#4A7A3A", background: "#ECEADC", foreground: "#33301F"},
      mist: {accent: "#2F7BC4", background: "#ECEFF4", foreground: "#2A3138"}
    };
    // 深色主题包是这一版新增的：老存档没有 darkTheme 字段，按深色纸面颜色反查回对应的包，
    // 否则会渲染成"某主题的纸面 + 蓝灰的最深一档"这种混搭（纸面和内容区对不上）。
    if (rawState && typeof rawState === "object" && !("darkTheme" in rawState)) {
      const guess = DARK_IDS.find(id => DARK_THEMES[id].background === state.dark.background);
      if (guess) state.darkTheme = guess;
    }
    const legacy = LEGACY_PALETTES[state.theme];
    if (legacy && Object.keys(legacy).every(k => state.light[k] === legacy[k])) {
      const t = THEMES[state.theme];
      state.light = {...state.light, accent: t.accent, background: t.content, foreground: t.foreground};
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    }
    function setState(next) {
      state = sanitize(next);
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
      listeners.forEach(fn => fn());
    }
    const persistSoon = (function () {
      let timer = null, pending = null;
      const flush = () => { timer = null; if (pending !== null) { try { localStorage.setItem(KEY, JSON.stringify(pending)); } catch {} pending = null; } };
      return next => { pending = sanitize(next); if (!timer) timer = setTimeout(flush, 200); };
    })();
    function useSettings() {
      const [value, update] = React.useState(state);
      React.useEffect(() => { const fn = () => update(state); listeners.add(fn); return () => listeners.delete(fn); }, []);
      const patch = (p, lazy) => {
        const next = {...state, ...p};
        state = sanitize(next);
        if (lazy) persistSoon(next); else { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
        listeners.forEach(fn => fn());
      };
      return [value, patch];
    }
    function mix(a, b, ratio) {
      const q = Math.max(0, Math.min(1, ratio));
      return "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i+2), 16)*(1-q) + parseInt(b.slice(i, i+2), 16)*q).toString(16).padStart(2, "0")).join("").toUpperCase();
    }
    function activePalette(s, scheme) {
      // Light and dark each keep their own palette. Selecting a theme seeds s.light and
      // s.dark.dark with that theme's colours (see applyTheme), so everything downstream —
      // the token layer, the user's colour edits, and the paint rules — keeps working on the
      // same two stored palettes. Reading top-level fields directly would hand light mode the
      // dark background, so the split is not optional.
      return s[scheme];
    }
    function themeTokens(s) {
      const theme = themeOf(s);
      // Selecting a theme writes its palette into s.light (see applyTheme), so this reads the
      // theme's colours through the normal path — no special-casing for edited colours, and the
      // background stays the theme's flat base rather than the stored swatch.
      const light = {...activePalette(s, "light"), background: theme.base};
      const dark = activePalette(s, "dark");
      // 深色侧的"最深一档"来自所选深色主题（原来是硬编码的 #1B2028）。
      const dk = darkOf(s).base;
      const pair = fn => ({light: fn(light, "light"), dark: fn(dark, "dark")});
      // The contrast slider used to reach the dark palette only, with coefficients so small the
      // whole 0→100 sweep moved a layer by 1–3% luminance — invisible. Both schemes now derive
      // their surfaces from it: light mixes toward the foreground (surfaces darken), dark mixes
      // toward its foreground while the base itself deepens. Scales are chosen so the extremes
      // stay readable (light keeps ≥8:1 body contrast, dark ≥6:1).
      const t = clamp(s.contrast, 0, 100, 40) / 100;
      const level = (p, scheme, tier) => {
        if (scheme === "light") {
          // Surfaces sit below the transcript colour, so "more contrast" means darker steps.
          const step = [[.015, .075], [.030, .105], [.050, .140], [.045, .130]][tier - 1];
          return mix(theme.content, p.foreground, step[0] + t * step[1]);
        }
        const step = [[.030, .040], [.050, .065], [.085, .085], [.090, .080]][tier - 1];
        return mix(p.background, p.foreground, step[0] + t * step[1]);
      };
      return {
        "--dsw-alias-brand-primary": pair(p => p.accent),
        "--dsw-alias-brand-primary-new-colorprimary-new-color": pair(p => p.accent),
        "--dsw-alias-brand-text": pair(p => p.accent),
        "--dsw-alias-bg-base": pair(p => p.background),
        "--dsw-alias-bg-layer-1": pair((p, scheme) => level(p, scheme, 1)),
        "--dsw-alias-bg-layer-2": pair((p, scheme) => level(p, scheme, 2)),
        "--dsw-alias-bg-layer-3": pair((p, scheme) => level(p, scheme, 3)),
        "--dsw-alias-bg-module-platform": pair((p, scheme) => scheme === "light" ? theme.platform : mix(p.background, p.foreground, .07)),
        // 代码块底色。浅色沿用 layer-4；深色不能再用 layer-4：那里它只比内容区亮
        // ΔL 2.20%、比普通卡片只高 1.15%，代码块看起来就是一块"稍微亮一点的卡片"，
        // 和正文区几乎分不开（用户反馈"深色下代码块颜色不明显"）。
        // 深色基准取内容区实际底色 mix(#1B2028, fg, .12)（与 applyExtras 的 darkContent 同式），
        // 在其上朝前景混 .16 —— 实测 ΔL 4.32%（vs 内容区）、3.27%（vs 卡片），
        // 仍低于控件层（相差 2.12%），层次保持单调递增。
        "--dsw-alias-markdown-code-block": pair((p, scheme) => scheme === "light"
          ? level(p, scheme, 4)
          : mix(mix(dk, p.foreground, .12), p.foreground, .16)),
        "--dsw-alias-markdown-code-block-banner": pair((p, scheme) => scheme === "light"
          ? level(p, scheme, 4)
          : mix(mix(dk, p.foreground, .12), p.foreground, .16)),
        // 链接色。浅色用主题的 link（都是深色，专为浅色纸面挑的）；深色不能用它：
        // 那五个 link 色在深色底上的对比度实测只有 1.42–1.51，文件链接（pFy1Ka_fileLink）
        // 是 13px 带下划线的密集小字，几乎读不出来（用户反馈"文件链接块还是绿色看不清"）。
        // DSH 原生深色用的是 --dsw-static-deepseek-400 (#7AAaff)，说明深色本来就该走亮色。
        // 深色：直接用主题强调色，只在对比不足时朝白提亮到 7.0（按页面底色量）——旧的"朝白混 .62"会把链接
        // 洗成正文色（实测北境/暖褐/墨绿对正文的 ΔE00 只剩 6–7，用户反馈"深色下区分不清"）。
        // 浅色：每套主题一个专属链接色（theme.linkLight）。不能直接用 theme.link ——
        // 米纸 #624813 与正文 #3B3226 色相只差 2°、豆沙绿 #2F5223 对 #2C3228 同样只差 2°，
        // 那等于"正文的另一档深浅"；而把 link 和链接蓝各半混也救不了：棕＋蓝在 Lab 里
        // 互相消色，米纸会掉成 C* 15 的灰。所以暖纸/绿纸换色相（米纸深靛 #4A3B6B，
        // 对正文色相差 227°；豆沙绿墨青 #24596B，差 102°），冷色主题沿用自己的 link。
        // 实测 vs 纸面 6.13–8.31、vs 卡片 5.69–7.72（全部过 AA）、vs 正文 ΔE00 24–39。
        "--dsw-alias-link": pair((p, scheme) => scheme === "light"
          ? theme.linkLight
          : toneTo(p.accent, "#FFFFFF", p.background, 7.0)),
        // 弹出菜单/下拉列表的表面色（模型选择、命令菜单、右键菜单等共用）。
        // DSH 默认把它写成半透明的固定中性色：--dsw-menu-surface-fill 浅色 #f8f9fa94、
        // 深色 #43454a73，合成到内容区上分别是 #F6F6F6 / #3D4046 —— 在暖色纸面上就是
        // 一块"纯白卡片"，深色下则是一块接近纯黑的板（用户截图反馈）。
        // 这里改为跟随主题的实色：浅色取 theme.bubble（比纸面亮一档、同色温），
        // 深色取比内容区再亮一档的 ui.card。不带 alpha —— 菜单是不透明的浮层，
        // 半透明会让背后正文透上来，反而降低可读性。
        "--dsw-specific-menu": pair((p, scheme) => scheme === "light" ? theme.bubble : mix(mix(dk, p.foreground, .12), p.foreground, .16)),
        // 菜单分组标题「滚动吸顶」时的底色（--dsw-alias-menu-group-header-fill）。
        // DSH 写死成近白 #f8f9faf0（浅色）/ #303136f0（深色），但这一版的菜单面是半透明的
        // --dsw-menu-surface-fill（浅色 rgba(248,249,250,.58)），合成到纸面上是偏纸色的
        // （豆沙绿 #EEF1ED、暖白 #F5F6F5、米纸 #F5F3ED），于是滚动时吸顶的分组标题会
        // 露出一条白带，与菜单本体明显断层（用户截图确认）。
        // 这里按同一合成公式反算等价实色：浅色 = #F8F9FA 以 58% 叠在 theme.content 上；
        // 深色 = #43454A 以 45% 叠在深色内容区上。不带 alpha —— 吸顶时必须完全盖住
        // 从下面滚过去的模型名，半透明会透字。
        "--dsw-alias-menu-group-header-fill": pair((p, scheme) => scheme === "light"
          ? mix("#F8F9FA", theme.content, .42)
          : mix(mix(dk, p.foreground, .16), mix(dk, p.foreground, .12), .55)),
        "--dsw-alias-settings-card-fill": pair((p, scheme) => level(p, scheme, 2)),
        "--dsw-alias-label-primary-foreground": pair((p, scheme) => scheme === "light" ? "#FFFFFF" : mix(p.background, p.foreground, .05)),
        "--dsw-alias-interactive-bg-hover": pair((p, scheme) => scheme === "light" ? "#26314808" : "#FFFFFF10"),
        // 上面那个是半透明版，DSH 另有一个不透明的 `-solid` 变体，专门给圆形小按钮/行做
        // hover 底色（输入框的「+」、工具行的 inspect 按钮、折叠行等 8 处）。它默认是
        // neutral-bluish-75（近白），在暖色纸面上 hover 一下就会闪成一块白斑。
        // 这里按主题色温给一个"比控件再深一档"的实色，与 --dsw-specific-selector 同源。
        "--dsw-alias-interactive-bg-hover-solid": pair((p, scheme) => scheme === "light"
          ? mix(theme.inputFill, theme.foreground, .13)
          : mix(p.background, p.foreground, .24)),
        // The Windows caption overlay is tinted from this token via a hidden probe, and the
        // native overlay cannot carry alpha, so this must stay an opaque colour. The sidebar
        // gets its translucency from the column rule below instead.
        "--dsw-specific-sidebar-fill": pair((p, scheme) => scheme === "light"
          ? theme.sidebarGlassFill
          : dk),
        // These three are "specific" tokens, not alias ones: DSH defaults them to fixed static
        // ramps (a pale blue bubble, bluish nav states), so they ignored the theme and stayed
        // blue on a warm paper background. Derived from the theme instead.
        "--dsw-specific-bubble": pair((p, scheme) => scheme === "light" ? theme.bubble : mix(p.background, p.foreground, .1)),
        "--dsw-specific-bubble-highlight": pair((p, scheme) => scheme === "light" ? theme.bubble : mix(p.background, p.foreground, .16)),
        // 选中态用比侧栏底色深一档的实色，不再依赖半透明叠加：设置页导航块是叠在
        // AnXs9G_panel 上的，而那个面板底色与侧栏只差 2%（ui.card 由 foreground 混 6% 得来），
        // 半透明的选中色叠上去后实测只有 1.03:1 / ΔL 2.2%，肉眼几乎分不出。
        // 0.12 是实测定下的档位：五套主题 ΔL≈20%，清楚可辨但不至于变成一块灰。
        // 深色下不能写死色值：之前固定 #3A4149，而面板底色是 level(p,scheme,2)
        // （随对比度滑块移动，默认档约 #373E46），两者逐通道只差 ≈3，选中块几乎不可见
        // （用户截图确认）。改为「在面板当前底色上朝前景色混固定比例」，面板动选中块跟着动，
        // 差距始终恒定：hover .07（≈9/通道，隐约可辨），active .14（≈20/通道，清楚可辨）。
        // 选中态：浅色改成「侧栏底色 + 主题强调色 14%」，不再用 sidebarSelected 叠前景。
        // 旧的 mix(sidebarSelected, fg, .12) 是两步叠加（sidebarSelected 本身已比侧栏深一档，
        // 再压 12%），实测与侧栏的 ΔL* 达到 9.0–12.1，米纸那块深褐色的板就是它
        // （用户反馈"选中颜色太深"）。改为强调色淡染后五套统一落在 ΔL* 4.5–6.3，
        // 既看得出选中、又带主题色，且不再是统一的褐灰。
        "--dsw-specific-sidebar-nav-item-active": pair((p, scheme) => scheme === "light" ? mix(theme.sidebarGlassFill, theme.accent, .14) : mix(level(p, scheme, 2), p.foreground, .14)),
        "--dsw-specific-sidebar-nav-item-hover": pair((p, scheme) => scheme === "light" ? theme.sidebarRowHover : mix(level(p, scheme, 2), p.foreground, .07)),
        // The composer card, approval/question cards, attachment chips and the image viewer all
        // paint from this one token, and DSH defaults it to static pure white. On a warm theme
        // that white card is the brightest thing on screen. Follows the theme's bubble shade, so
        // the input sits on the same surface family as the transcript behind it.
        "--dsw-specific-input-major": pair((p, scheme) => scheme === "light" ? theme.inputFill : mix(p.background, p.foreground, .14)),
        // 输入框左下角的「+」和圆角小按钮（GRgSLq_add / fD5ZVa_roundButton）用这个 token，
        // DSH 默认是 neutral-bluish-60（接近纯白）。在暖色纸面上它是一块刺眼的白斑，
        // 和输入卡片本身不在一个色系。改成比输入卡片再深一档，读作"卡片上的控件"；
        // 0.07 是渲染对比后定的：能看出是个可点的圆，又不至于变成深色按钮。
        "--dsw-specific-selector": pair((p, scheme) => scheme === "light"
          ? mix(theme.inputFill, theme.foreground, .07)
          : mix(p.background, p.foreground, .18)),
        // Elevated buttons (the sidebar's New Session) sit on the sidebar surface, so their
        // fill has to follow that surface rather than be a free-standing neutral.
        "--dsw-alias-button-elevated-fill": pair((p, scheme) => scheme === "light"
          ? theme.sidebarButton
          : "#262D36"),
        // Hover stays in the same family one step deeper — a jump to pure white reads as a
        // different component sitting on the sidebar.
        "--dsw-alias-button-floating-hover": pair((p, scheme) => scheme === "light"
          ? theme.sidebarButtonHover
          : "#2E363F"),
        // Keycap badges (the Ctrl+N hint that fades in on hover) default to a near-white chip,
        // which reads as a stray white block on a tinted surface. Let them inherit the surface.
        "--dsw-alias-tooltip-key-bg": pair(() => "transparent"),
        "--dsw-alias-label-primary": pair(p => p.foreground),
        "--dsw-alias-label-secondary": pair(p => mix(p.foreground, p.background, .34)),
        "--dsw-alias-label-tertiary": pair(p => mix(p.foreground, p.background, .52)),
        // caption/dimmed were left to their DSH defaults, which resolve to the static bluish ramp
        // (neutral-bluish-400 = #ADB2B8). The turn-preview body text uses caption, so on a warm
        // theme it stayed blue-grey — and at 1.9:1 against the card it was barely legible, not
        // just off-hue. .34 lands at 4.3–4.6:1, which is the AA threshold, while staying
        // visibly quieter than the header line.
        "--dsw-alias-label-caption": pair(p => mix(p.foreground, p.background, .34)),
        "--dsw-alias-label-dimmed": pair(p => mix(p.foreground, p.background, .58)),
        // Disabled/placeholder text keeps its quiet relationship to the palette. Not touched:
        // label-primary-inverted and toast-label, which sit on dark surfaces by design and must
        // stay light regardless of the light theme.
        "--dsw-alias-label-primary-dimmed": pair(p => mix(p.foreground, p.background, .58)),
        // The turn-trigger card defaults to --dsw-alias-markdown-code-block, which is derived from
        // the layer scale; pinning it to the theme's bubble keeps the card and its preview panel
        // reading as one surface instead of two slightly different greys.
        "--dsw-alias-turn-trigger-bg": pair((p, scheme) => scheme === "light" ? theme.bubble : mix(p.background, p.foreground, .1)),
        "--dsw-alias-turn-trigger-bg-hover": pair((p, scheme) => scheme === "light" ? theme.sidebarRowHover : mix(p.background, p.foreground, .16)),
        "--dsw-alias-border-l1": pair(p => mix(p.background, p.foreground, .14)),
        "--dsw-alias-border-l2": pair(p => mix(p.background, p.foreground, .12)),
        "--dsw-alias-border-l3": pair((p, scheme) => scheme === "light" ? mix(theme.content, p.foreground, .12) : mix(p.background, p.foreground, .16)),
        // The turn navigator paints its rail marks from border-l4, so this reads as visible chrome
        // rather than a hairline — it has to follow the theme or it stays bluish on warm paper.
        "--dsw-alias-border-l4": pair((p, scheme) => scheme === "light" ? mix(theme.content, p.foreground, .10) : mix(p.background, p.foreground, .1))
      };
    }
    // 判断"当前实际生效的是不是深色"，不能看 prefers-color-scheme。
    // DSH 的 ThemePresenter 会把主题同步给 Electron 的 nativeTheme.themeSource，
    // 于是渲染进程里的 prefers-color-scheme 跟随的是"应用调色板"而非操作系统设置，
    // 两者会不一致（实测：系统深色 + 应用浅色时 matchMedia 仍返回 dark，
    // 插件因此误判成深色，把「护眼主题」一行错误隐藏）。
    // 权威信号是 DSH 写在 body 上的 data-ds-dark-theme（深色时存在、浅色时移除），
    // 它由 snapshot.active.colorScheme 直接决定，正是真正生效的模式。
    function effectiveScheme(s) {
      if (s.mode === "light" || s.mode === "dark") return s.mode;
      // 定时：浅色窗口是 [lightAt, darkAt)，跨零点时窗口折返（例如 22:00 → 06:00）。
      // 时间取自本机时区，不做日出日落估算——那需要经纬度，离线猜不准，
      // 而"我几点上班、几点关灯"本身就是用户最清楚的两件事。
      if (s.mode === "schedule") {
        const now = new Date();
        const cur = now.getHours() * 60 + now.getMinutes();
        const from = minutesOf(s.lightAt), to = minutesOf(s.darkAt);
        if (from === to) return "light";
        const inLight = from < to ? cur >= from && cur < to : cur >= from || cur < to;
        return inLight ? "light" : "dark";
      }
      if (typeof document !== "undefined" && document.body && document.body.hasAttribute("data-ds-dark-theme")) return "dark";
      return "light";
    }
    function applyExtras(s, suppressMotion) {
      const scheme = effectiveScheme(s);
      const fonts = s.separate ? s[scheme] : s;
      const palette = activePalette(s, scheme);
      const theme = themeOf(s);
      // Inline code sits one tier deeper than a code block, and follows the same slider so the
      // setting feels consistent in both schemes.
      //
      // 浅色的行内代码底色从 ΔL*7.8 收到 3.5（mix .12 → .055），可识别性改由"发丝描边 +
      // 等宽字体 + 字号"承担：14px 正文里一块 ΔL* 7.8 的灰既不够淡（不像点缀）又没有边界
      // （不像控件），长度一长、又折行，就只剩"一块污渍"。收淡后底色与纸面对比从 1.23 降到
      // 1.10，而文字对比反而从 8.5 升到 9.5+。对比度滑块仍然有效（0→.035、100→.085）。
      const ct = clamp(s.contrast, 0, 100, 40) / 100;
      const inlineCodeBg = scheme === "light"
        ? mix(theme.content, palette.foreground, .035 + ct * .050)
        : mix(palette.background, palette.foreground, .095 + ct * .095);
      // 描边：底色朝前景一档。实测边/底 1.41:1 —— 只靠这一条，色块就读成"标签"而不是阴影。
      const inlineCodeBorder = mix(inlineCodeBg, palette.foreground, scheme === "light" ? .20 : .16);
      let style = document.getElementById("dca-theme-extras");
      if (!style) { style = document.createElement("style"); style.id = "dca-theme-extras"; document.head.appendChild(style); }
      const density = s.contentStyle === "compact" ? 1.25 : s.contentStyle === "comfortable" ? 1.65 : 1.45;
      // 代码块的字体样式走 DSH 的变量链，而不是 pre/code 上的 line-height：
      //   --dsw-font-markdown-code-block = <size> / calc(19px + var(--dsh-code-font-delta)) <family>
      //   --dsh-code-font-delta = calc(var(--dsh-code-font-size,11px) - 11px)
      // 组件用 `font:` 简写消费它，简写会重置 line-height，写在 pre/code 上的 line-height
      // 一律被覆盖——之前代码字体样式"不生效"就是这个原因。基准行高 19px：
      // 紧凑 17px、常规 19px、舒适 22px，通过 --dsh-code-font-delta 反推字号增量。
      const codeDelta = s.codeStyle === "compact" ? -2 : s.codeStyle === "comfortable" ? 3 : 0;
      // 纸张质感：纹理自带主题底色，所以每个「纸面」要用它自己实际的底色生成一张。
      // 只画在内容区/侧栏/卡片上，绝不动 --dsw-specific-sidebar-fill：
      // 那个 token 由原生标题栏读取，带 alpha 会让窗口边框花掉。
      const paperOn = !!s.paper;
      // 强度 → 亮度抖动幅度（相对值）。实测（Edge 渲染 + 像素统计，P5-P95 色阶差 / 255）：
      //   浅色 amp 0.010≈16、0.016≈26（明显纸纤维）、0.022≈33（较强）、0.030≈42（开始发脏）
      //   深色同样 amp 的可见度只有浅色的 1/3（暗部对绝对抖动不敏感），系数放大 3 倍。
      // 100% 定在「明显但仍是纸」：浅 0.022、深 0.066。默认 60% 约浅 0.013（一眼能看出质感）。
      const paperAmp = paperOn
        ? (clamp(s.paperStrength, 1, 100, 60) / 100) * (scheme === "light" ? 0.022 : 0.066)
        : 0;
      // 每个纸面用自己的底色生成纹理：内容区=theme.content，侧栏=sidebarGlassFill，
      // 卡片/面板=ui.card（随对比度滑块变化）。用错底色会让纹理在表面上显出一块色差。
      const paperFor = (base) => (paperOn ? `url("${paperTexture(base, paperAmp)}")` : "none");
      const codeLinePx = 19 + codeDelta;
      // Frosted sidebar without backdrop-filter: blur would turn the sidebar into a
      // containing block and shift absolutely positioned chrome (the collapse handle).
      // The sidebar paints --dsw-specific-sidebar-fill on both the column and its inner
      // root, so only the transparent column is set here (the inner root stays clear) and
      // the tinted frame gradient underneath is what the user actually sees through it.
      // 深色模式下侧栏与内容区必须拉开层次。之前两者都被钉成同一个 #1B2028：
      // 侧栏（frame/sidebarCol）、内容列（centerCol）、会话根（an3WzG_root）全是这个值，
      // 于是整扇窗口是一整块均匀的深色，侧栏和正文区之间没有任何分界（用户反馈）。
      //
      // 侧栏不能改：--dsw-specific-sidebar-fill 被原生标题栏读取且必须不透明，
      // 侧栏要跟它保持同色，否则窗口边缘会露一条缝。所以把内容区提亮一档。
      // 0.12 是实测定下的档位（CDP 取计算样式换算成对比度/ΔL）：
      //   0.04 → ΔL 0.59%（#23272F，几乎看不出，仓库里已有先例：1% 级色差肉眼无感）
      //   0.10 → ΔL 1.74%／0.12 → ΔL 2.23%／0.14 → ΔL 2.66%
      // 取 0.12：侧栏 vs 内容 ΔL≈2.2%（清楚可辨），同时内容 vs 卡片仍有 0.97%，
      // 卡片不会糊进内容区，控件再往上 1.65%，层次单调递增。
      const darkSidebar = darkOf(s).base;
      const darkContent = mix(darkSidebar, palette.foreground, .12);
      const glass = scheme === "light"
        ? `body [class*="mP3x-q_frame"] { background: ${theme.sidebarGlassFill} !important; }
        body [class*="mP3x-q_sidebarCol"] { background: ${theme.sidebarGlassFill} !important; }`
        : `body [class*="mP3x-q_frame"] { background: ${darkSidebar} !important; }
        body [class*="mP3x-q_sidebarCol"] { background: ${darkSidebar} !important; }
        body [class*="centerCol"]:not([class*="mP3x-q_centerCol"]) { background: ${darkSidebar} !important; }`;
      // The transcript area gets its own cool off-white in light mode. Only the column and the
      // conversation root are repainted: --dsw-alias-bg-base stays on the app base because
      // twenty other modules read it, and repainting the token would tint the whole window.
      // The composer's bottom fade is a gradient built from that token, so it is rebuilt from
      // the same colour here; otherwise a pale band shows under the last message.
      // 深色同样要画：不画的话内容列退回 --dsw-alias-bg-base，与侧栏同色（就是这次的 bug）。
      const content = scheme === "light"
        ? `body [class*="mP3x-q_centerCol"] { background: ${theme.content} !important; }
        body [class*="an3WzG_root"] { background: ${theme.content} !important; }`
        : `body [class*="mP3x-q_centerCol"] { background: ${darkContent} !important; }
        body [class*="an3WzG_root"] { background: ${darkContent} !important; }`;
      // 输入区那条「透明 → 底色」的淡出层（composerSeat）原本用不透明渐变换掉 DSH 的默认实现，
      // 它会盖住背后 root 的纸张纹理，导致输入框左右两侧是纯色（截图里箭头指的位置）。
      // 实测（纯色遮罩盖在有纹理的底上，看 P5-P95 色阶差）：
      //   alpha 1.0 → 0（纹理全被盖住）／0.92 → 1.9（等于没有）／0.75 → 5.1／0.5 → 10／0.25 → 15
      // 开纸质时取 0.45：纹理透出约 11 个色阶，与周围纸面一致，同时淡出遮罩仍然起作用。
      // 关纸质时必须回到完全不透明：这层同时负责遮挡滚动到输入区底下的内容，
      // 半透明会让消息从输入框下方透出来。
      const seatAlpha = paperOn ? .45 : 1;
      const seat = `body [class*="an3WzG_composerSeat"] { background: linear-gradient(180deg, transparent 0px, ${hexA(scheme === "light" ? theme.content : darkContent, seatAlpha)} 36px) !important; }`;
      // 会话进行时，底部主按钮（发送 ↔ 停止）的呼吸。
      // 状态判定：DSH 在「停止」态把图标从发送箭头（path）换成方块（rect）——app.asar 里两个
      // 分支的 DOM 都对过：stop = <rect x=3 y=3 w=10 h=10 rx=3/>、send = <path d="M8.3125 0.98…"/>，
      // 所以 :has(svg rect) 精确命中，不依赖 aria-label 文案；再留一条 aria-label 兜底
      // （中文「停止生成」/ 英文「Stop generating」），防止将来结构变化时静默失效。
      //
      // 上一版只画了 ::after 的 2px 白边（opacity .18→.72），实测在 34px（150% 缩放下 51px）
      // 的按钮上几乎看不见——截图采样：环处只有 #CAD9F8，与按钮本体 #4176E6 只差一档柔和
      // （用户反馈"根本不明显"）。这一版改为画在按钮自身：
      //   · inset 白环 2px → 3px（画在内部，不会被 composer 裁切）
      //   · 外圈柔光 0 → 6px
      //   · 轻微放大 1 → 1.06（必须带上 DSH 自带的 translateY(-2px)，否则按钮会跳回原位）
      const breathe = `body [class*="GRgSLq_primary"]:has(svg rect),
        body [class*="GRgSLq_primary"][aria-label*="停止"],
        body [class*="GRgSLq_primary"][aria-label^="Stop"] {
          animation: dca-breathe 2.4s ease-in-out infinite !important; }
        @keyframes dca-breathe {
          0%, 100% { transform: translateY(-2px) scale(1);
                     box-shadow: inset 0 0 0 2px rgb(255 255 255 / .38), 0 0 0 0 rgb(255 255 255 / 0); }
          50% { transform: translateY(-2px) scale(1.06);
                box-shadow: inset 0 0 0 3px rgb(255 255 255 / .95), 0 0 6px 2px rgb(255 255 255 / .45); } }`;
      // Electron paints the Windows caption buttons as a native overlay tinted from
      // --dsw-specific-sidebar-fill, which is now opaque and matches the sidebar. Keep body
      // on that same tint so the window edge stays one colour; the content column keeps its
      // own rounded white surface and must not be tinted, or the radius shows a seam.
      const chrome = scheme === "light"
        ? `html, body { background: ${theme.sidebarGlassFill} !important; }`
        : `html, body { background: ${darkSidebar} !important; }`;
      // Light-mode surfaces are painted by these scoped rules with !important, so they — not the
      // token layer — are what the user actually sees. They were pinned to constants, which is
      // why the contrast slider appeared to do nothing in light mode: the tokens moved, the
      // painted pixels did not. Each surface is now derived from the same contrast scale.
      //
      // L 必须按模式取：它是一整组「纸面/卡片/控件」色的基色。之前无条件取
      // theme.content（浅色），深色模式下 ui.card / ui.control 全是浅色，
      // 贴到深色 UI 上就是一块块浅色补丁（用户看到的「深色下看不清」就是它）。
      // 深色基色现在取内容区色（darkContent）而不是侧栏色：内容区已提亮一档，
      // 卡片/控件必须继续压在它之上，否则 ui.card 会与新的内容底色撞成同一个值，
      // 「卡片浮在内容区上」的层次又会消失。
      const L = scheme === "light" ? theme.content : darkContent;
      const toward = (fg, a, b) => mix(L, fg, a + ct * b);
      const ui = {
        panel: L,
        card: toward(palette.foreground, .020, .060),
        control: toward(palette.foreground, .050, .140),
        border: toward(palette.foreground, .080, .090),
        rowHover: toward(palette.foreground, .025, .045),
        navActive: toward(palette.foreground, .040, .060),
      };
      // 「已编辑 N 个文件」这类改动卡片：头部（HOHHba_header）不读卡片底色，而是读
      // --changes-fill / --changes-hover 两个局部变量，DSH 把它们写死成 neutral-50/100
      // （中性近白／深灰）。暖色或豆沙绿纸面上，卡头因此是一块冷色块，与周围色温不搭
      // （实测豆沙绿浅色：卡片 #F5F5F5 vs 纸面 #E9EFE4，差 (12,6,17) 且偏冷）。
      // 把填充设为 transparent：卡头让出位置，露出卡片自己的底色和纸张纹理 ——
      // 60px 高的实色卡头会把纹理整块盖住（实测该卡片 sd=0，完全没有颗粒）。
      // hover 时才叠一档同族实色，这正是"移入反馈"该有的样子。
      // 两种模式都套用，否则深色模式下同样是一块盖住纹理的实色。
      // hover 色必须分模式取：toward() 基于 L=theme.content（浅色纸面）计算，
      // 深色模式下会得出 #EFEEEC 这种浅色，贴在深色卡上就是一块亮斑。
      const changesHover = scheme === "light"
        ? toward(palette.foreground, .050, .110)
        : mix(palette.background, palette.foreground, .16);
      const changesCard = `body [class*="HOHHba_card"] {
          --changes-fill: transparent;
          --changes-hover: ${changesHover}; }
        body [class*="HOHHba_header"] { background: var(--changes-fill) !important; }
        body [class*="HOHHba_header"]:hover:not(:disabled), body [class*="HOHHba_header"]:focus-visible { background: var(--changes-hover) !important; }
        /* 卡片左侧的图标方块：DSH 用 neutral-00（纯白）混 50% 透明，在暖色卡面上是一块
           冷色小窗。改用前景色淡淡铺一层，跟着主题走；边框走主题 token，深色模式才不会
           留一道浅色描边。 */
        body [class*="HOHHba_tile"] { background: color-mix(in srgb, ${palette.foreground} 6%, transparent) !important; border-color: var(--dsw-alias-border-l2) !important; }`;

      // ---- 代码语义色：着色器与 diff ---------------------------------------------
      // DSH 把着色器颜色暴露成 body 上的 --shiki-token-*（从 app.asar 确认的九个：
      // constant / string / comment / keyword / parameter / function / string-expression /
      // punctuation / link），默认是一套通用冷色（VS Code 系）。它落在暖纸面上就是一排
      // "外地色"，在白纸上又偏艳。这里逐个朝主题前景调一档，并按"实际代码块底色"校验
      // 对比度——正文级 token 4.5:1、注释 3.6:1（注释在原生里也明显更浅）。
      // 代码块底色与 themeTokens 的 level(4) 同式，保证校验的就是真正显示的那块面。
      const codeBg = scheme === "light"
        ? mix(theme.content, palette.foreground, .045 + ct * .130)
        : mix(darkContent, palette.foreground, .16);
      const syntaxVars = [
        ["constant", "#1C7ED6", "#4DABF7", 4.5],
        ["string", "#2F9E44", "#69DB7C", 4.5],
        ["comment", "#868E96", "#ADB5BD", 3.6],
        ["keyword", "#D6336C", "#FAA2C1", 4.5],
        ["parameter", "#E8590C", "#FFA94D", 4.5],
        ["function", "#6741D9", "#B197FC", 4.5],
        ["string-expression", "#2B8A3E", "#8CE99A", 4.5],
        ["punctuation", "#495057", "#CED4DA", 4.5],
        ["link", "#1971C2", "#74C0FC", 4.5]
      ].map(([name, lightBase, darkBase, target]) =>
        `--shiki-token-${name}: ${toneTo(scheme === "light" ? lightBase : darkBase, palette.foreground, codeBg, target)} !important;`
      ).join(" ");

      // diff：DSH 把"整行底色/行号槽/标记色"与"代码块内的叠加色"都做成了 token
      // （app.asar 确认：file-diff-added-bg/gutter/marker、file-diff-deleted-*、
      // code-diff-added/deleted）。原生是纯绿纯红，落在暖纸面上就是两块"外地色"。
      // 这里按主题纸面调制；色盲友好档把绿/红换成蓝/橙——红绿色觉缺陷在男性里约占 8%，
      // 而 diff 恰好是"必须一眼分清增删"的地方（其它语义色靠图标和文字也能读懂）。
      // 标记色保持饱和（不朝前景混）：原生 #01a241 / #ba2723 本身也只有 3:1 上下，
      // 它是行边上的装饰色条，不是正文。
      const diffAdd = scheme === "light"
        ? (s.colorblind ? "#2F6FD0" : "#2E8B57")
        : (s.colorblind ? "#5AA9FF" : "#3FA96B");
      const diffDel = scheme === "light"
        ? (s.colorblind ? "#C2661A" : "#C0392B")
        : (s.colorblind ? "#FF9F4A" : "#FF6B5E");
      const diffSurface = scheme === "light" ? theme.content : darkContent;
      const diffVars = (scheme === "light"
        ? [["added-bg", mix(diffSurface, diffAdd, .16)], ["added-gutter", mix(diffSurface, diffAdd, .09)],
           ["added-marker", diffAdd],
           ["deleted-bg", mix(diffSurface, diffDel, .14)], ["deleted-gutter", mix(diffSurface, diffDel, .08)],
           ["deleted-marker", diffDel]]
        : [["added-bg", mix(diffSurface, diffAdd, .22)], ["added-gutter", mix(diffSurface, diffAdd, .14)],
           ["added-marker", diffAdd],
           ["deleted-bg", mix(diffSurface, diffDel, .20)], ["deleted-gutter", mix(diffSurface, diffDel, .12)],
           ["deleted-marker", diffDel]]
      ).map(([name, color]) => `--dsw-alias-file-diff-${name}: ${color} !important;`).join(" ")
        + ` --dsw-alias-code-diff-added: ${hexA(diffAdd, scheme === "light" ? .10 : .16)} !important;`
        + ` --dsw-alias-code-diff-deleted: ${hexA(diffDel, scheme === "light" ? .10 : .14)} !important;`;

      // 行内代码 / 标签 / 引用块的底色在 DSH 里是"蓝灰中性"静态色阶，在暖纸面或暖褐深色上
      // 都是一块冷色补丁。改成按主题前景混出来的同族底色；标签与引用比行内代码更淡一档。
      const mdVars = [
        ["inline-code", inlineCodeBg],
        ["tag", mix(diffSurface, palette.foreground, .07)],
        ["citation", mix(diffSurface, palette.foreground, .05)],
        ["code-segment-selected", codeBg],
        ["code-segment-unselected", mix(codeBg, palette.foreground, .06)]
      ].map(([name, color]) => `--dsw-alias-markdown-${name}: ${color} !important;`).join(" ");

      // 链接统一色：正文链接、文件链接、改动卡片里的路径共用同一个"朝链接蓝混过"的颜色。
      const linkTone = linkToneOf(s, scheme, palette, theme, ct);
      // 悬停加深：浅色朝前景压（更深），深色朝白提亮（更亮）——两个方向都是"更醒目"。
      const linkToneDeep = scheme === "light" ? mix(linkTone, palette.foreground, .3) : mix(linkTone, "#FFFFFF", .28);

      style.textContent = `
        /* DSH 的字体不靠继承：ui-theme 的 base.css 留了两个覆盖入口
           （--dsh-font-family-text / --dsh-font-family-code），各组件自己写
           font-family: var(--dsw-font-family)。因此在 body 上直接写 font-family 会被
           子元素自己的变量声明覆盖，看起来毫无变化——必须设这两个变量。 */
        body { --dsh-font-family-text: ${fontCss(fonts.uiFont, "system")}; --dsh-font-family-code: ${fontCss(fonts.codeFont, "system")}; --dsh-code-font-size: ${s.codeSize}px; --dsh-code-font-delta: ${codeDelta}px; font-size: ${s.uiSize}px; line-height: ${s.fontStyle === "compact" ? 1.3 : s.fontStyle === "comfortable" ? 1.65 : 1.45}; --dca-accent: ${palette.accent}; --dca-fg: ${palette.foreground}; ${syntaxVars} ${diffVars} ${mdVars} }
        body [class*="markdown"], body [class*="messageContent"] { font-family: ${fontCss(fonts.contentFont, "inherit")}; line-height: ${density}; }
        /* 兜底：组件若没用 font 简写，这两条也把字号/行高钉住。 */
        body pre, body code, body [class*="codeBlock"] { font-size: ${s.codeSize}px !important; line-height: ${codeLinePx}px !important; }
        body :not(pre) > code {
          background: ${inlineCodeBg} !important;
          color: ${palette.foreground} !important;
          border: 1px solid ${inlineCodeBorder} !important;
          border-radius: 4px;
          padding: 0.12em 0.35em;
          /* 行内代码不该跟代码块同字号：全局规则把 code 钉成 codeSize(12px)，夹在 14px 正文里
             会矮一截、行高不齐。这里按正文的 0.92em 走，pre/codeBlock 仍是 codeSize。 */
          font-size: 0.92em !important;
          line-height: inherit !important;
          /* 长路径折行时，默认 slice 会把底色连成一大块；clone 让每一行各自圆角收边。 */
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
          overflow-wrap: break-word;
        }
        /* 普通正文链接与文件链接统一色系：都用"朝 LINK_BLUE 混"的结果，
           否则同一段文字里两种链接会是两种蓝色，且暖色主题下 brand-primary 对背景
           只有 2.5 左右（暖白 #339CFF vs #F1F1EE = 2.53），低于 AA。 */
        body [class*="markdown"] a:not([class*="fileLink"]) { color: ${linkTone} !important; }
        /* 文件链接必须"看得出是链接"。DSH 给正文文件引用的是"链接色 + 500 字重、无下划线"，
           给改动卡片里的是"继承行色 + 1px 灰色点线"——后者落在我们压暗的行色上就是一段灰字，
           12px 的灰字配灰点线，在暖纸面上与正文完全无异（用户反馈「完全看不出来，以为只是字而已」）。
           统一改成：链接色 + 常驻点线，悬停/聚焦转实线并加深；改动卡片整行的 hover 底色
           作为第二重提示。 */
        /* 注意两件事：(1) DSH 给 ._fileLink_ 与 ._fileMention_ 都写了 text-decoration:none，
           而它们的类选择器权重比我们高，所以下划线必须 !important，否则只剩颜色、没有下划线
           ——上一版就是这样，"链接"看起来仍是字；(2) 正文里带 </> 图标的文件引用是
           fileMention，不是 fileLink，两族都要覆盖。 */
        body [class*="fileLink"], body [class*="fileMention"] {
          color: ${linkTone} !important;
          text-decoration: underline 1px dotted !important;
          text-decoration-color: color-mix(in srgb, ${linkTone} 70%, transparent) !important;
          text-underline-offset: 2px; }
        body [class*="fileLink"] *, body [class*="fileMention"] * { color: inherit !important; }
        body [class*="HOHHba_path"] { color: ${linkTone} !important; text-decoration: underline 1px dotted !important; text-decoration-color: color-mix(in srgb, ${linkTone} 70%, transparent) !important; text-underline-offset: 2px; }
        body [class*="fileLink"]:hover, body [class*="fileLink"]:focus-visible,
        body [class*="fileMention"]:hover, body [class*="fileMention"]:focus-visible,
        body [class*="HOHHba_row"]:hover [class*="HOHHba_path"], body [class*="HOHHba_row"]:focus-visible [class*="HOHHba_path"] { color: ${linkToneDeep} !important; text-decoration-style: solid !important; text-decoration-color: ${linkToneDeep} !important; }
        /* 「交付物」卡片（K5rwea）里的文件名同样是可点的，原生只有 hover 底色，
           静息态是一行 13px 的正文色字。跟上面同一套处理。 */
        body [class*="K5rwea_fileName"] { color: ${linkTone} !important; text-decoration: underline 1px dotted !important; text-decoration-color: color-mix(in srgb, ${linkTone} 70%, transparent) !important; text-underline-offset: 2px; }
        body [class*="K5rwea_file"]:hover [class*="K5rwea_fileName"], body [class*="K5rwea_file"]:focus-visible [class*="K5rwea_fileName"] { color: ${linkToneDeep} !important; text-decoration-style: solid !important; text-decoration-color: ${linkToneDeep} !important; }
        ${scheme === "light" ? `body [class*="AnXs9G_panel"] { background: ${ui.panel} !important; --dsw-alias-bg-layer-2: ${ui.card}; --dsw-alias-bg-layer-3: ${ui.control}; --dsw-alias-settings-card-fill: ${ui.card}; --dsw-alias-border-l2: ${ui.border}; --dsw-alias-border-l3: ${ui.border}; }
        body [class*="AnXs9G_panel"] [class*="dca-card"] { background: ${ui.card} !important; border-color: ${ui.border} !important; }
        body [class*="AnXs9G_panel"] [class*="dca-control"] { background: ${ui.control} !important; border-color: ${ui.border} !important; }
        body [class*="AnXs9G_panel"] [class*="dca-mode"] button { background: ${ui.control} !important; }
        body [class*="AnXs9G_panel"] [class*="dca-button"] { background: ${ui.control} !important; border-color: ${ui.border} !important; }
        body [class*="AnXs9G_panel"] [class*="dca-switch"] { background: ${ui.border} !important; }
        body [class*="AnXs9G_navCell"]:hover { background: ${ui.rowHover} !important; }
        body [class*="AnXs9G_navCell"][class*="AnXs9G_active"] { background: ${ui.navActive} !important; }
        body [class*="xeixwq_split"], body [class*="xeixwq_details"], body [class*="eciBTa_root"], body [class*="eciBTa_ledger"], body [class*="Wd4N7W_root"], body [class*="xeixwq_trajectory"], body [class*="xeixwq_table"], body [class*="xeixwq_assistantOutput"], body [class*="xeixwq_programPanel"], body [class*="xeixwq_programSource"], body [class*="xeixwq_schema"], body [class*="xeixwq_promptDiff"], body [class*="xeixwq_overviewHeading"], body [class*="xeixwq_overviewPreview"], body [class*="xeixwq_historyLoadButton"], body [class*="xeixwq_historyLoadingBar"] { background: ${ui.panel} !important; --dsw-alias-bg-layer-1: ${ui.panel}; --dsw-alias-bg-layer-2: ${ui.card}; --dsw-alias-bg-layer-3: ${ui.control}; --dsw-alias-border-l2: ${ui.border}; --dsw-alias-border-l3: ${ui.border}; --dsw-alias-border-l4: ${ui.border}; }
        body [class*="xeixwq_turnLabel"], body [class*="xeixwq_systemNeutral"], body [class*="xeixwq_compacted"], body [class*="Wd4N7W_search"], body [class*="xeixwq_table"] th { background: ${ui.control} !important; border-color: ${ui.border} !important; }
        body [class*="Wd4N7W_search"]:focus-within { background: ${ui.card} !important; }
        body [class*="HOHHba_card"] { background: ${ui.card} !important; }
        body [class*="HOHHba_row"], body [class*="HOHHba_counts"] { color: ${mix(theme.foreground, theme.content, .34)} !important; }
        body [class*="HOHHba_list"] { border-top-color: var(--dsw-alias-border-l2); }
        body button[class*="_newSession"] { background: ${theme.sidebarButton} !important; border-color: ${theme.sidebarButtonBorder} !important; color: #262F3C !important; }
        body button[class*="_newSession"]:hover { background: ${theme.sidebarButtonHover} !important; }
        body button[class*="_newSession"] * { background: transparent !important; border-color: transparent !important; }
        body button[class*="_newSession"] :is(kbd, [class*="_key_"]) { background: transparent !important; color: ${mix(theme.foreground, theme.content, .22)} !important; }
        /* DSH 更新后整个 UI 包重新构建，类名哈希从 hIlkoa_* 换成 wnFoaW_*（从 app.asar
           导出的完整清单确认：sessionRow/selected/searchResultRow 同属 wnFoaW 模块），
           旧选择器全部失配，选中行回落到原生 var(--dsw-alias-interactive-bg-hover)
           （浅色 3% alpha），肉眼几乎不可见。选中色同时加深：sidebarSelected 与侧栏
           底色每通道只差 ≈10，改为朝前景混 .12 —— 与设置页导航选中态同一档位（ΔL≈20%）。 */
        body [class*="wnFoaW_sessionRow"][class*="wnFoaW_selected"] { background: ${mix(theme.sidebarGlassFill, theme.accent, .14)} !important; }
        body [class*="wnFoaW_sessionRow"]:hover:not([class*="wnFoaW_selected"]) { background: ${theme.sidebarRowHover} !important; }
        body [class*="wnFoaW_searchResultRow"][class*="wnFoaW_selected"] { background: ${mix(theme.sidebarGlassFill, theme.accent, .14)} !important; }` : `/* 深色分支：上面那一整组覆盖原本只在浅色下生成，深色下这些表面全部退回 DSH 的
             静态 token。其中「修改文件」卡片（HOHHba_card）底色是 --dsw-alias-bg-layer-1，
             深色默认 #232324（近纯黑），而内容区是 ${darkContent} —— 卡片在明亮的正文区上
             就是一块黑斑（用户反馈"修改文件代码块是黑色的"）。这里按同样的语义补一套
             深色值：面板=内容区色，卡片/控件逐级提亮，与 ui.card / ui.control 同源。 */
        body[data-ds-dark-theme] [class*="HOHHba_card"] { background: ${ui.card} !important; border-color: ${ui.border} !important; }
        /* 同样要带 body[data-ds-dark-theme]：DSH 有一条
           body[data-ds-dark-theme] .HOHHba_card{--changes-fill:neutral-850}（0-2-1），
           裸选择器压不过它，卡头会退回近黑。 */
        body[data-ds-dark-theme] [class*="HOHHba_card"] { --changes-fill: transparent; --changes-hover: ${ui.control}; }
        body[data-ds-dark-theme] [class*="HOHHba_tile"] { background: color-mix(in srgb, ${palette.foreground} 6%, transparent) !important; border-color: ${ui.border} !important; }
        /* 「已编辑 client.js」这类单文件卡片（K5rwea_file）走另一套局部变量
           --deliverable-fill：深色下 DSH 把它硬编码成 --dsw-static-neutral-850 (#212123)，
           比内容区 ${darkContent} 暗得多，在正文里就是一块黑斑（用户截图确认）。

           这里必须带 body[data-ds-dark-theme] 限定：DSH 自己的深色规则写的是
           body[data-ds-dark-theme] .K5rwea_root（权重 0-2-1），而裸的
           body [class*="K5rwea_root"] 只有 0-1-1 —— 上一版就是被它压过去，
           变量改了但计算值没变，卡片依旧发黑。加上同一前缀后权重 0-3-1，稳定生效。
           卡片底色与 HOHHba 卡片同取 ui.card，hover 用 ui.control。 */
        body[data-ds-dark-theme] [class*="K5rwea_root"] { --deliverable-fill: ${ui.card}; --deliverable-hover: ${ui.control}; }
        body[data-ds-dark-theme] [class*="K5rwea_file"] { border-color: ${ui.border} !important; }
        body[data-ds-dark-theme] [class*="K5rwea_fileIcon"] { background: color-mix(in srgb, ${palette.foreground} 6%, transparent) !important; border-color: ${ui.border} !important; }
        body [class*="HOHHba_row"], body [class*="HOHHba_counts"] { color: ${mix(palette.foreground, darkContent, .34)} !important; }
        body [class*="HOHHba_list"] { border-top-color: ${ui.border}; }
        body [class*="xeixwq_split"], body [class*="xeixwq_details"], body [class*="eciBTa_root"], body [class*="eciBTa_ledger"], body [class*="Wd4N7W_root"], body [class*="xeixwq_trajectory"], body [class*="xeixwq_table"], body [class*="xeixwq_assistantOutput"], body [class*="xeixwq_programPanel"], body [class*="xeixwq_programSource"], body [class*="xeixwq_schema"], body [class*="xeixwq_promptDiff"], body [class*="xeixwq_overviewHeading"], body [class*="xeixwq_overviewPreview"], body [class*="xeixwq_historyLoadButton"], body [class*="xeixwq_historyLoadingBar"] { background: ${ui.panel} !important; --dsw-alias-bg-layer-1: ${ui.panel}; --dsw-alias-bg-layer-2: ${ui.card}; --dsw-alias-bg-layer-3: ${ui.control}; --dsw-alias-border-l2: ${ui.border}; --dsw-alias-border-l3: ${ui.border}; --dsw-alias-border-l4: ${ui.border}; }
        body [class*="xeixwq_turnLabel"], body [class*="xeixwq_systemNeutral"], body [class*="xeixwq_compacted"], body [class*="Wd4N7W_search"], body [class*="xeixwq_table"] th { background: ${ui.control} !important; border-color: ${ui.border} !important; }
        body [class*="Wd4N7W_search"]:focus-within { background: ${ui.card} !important; }`}
        html { background: ${scheme === "light" ? theme.sidebarGlassFill : darkSidebar}; }
        body { color: ${scheme === "light" ? theme.foreground : palette.foreground}; }
        ${chrome}
        ${content}
        ${seat}
        ${breathe}
        ${changesCard}
        ${glass}
        ${paperOn ? `/* 纸张颗粒：纹理本身已含该表面的底色（不透明），所以这里只补 backgroundImage，
             不用任何混合模式——overlay/multiply 都只跟元素*自身*的 background-color 作用，
             而 DSH 里不少表面是透明底，混合会把灰噪声直接糊上去。
             background-attachment: fixed 让纹理像压在纸下，不随页面滚动漂移。
             注意 an3WzG_composerSeat 故意排除：它是「透明→底色」的淡出渐变，盖上不透明纹理
             会把渐变变成一条灰带（截图里输入框上方那道）。它靠父级 root 的纹理透出来即可。
             纹理必须用它所在表面自己的底色生成，否则纹理自带的底色会把该表面刷成另一种颜色。
             centerCol / root / 输入卡片在深色模式下取深色系的值 —— 之前无条件用浅色
             theme.content，深色下等于往深色 UI 上盖一块浅色纹理，文字全都看不清。 */
        body [class*="mP3x-q_centerCol"], body [class*="an3WzG_root"] {
          background: ${scheme === "light" ? theme.content : darkContent} !important;
          background-image: ${paperFor(scheme === "light" ? theme.content : darkContent)} !important;
          background-size: 180px 180px !important;
          background-repeat: repeat !important; background-attachment: fixed !important; }
        body [class*="mP3x-q_frame"], body [class*="mP3x-q_sidebarCol"] {
          background-image: ${paperFor(scheme === "light" ? theme.sidebarGlassFill : darkSidebar)} !important;
          background-size: 180px 180px !important; background-repeat: repeat !important; background-attachment: fixed !important; }
        /* 输入框卡片 GRgSLq_card 也贴上纹理：它浮在内容区之上，原本只比纸面亮 3-4 个色阶，
           不贴纹理会像一张塑料片贴在纸上。纹理自带它自己的底色（--dsw-specific-input-major），
           所以"卡片比纸面亮"的关系保持不变。
           注意这里是 scroll 而不是 fixed：卡片自身会 hover 上浮、且上方要盖带 backdrop-filter
           的 tooltip，fixed 附着会让它每帧重新采样视口背景，与合成层一起造成右侧区域持续闪烁。
           卡片不会滚动，scroll 与 fixed 在静止时观感完全一致，只是不再随视口重采样。 */
        body [class*="GRgSLq_card"]:not([class*="GRgSLq_cardWorkspaceTrigger"]) {
          background-image: ${paperFor(scheme === "light" ? theme.inputFill : mix(palette.background, palette.foreground, .14))} !important;
          background-size: 180px 180px !important; background-repeat: repeat !important;
          background-attachment: scroll !important; }
        /* 设置面板 / 卡片不贴纹理：它们是浮在纸面上的"卡片"，贴了纹理后导航选中块
           （半透明叠在其上）会被冲淡到几乎看不见，而且卡片本该比纸面更干净。 */
        body [class*="HOHHba_card"], body [class*="eciBTa_root"], body [class*="xeixwq_trajectory"] {
          background-image: ${paperFor(ui.card)} !important; background-size: 180px 180px !important;
          background-repeat: repeat !important; background-attachment: fixed !important; }` : ''}
        /* 输入框悬浮反馈：只改阴影，绝不做几何位移。

           位移（translateY）在这套界面里反复引发"卡片上下跳"：卡片一移动，指针与卡片的
           相对位置就变，:hover 随之翻转，于是 上浮→失效→落回→再上浮 循环。之前试过把
           判定挂到父容器 GRgSLq_root 上（合成环境实测翻转 29→3），但在真实界面里仍会复现——
           真实 DOM 里还有 tooltip、容器查询、seat 渐隐层等合成环境没有的因素参与，无法在
           离线复现中可靠排除。既然几何位移是唯一能造成"跳动"的东西，直接不移动它：
           反馈只靠阴影深浅表达，命中区域恒定，物理上不可能再抖。

           深色阴影用前景色低透明度而不是纯黑：暗底上 rgba(0,0,0,.42) 实测会把卡片下沿
           压成黑晕（比背景暗 2.29%），读作"脏"；前景色 .14 实测比背景亮 2.64%，
           是"浮起"的正确表达（.28 会亮 6.64%，像一圈光晕）。 */
        body [class*="GRgSLq_card"]:not([class*="GRgSLq_cardWorkspaceTrigger"]) {
          transition: box-shadow .18s cubic-bezier(.4, 0, .2, 1) !important;
          transform: none !important; }
        body [class*="GRgSLq_root"]:hover [class*="GRgSLq_card"]:not([class*="GRgSLq_cardWorkspaceTrigger"]):not(:has([class*="inputDisabled"])) {
          box-shadow: 0 6px 18px ${scheme === "light" ? "rgba(40, 48, 60, .13)" : "rgba(218, 214, 214, .14)"}, var(--dsw-elevation-soft) !important; }
        /* 会话行左侧的「进行中」转圈图标（primitives 的 StateDot，state=ongoing）。
           真实结构（从 web-frontend 打包产物确认）：
             svg._spinner_1i3xo_37 > g._spinnerMotion_1i3xo_42
               > circle._spinnerTrack_1i3xo_47（底环 opacity .25）
               + circle._spinnerArc_1i3xo_48（前景弧，stroke-dasharray 12 150）
           原样是 14px、stroke-width 2、颜色取 --dsw-alias-label-tertiary。
           问题实测（深色侧栏 #1B2028）：前景弧对比度 4.14 勉强，但底环经 25% 透明
           混出 #34383F，对比度只有 1.39 —— 几乎完全看不见，整圈只剩一截淡灰弧在飘，
           读不出"这是个环"，也读不出"正在进行"。

            第一轮优化（accent 色 + 底环 .38 + 线宽 2.6 + 静态弧长 17）后用户仍反馈
            「动画不太明显」，三个结构性原因：14px 面积太小；暖白主题 accent #339CFF
            压在侧栏 #E8E8E5 上对比度只有 2.5:1；静态弧长关掉了弧长呼吸，
            只剩匀速旋转，而人眼对恒速运动几乎无感。

            第二轮优化（2026-10，用户确认：实心点+对比+呼吸+底环加实）：
              · 颜色朝主题前景混 .35：暖白 2.5:1 → 约 4.1:1，豆沙绿约 5.1:1，
                仍保留各主题色相；深色不混（深底上 accent 够亮，混前景反而变暗）；
              · 环心加 accent 实心点（径向渐变背景绘制，直径约 5.8px，与环内侧留隙），
                静止轮廓从「一截细弧」变成「点+环」，小尺寸下辨识度大增；
              · 恢复弧长呼吸并加强：12 ↔ 38、1.1s ease-in-out（原生 12↔18 太微弱），
                运动本身成为信号；仅在 !suppressMotion 时发出这条规则，
                旋转动画不触碰，继续尊重原生的 prefers-reduced-motion；
              · 底环透明度 .38 → .55，「这是个环」先读出来。
            尺寸保持 14px 不变：侧栏行高固定，放大图标会顶到标题基线。 */
        /* 中心实心点：_spinner_1i3xo_37 直接挂在 <svg> 上，SVG 元素不支持 ::after，
           改用径向渐变背景画点（closest-side 半径 7px，点占 41% ≈ 2.9px，
           与环内侧 r≈4.8px 之间留约 1.9px 间隙）。 */
        body [class*="_spinner_1i3xo_"] {
          color: ${scheme === "light" ? mix(theme.accent, theme.foreground, .35) : "var(--dca-accent, #339CFF)"} !important;
          background: radial-gradient(circle closest-side, currentColor 0 41%, transparent 42%) !important; }
        body [class*="_spinnerTrack_1i3xo_"] { opacity: .55 !important; }
        body [class*="_spinnerTrack_1i3xo_"], body [class*="_spinnerArc_1i3xo_"] {
          stroke-width: 2.6 !important; }
        ${suppressMotion ? "" : `body [class*="_spinnerArc_1i3xo_"] {
          animation: dca-arc-breathe 1.1s ease-in-out infinite !important; }
        @keyframes dca-arc-breathe {
          0%, 100% { stroke-dasharray: 12 150; }
          50% { stroke-dasharray: 38 150; } }`}
        /* 弹出菜单选项的高亮态（悬停 + 键盘高亮）。这类高亮原生走
           --dsw-alias-interactive-bg-hover（浅色约 3–6%、深色约 8–14% 的透明色），
           压在近白半透明的菜单面上几乎看不出当前指在哪一项（用户截图确认，
           浅色/深色都一样；账号菜单实测合成值 #E8ECE7 vs 菜单面 #EEF2EC）。
           三个模块共用该 token：下拉菜单原语 4ub78（_item_4ub78_90，账号菜单等
           带 icon+shortcut 的菜单）、命令菜单 MenuView（pc3rQa_item/pc3rQa_active）、
           模型菜单 ModelSelect（9r0rkG，旧 wq12jW 哈希已失效）。全部换成不透明的
           同族实色：浅色在主题气泡色上朝前景混 .12（与侧栏选中态同档，
           对实际菜单面 Δ≈8%），深色混 .16（暗部感知弱，必须放大系数）。
           :not(optionCopy) 防误伤：optionCopy 是选项内文字子元素，前缀与 option 相同；
           _item_4ub78_ 带尾缀下划线，不会碰到 itemWrap/itemIcon/itemLabel。 */
        body [class*="_item_4ub78_"]:hover:not(:disabled),
        body [class*="_item_4ub78_"]:focus-visible:not(:disabled),
        body [class*="_selectedFill_4ub78_"],
        body [class*="pc3rQa_item"][class*="pc3rQa_active"],
        body [class*="9r0rkG_option"]:hover:not([class*="9r0rkG_optionCopy"]):not(:disabled),
        body [class*="9r0rkG_option"]:focus-visible:not([class*="9r0rkG_optionCopy"]),
        body [class*="9r0rkG_optionActive"]:not(:disabled) {
          background: ${scheme === "light"
            ? mix(theme.bubble, theme.foreground, .12)
            : mix(mix(mix(darkSidebar, palette.foreground, .12), palette.foreground, .16), palette.foreground, .16)} !important; }
        /* 模型菜单里的「提供商名」是 MenuGroup 的分组标题（ui-primitives 的
           _heading_121p8_19），原生 11px / 三级文字色 / 字重 500 —— 比模型名（13px）
           小两档，读起来像注脚。用户要求放大：13px / 行高 18px，与模型名同级；
           颜色保持三级文字色，避免标题抢过模型名的层级。
           选择器限定在模型菜单的滚动容器内，不影响其它菜单的分组标题。
           注意 _heading_121p8_ 是 primitives 的 CSS-module 哈希，DSH 升级后可能变化。 */
        body [class*="9r0rkG_groups"] [class*="_heading_121p8_"] {
          font-size: 13px !important; line-height: 18px !important; }
        ${suppressMotion ? 'body *, body *::before, body *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }' : ''}
      `;
    }
    const css = `
      .dca { color:var(--dsw-alias-label-primary); font-family:inherit; padding:0 0 20px; }
      .dca * { box-sizing:border-box; }
      .dca-head { display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18px; }
      .dca h2 {font-size:20px;font-weight:600;margin:0;}
      .dca-muted {color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5;}
      .dca-card {border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:var(--dsw-alias-bg-layer-2);margin:0 0 16px;padding:8px 18px;}
      .dca-row {min-height:53px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid var(--dsw-alias-border-l2);padding:10px 0;}
      .dca-row:last-child {border-bottom:0;}
      .dca-row:has(.dca-mode) {display:block;} .dca-row:has(.dca-mode) .dca-row-copy {margin-bottom:12px;}
      .dca-row-copy {flex:1;} .dca-row-copy strong {display:block;font-size:14px;font-weight:500;}
      .dca-row-copy span {display:block;color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:3px;}
      .dca-control {background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;min-height:34px;padding:5px 9px;font:inherit;font-size:13px;}
      .dca-control:focus-visible, .dca button:focus-visible {outline:2px solid var(--dca-accent,#339CFF);outline-offset:2px;}
      .dca-time {width:104px;}
      .dca-select {min-width:140px;max-width:200px;} .dca-number {width:67px;text-align:right;}
      .dca-mode {display:flex;gap:10px;align-items:center;}
      .dca-mode button {flex:1;min-width:0;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);border:2px solid transparent;border-radius:12px;padding:8px;cursor:pointer;}
      .dca-mode button[aria-pressed="true"] {border-color:var(--dca-accent,#339CFF);color:var(--dsw-alias-label-primary);}
      .dca-mini {height:61px;border-radius:8px;border:1px solid #6664;margin-bottom:7px;display:flex;overflow:hidden;box-shadow:0 2px 6px #0002;}
      .dca-mini i {display:block;width:25%;opacity:.7;} .dca-mini b {flex:1;align-self:center;height:4px;margin:0 15px;border-radius:3px;box-shadow:0 10px currentColor,0 -10px currentColor;opacity:.4;}
      .dca-color {display:flex;align-items:center;gap:8px;} .dca-color input[type=color] {width:30px;height:30px;padding:2px;background:transparent;border:0;cursor:pointer;}
      .dca-hex {width:94px;text-transform:uppercase;} .dca-section {font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary);margin:24px 0 10px;}
      .dca-switch {width:42px;height:25px;border-radius:99px;border:0;background:var(--dsw-alias-border-l1);padding:3px;cursor:pointer;}
      .dca-switch[aria-checked="true"] {background:var(--dca-accent,#339CFF);} .dca-switch::before {content:"";display:block;width:19px;height:19px;border-radius:50%;background:white;transition:transform .18s;}
      .dca-switch[aria-checked="true"]::before {transform:translateX(17px);}
      .dca-actions {display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;} .dca-button {border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:9px;padding:7px 12px;cursor:pointer;}
      .dca-slider {width:150px;accent-color:var(--dca-accent,#339CFF);} @media(max-width:680px){.dca-row{flex-wrap:wrap}.dca-mode{gap:5px}.dca-select{min-width:120px}}
      button[data-dca-appearance-nav="true"] svg {display:none;}
      button[data-dca-appearance-nav="true"]::before {content:"";display:inline-block;flex:none;width:16px;height:16px;background:currentColor;mask:center/contain no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='4' fill='none' stroke='black' stroke-width='1.8'/%3E%3Cpath d='M12 1.5v2.3M12 20.2v2.3M1.5 12h2.3M20.2 12h2.3M4.57 4.57 6.2 6.2m11.6 11.6 1.63 1.63m0-14.86L17.8 6.2M6.2 17.8l-1.63 1.63' stroke='black' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E");}
    `;
    function injectCss() { if (document.getElementById("dca-settings-css")) return; const el=document.createElement("style");el.id="dca-settings-css";el.textContent=css;document.head.appendChild(el); }
    function choice(value, onChange, options, label) {
      // options 项为 [value,label] 或 [value,label,group]；同组连续项合并成 <optgroup>，
      // 无 group 的项直接挂在 select 下。选中值不在任何选项里（手输的字体名）时补一条，
      // 否则下拉会显示空白。
      const list = options.slice();
      if (value && !list.some(([v]) => v === value)) list.push([value, value, "当前"]);
      // 先按 group 切分成有序段落，再统一渲染：直接往已交给 h() 的数组里追加，
      // 在 React 里只是恰好可用，换任何更严格的渲染器就会丢项。
      const segments = [];
      for (const [v, l, g] of list) {
        const key = g || null;
        const last = segments[segments.length - 1];
        if (!last || last.key !== key) segments.push({ key, items: [[v, l]] });
        else last.items.push([v, l]);
      }
      const out = segments.map((seg, i) => {
        const items = seg.items.map(([v, l]) => h("option", { key: v, value: v }, l));
        return seg.key === null ? items : [h("optgroup", { key: "g:" + seg.key + ":" + i, label: seg.key }, items)];
      }).flat();
      return h("select", { className: "dca-control dca-select", value, "aria-label": label, onChange: e => onChange(e.target.value) }, out);
    }
    function row(label, control, hint) { return h("div",{className:"dca-row",key:label},h("div",{className:"dca-row-copy"},h("strong",null,label),hint&&h("span",null,hint)),control); }
    function switcher(value, change, label) { return h("button",{type:"button",className:"dca-switch",role:"switch","aria-label":label,"aria-checked":value,onClick:()=>change(!value)}); }
    function colorRow(label, value, change) {
      return row(label,h("div",{className:"dca-color"},h("input",{type:"color",value,"aria-label":label+"色板",onChange:e=>change(e.target.value.toUpperCase())}),h("input",{className:"dca-control dca-hex",value,"aria-label":label+"色值",maxLength:7,onChange:e=>{if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))change(e.target.value.toUpperCase());}})));
    }
    function preview(selected, onClick, bg, fg, accent, label) {
      return h("button",{type:"button","aria-pressed":selected,onClick},h("div",{className:"dca-mini",style:{background:bg,color:fg}},h("i",{style:{background:mix(bg,fg,.11)}}),h("b",{style:{borderTop:"3px solid "+accent}})),label);
    }
    function Slider({value, onChange, label}) {
      return h("input",{className:"dca-slider",type:"range",min:0,max:100,value,"aria-label":label,onChange:e=>onChange(Number(e.target.value))});
    }
    function numberRowWrap(field, label, hint, min, max) {
      return h("div",null,h(DraftNumber,{field,min,max,"aria-label":label})," px");
    }
    function DraftNumber({field, min, max, "aria-label": ariaLabel}) {
      const [s, patch] = useSettings();
      const [draft, setDraft] = React.useState(String(s[field]));
      React.useEffect(() => { setDraft(String(s[field])); }, [s[field]]);
      return h("input", {className:"dca-control dca-number", type:"number", min, max, value: draft, "aria-label": ariaLabel,
        onChange:e => { setDraft(e.target.value); const n = Number(e.target.value); if (Number.isFinite(n) && n >= min && n <= max) patch({[field]: n}, true); },
        onBlur:() => { const n = Number(draft); setDraft(String(Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : s[field])); }});
    }
    function SettingsPage() {
      const [s, patch] = useSettings();
      // 字体清单来自宿主路由（真实系统字体，可能异步到达），到达后触发一次重渲染。
      const [, bumpFonts] = React.useState(0);
      React.useEffect(() => {
        loadHostFonts();
        const notify = () => bumpFonts((n) => n + 1);
        fontSubscribers.add(notify);
        return () => { fontSubscribers.delete(notify); };
      }, []);
      // 「跟随系统」时，真正生效的深浅色由 DSH 写在 body 上的属性决定（见 effectiveScheme）。
      // 系统主题切换后该属性会变，但 React 不会因此重渲染，设置页就会停在旧状态
      // （表现为"护眼主题"该出现时不出现、该隐藏时不隐藏）。监听属性变化强制重算一次。
      React.useEffect(() => {
        if (s.mode !== "system" || !document.body) return;
        const mo = new MutationObserver(() => bumpFonts((n) => n + 1));
        mo.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
        return () => mo.disconnect();
      }, [s.mode]);
      const scheme = effectiveScheme(s);
      const theme = themeOf(s);
      const editable = activePalette(s, scheme);
      const fontValue = field => s.separate ? s[scheme][field] : s[field];
      const changeFont = (field, value) => s.separate ? patch({[scheme]:{...s[scheme],[field]:value}}) : patch({[field]:value});
      const changeColor = (field, value) => patch({[scheme]:{...s[scheme],[field]:value}});
      // 内置四类 + 本机全部字体（宿主清单优先，拿不到时退化为宽度实测的候选表）。
      const fontOpts = [["system","系统"],["sans","无衬线"],["serif","衬线"],["mono","等宽"]]
        .concat(installedFontList().map((f) => [f, f, "本机字体"]));
      // 导入 / 导出：设置本来就是纯数据（颜色 + 字体 + 尺寸 + 模式），一个 JSON 就能带走。
      // 之前它只躺在 localStorage 里——换 profile、重装一次就归零，也没法把调好的色板发给别人。
      // 导入走 sanitize：非法值一律回落到默认，不会把界面写成不可用状态。
      function exportSettings() {
        const stamp = new Date().toISOString().slice(0, 10);
        const payload = {app: "dsh-eye-comfort", version: 1, settings: state};
        const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"}));
        const a = document.createElement("a");
        a.href = url; a.download = `dsh-eye-comfort-${stamp}.json`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      function importSettings() {
        const picker = document.createElement("input");
        picker.type = "file"; picker.accept = ".json,application/json";
        picker.onchange = () => {
          const file = picker.files && picker.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const raw = JSON.parse(String(reader.result));
              // 两种形状都收：完整导出（{settings:{...}}）与裸设置对象。
              setState(raw && typeof raw.settings === "object" ? raw.settings : raw);
            } catch { /* 解析失败保持原样，不做部分写入 */ }
          };
          reader.readAsText(file);
        };
        picker.click();
      }
      return h("div",{className:"dca"},
        h("div",{className:"dca-head"},h("h2",null,"外观"),h("span",{className:"dca-muted"},"实时预览 · 自动保存")),
        h("div",{className:"dca-card"},
          // 用户要求「护眼主题」与「模式」上下互换：先定深浅色，再在浅色下挑纸面配色，
          // 顺序与真实决策链一致。
          row("模式",h("div",{className:"dca-mode",style:{width:"100%"}},
          preview(s.mode==="system",()=>patch({mode:"system"}),"#2A313A","#DAD6D6",BLUE,"跟随系统"),
          preview(s.mode==="light",()=>patch({mode:"light"}),theme.previewBg,theme.foreground,theme.accent,"浅色"),
          preview(s.mode==="dark",()=>patch({mode:"dark"}),"#2A313A","#DAD6D6",BLUE,"深色"),
          preview(s.mode==="schedule",()=>patch({mode:"schedule"}),theme.previewBg,"#2A313A",BLUE,"定时")),
            "跟随系统 / 手动 / 按时间表自动切换深浅色"),
          s.mode === "schedule" ? row("定时切换",h("div",{style:{display:"flex",alignItems:"center",gap:6}},
            h("input",{className:"dca-control dca-time",type:"time",value:s.lightAt,"aria-label":"浅色开始时间",onChange:e=>patch({lightAt:timeValue(e.target.value,s.lightAt)})}),
            h("span",{className:"dca-muted"},"浅色起"),
            h("input",{className:"dca-control dca-time",type:"time",value:s.darkAt,"aria-label":"深色开始时间",onChange:e=>patch({darkAt:timeValue(e.target.value,s.darkAt)})}),
            h("span",{className:"dca-muted"},"深色起")),
            "浅色时段 = 浅色起 → 深色起；跨零点（如 22:00 → 06:00）自动折返") : null,
          // 护眼主题只作用于浅色模式（themeTokens 的全部主题色都取 light 分支，深色下
          // 切换色卡没有任何效果）。当前生效模式是深色时（含「跟随系统」解析为深色）
          // 直接隐藏这一行，避免用户在一个无效设置上反复点击却看不到变化。
          scheme === "dark" ? null :
          row("护眼主题",h("div",{className:"dca-mode",style:{width:"100%"}},
            THEME_IDS.map(id => preview(s.theme===id,()=>patch(applyTheme(s,id)),THEMES[id].content,THEMES[id].foreground,THEMES[id].accent,THEMES[id].label))),
            "浅色模式使用的配色；切换后会重置浅色的强调色与前景色"),
          scheme === "dark" ? row("深色主题",h("div",{className:"dca-mode",style:{width:"100%"}},
            DARK_IDS.map(id => preview(s.darkTheme===id,()=>patch(applyDarkTheme(s,id)),DARK_THEMES[id].background,DARK_THEMES[id].foreground,DARK_THEMES[id].accent,DARK_THEMES[id].label))),
            "深色模式使用的配色；切换后会重置深色的强调色与前景色") : null,
          colorRow("强调色",editable.accent,v=>changeColor("accent",v)),
          colorRow("背景",editable.background,v=>changeColor("background",v)),
          colorRow("前景",editable.foreground,v=>changeColor("foreground",v)),
          row("界面字体",choice(fontValue("uiFont"),v=>changeFont("uiFont",v),fontOpts,"界面字体"))),
        h("div",{className:"dca-section"},"高级"),
        h("div",{className:"dca-card"},
          row("界面字号",numberRowWrap("uiSize","界面字号","调整软件界面的基础字号",11,20)),
          row("代码字体大小",numberRowWrap("codeSize","代码字体大小","调整聊天和差异视图中的代码字号",10,20)),
          row("内容宽度",h("div",{style:{display:"flex",alignItems:"center",gap:8}},
            h("input",{className:"dca-slider",type:"range",min:680,max:1400,step:20,value:s.contentWidth,"aria-label":"内容宽度",onChange:e=>{
              // DSH owns this width: it writes --dsh-chat-user-width inline on every resize from
              // its own localStorage preference, and deletes that inline variable whenever the
              // preference is absent. Fighting that with CSS never worked, so the slider updates
              // DSH's own preference key and dispatches resize so its ResizeObserver republishes.
              const px = Number(e.target.value);
              applyContentWidth(px);
              patch({contentWidth:px},true);
            }}),
            h("span",{className:"dca-muted",style:{minWidth:"52px",textAlign:"right"}},s.contentWidth+" px")),"输入框与正文的最大宽度；拖拽正文两侧边缘可临时覆盖")),
        h("div",{className:"dca-card"},
          row("减少动态效果",choice(s.reducedMotion,v=>patch({reducedMotion:v}),[["system","系统"],["on","开启"],["off","关闭"]],"减少动态效果"),"减少动画效果或匹配系统设置"),
          row("纸张质感",switcher(s.paper,v=>patch({paper:v}),"纸张质感"),"在内容区、侧栏与卡片上叠一层极淡的纸张颗粒（不影响原生标题栏）"),
          row("色盲友好 diff",switcher(s.colorblind,v=>patch({colorblind:v}),"色盲友好 diff"),"把增删行的红绿换成蓝橙（红绿色觉缺陷在男性中约占 8%，diff 是最需要分清红绿的地方）"),
          s.paper ? row("颗粒强度",h("div",{style:{display:"flex",alignItems:"center",gap:8}},
            h(Slider,{value:s.paperStrength,onChange:v=>patch({paperStrength:v},true),label:"颗粒强度"}),
            h("span",{className:"dca-muted",style:{minWidth:"36px",textAlign:"right"}},String(s.paperStrength))),"数值越大颗粒越明显；建议 40–70，再高接近砂纸") : null,
          row("分别设置浅色和深色模式",switcher(s.separate,v=>patch({separate:v}),"分别设置浅色和深色模式"),"分别选择各自的颜色和字体")),
        h("div",{className:"dca-card"},
          row("界面字体样式",choice(s.fontStyle,v=>patch({fontStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"界面字体样式")),
          row("内容字体",choice(fontValue("contentFont"),v=>changeFont("contentFont",v),fontOpts,"内容字体")),
          row("内容字体样式",choice(s.contentStyle,v=>patch({contentStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"内容字体样式")),
          row("代码字体",choice(fontValue("codeFont"),v=>changeFont("codeFont",v),fontOpts,"代码字体")),
          row("代码字体样式",choice(s.codeStyle,v=>patch({codeStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"代码字体样式")),
          row("对比度",h("div",{style:{display:"flex",alignItems:"center",gap:8}},h(Slider,{value:s.contrast,onChange:v=>patch({contrast:v},true),label:"对比度"}),h("span",null,s.contrast)))) ,
        h("div",{className:"dca-actions"},
          h("button",{className:"dca-button",type:"button",onClick:exportSettings},"导出设置"),
          h("button",{className:"dca-button",type:"button",onClick:importSettings},"导入设置"),
          h("button",{className:"dca-button",type:"button",onClick:()=>setState(DEFAULT)},"重置为默认设置")));
    }
    function apply(ctx) {
      injectCss();
      // 启动即拉取一次系统字体，用户打开设置页时列表已经就绪。
      loadHostFonts();
      const markNav = () => { for (const button of document.querySelectorAll('[data-shortcut-modal="settings"] nav button')) if (button.textContent.trim() === "外观" && button.dataset.dcaAppearanceNav !== "true") button.dataset.dcaAppearanceNav = "true"; };
      let navQueued = false;
      const navObserver = new MutationObserver(() => { if (!navQueued) { navQueued = true; setTimeout(() => { navQueued = false; markNav(); }, 100); } });
      navObserver.observe(document.body, {childList:true, subtree:true});
      markNav();
      ctx.effect(() => () => navObserver.disconnect(), "dsh-eye-comfort: settings icon");
      let removeTheme = null;
      ctx.inject(["theme"], scope => {
        function sync() {
          removeTheme?.();
          // 定时模式下不能把 "schedule" 交给宿主（它只认 system/light/dark），
          // 直接传解析后的深浅色。
          try { scope.theme.setTheme(state.mode === "schedule" ? effectiveScheme(state) : state.mode); } catch {}
          removeTheme = scope.theme.overrideTokens("dsh-eye-comfort", themeTokens(state));
          applyExtras(state, state.reducedMotion === "on" || (state.reducedMotion === "system" && motionMedia.matches));
        }
        // 「跟随系统」时的重算信号：不能只监听 prefers-color-scheme。
        // DSH 把主题写进 body 的 data-ds-dark-theme，系统深浅色变化会先反映到这个属性上；
        // 而媒体查询会被 Electron 的 nativeTheme.themeSource 改写，两者会不一致。
        // 因此同时监听属性变化（MutationObserver）与媒体查询（保留作为兜底）。
        const media = matchMedia("(prefers-color-scheme: dark)");
        const motionMedia = matchMedia("(prefers-reduced-motion: reduce)");
        let pending = false;
        const schemeObserver = new MutationObserver(() => {
          if (pending || state.mode !== "system") return;
          pending = true;
          requestAnimationFrame(() => { pending = false; sync(); });
        });
        if (document.body) schemeObserver.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
        sync();
        const syncEnvironment = () => { if (state.mode === "system" || state.reducedMotion === "system") sync(); };
        media.addEventListener("change", syncEnvironment);
        motionMedia.addEventListener("change", syncEnvironment);
        listeners.add(sync);
        // 定时切换的心跳：每 30 秒看一次表，只有"该切了"才重算，不做无谓重绘。
        // 不用精确闹钟——深浅色晚 30 秒切换，人感觉不到。
        let lastScheme = effectiveScheme(state);
        const ticker = setInterval(() => {
          if (state.mode !== "schedule") { lastScheme = effectiveScheme(state); return; }
          const want = effectiveScheme(state);
          if (want !== lastScheme) { lastScheme = want; sync(); }
        }, 30000);
        scope.effect(() => () => { clearInterval(ticker); listeners.delete(sync); schemeObserver.disconnect(); media.removeEventListener("change", syncEnvironment); motionMedia.removeEventListener("change", syncEnvironment); removeTheme?.(); document.getElementById("dca-theme-extras")?.remove(); }, "dsh-eye-comfort: theme controls");
      });
      ctx.slots.inject("settings.section", () => ctx.slots.register({name:"settings.section",id:"codex-appearance",order:5,label:"外观"},SettingsPage));
    }
    return {apply, inject:["slots"]};
  }
});
