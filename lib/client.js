window.__ModuleLoader__.load({
  id: "dsh-eye-comfort",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const KEY = "dsh-codex-appearance/v1";
    const BLUE = "#339CFF";
    const DEFAULT = {
      mode: "dark", separate: false, theme: "warm",
      accent: BLUE, background: "#2A313A", foreground: "#DAD6D6",
      light: {accent: BLUE, background: "#F7F8F9", foreground: "#262F3C", uiFont:"system", contentFont:"inherit", codeFont:"system"},
      dark: {accent: BLUE, background: "#2A313A", foreground: "#DAD6D6", uiFont:"system", contentFont:"inherit", codeFont:"system"},
      uiFont: "system", contentFont: "inherit", codeFont: "system",
      uiSize: 14, codeSize: 12, fontStyle: "normal", contentStyle: "normal", codeStyle: "normal",
      contentWidth: 920, contrast: 40, reducedMotion: "system"
    };
    const FONTS = {system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", inherit: "inherit", sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", serif: "Georgia, 'Songti SC', serif", mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"};
    // Eye-comfort presets for light mode. Each one keeps its own accent and link so the whole
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
        content: "#F1F1EE", foreground: "#262F3C", accent: BLUE, link: "#244F94",
        base: "#F9FAFB", platform: "#F7F8FB", previewBg: "#F9FAFB",
        sidebarGlassFill: "#E8E8E5", sidebarButton: "#F2F1EE", sidebarButtonHover: "#F7F6F3",
        sidebarButtonBorder: "#D5D4CE", sidebarSelected: "#DEDEDA", sidebarRowHover: "#EFEEEB", bubble: "#F7F7F6", inputFill: "#F6F6F4"
      },
      paper: {
        label: "米纸",
        content: "#F2EBDC", foreground: "#3B3226", accent: "#8A6A2A", link: "#624813",
        base: "#F6F1E7", platform: "#F4EFE4", previewBg: "#F2EBDC",
        sidebarGlassFill: "#EAE2D4", sidebarButton: "#F3ECDE", sidebarButtonHover: "#FBF6EC",
        sidebarButtonBorder: "#D8CDBA", sidebarSelected: "#DED3C0", sidebarRowHover: "#F2EBDF", bubble: "#F7F2E8", inputFill: "#F6F1E6"
      },
      green: {
        label: "豆沙绿",
        content: "#EAF0E5", foreground: "#2B3527", accent: "#3E7A46", link: "#26582E",
        base: "#F1F5ED", platform: "#EEF3EA", previewBg: "#EAF0E5",
        sidebarGlassFill: "#E1E7DC", sidebarButton: "#EBF1E7", sidebarButtonHover: "#F7FAF4",
        sidebarButtonBorder: "#CCD5C6", sidebarSelected: "#D5DDCE", sidebarRowHover: "#EAF0E4", bubble: "#F1F5EE", inputFill: "#F0F4EC"
      },
      mist: {
        label: "雾蓝",
        content: "#ECEFF4", foreground: "#2A3138", accent: "#2F7BC4", link: "#1D5085",
        base: "#F3F5F8", platform: "#F0F3F6", previewBg: "#ECEFF4",
        sidebarGlassFill: "#E3E6EB", sidebarButton: "#EDF0F5", sidebarButtonHover: "#F9FAFC",
        sidebarButtonBorder: "#CED4DC", sidebarSelected: "#D8DEE6", sidebarRowHover: "#EBEEF3", bubble: "#F3F5F8", inputFill: "#F1F3F7"
      },
      stone: {
        label: "石墨",
        content: "#EDECEA", foreground: "#2E2E2C", accent: "#4A6B8A", link: "#354F6A",
        base: "#F3F2F1", platform: "#F0EFED", previewBg: "#EDECEA",
        sidebarGlassFill: "#E4E3E1", sidebarButton: "#EEEDEB", sidebarButtonHover: "#F8F7F6",
        sidebarButtonBorder: "#D1CFCC", sidebarSelected: "#DAD8D5", sidebarRowHover: "#ECEBE9", bubble: "#F3F3F1", inputFill: "#F2F1F0"
      }
    };
    const THEME_IDS = Object.keys(THEMES);
    function themeOf(s) { return THEMES[s.theme] || THEMES.warm; }
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
      for (const el of document.querySelectorAll('[class*="Dc7zOa_body"],[class*="Dc7zOa_root"]')) {
        el.style.setProperty("--dsh-chat-user-width", px + "px");
      }
      // The embedded transcript hard-codes its own min(100% - 32px, 920px), so it needs the
      // resolved width rather than the user-facing variable.
      for (const el of document.querySelectorAll('[class*="Dc7zOa_embeddedBody"]')) {
        el.style.setProperty("--dsh-chat-content-width", `min(${px}px, calc(100% - 32px))`);
      }
    }
    function hex(value, fallback) { return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toUpperCase() : fallback; }
    function clamp(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback; }
    function sanitize(raw) {
      const x = raw && typeof raw === "object" ? raw : {};
      const palette = (v, base) => ({accent: hex(v?.accent, base.accent), background: hex(v?.background, base.background), foreground: hex(v?.foreground, base.foreground), uiFont:FONTS[v?.uiFont] ? v.uiFont : "system", contentFont:FONTS[v?.contentFont] ? v.contentFont : "inherit", codeFont:FONTS[v?.codeFont] ? v.codeFont : "system"});
      return {
        mode: ["system", "light", "dark"].includes(x.mode) ? x.mode : DEFAULT.mode,
        separate: !!x.separate,
        theme: THEME_IDS.includes(x.theme) ? x.theme : "warm",
        accent: hex(x.accent, BLUE), background: hex(x.background, DEFAULT.background), foreground: hex(x.foreground, DEFAULT.foreground),
        light: palette(x.light, DEFAULT.light), dark: palette(x.dark, DEFAULT.dark),
        uiFont: FONTS[x.uiFont] ? x.uiFont : "system", contentFont: FONTS[x.contentFont] ? x.contentFont : "inherit", codeFont: FONTS[x.codeFont] ? x.codeFont : "system",
        uiSize: clamp(x.uiSize, 11, 20, 14), codeSize: clamp(x.codeSize, 10, 20, 12),
        contentWidth: clamp(x.contentWidth, 680, 1400, 920),
        fontStyle: ["normal", "compact", "comfortable"].includes(x.fontStyle) ? x.fontStyle : "normal",
        contentStyle: ["normal", "compact", "comfortable"].includes(x.contentStyle) ? x.contentStyle : "normal",
        codeStyle: ["normal", "compact", "comfortable"].includes(x.codeStyle) ? x.codeStyle : "normal",
        contrast: clamp(x.contrast, 0, 100, 40),
        reducedMotion: ["system", "on", "off"].includes(x.reducedMotion) ? x.reducedMotion : "system"
      };
    }
    let state;
    try { state = sanitize(JSON.parse(localStorage.getItem(KEY))); } catch { state = sanitize(null); }
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
        "--dsw-alias-markdown-code-block": pair((p, scheme) => level(p, scheme, 4)),
        "--dsw-alias-markdown-code-block-banner": pair((p, scheme) => level(p, scheme, 4)),
        "--dsw-alias-link": pair(() => theme.link),
        "--dsw-alias-settings-card-fill": pair((p, scheme) => level(p, scheme, 2)),
        "--dsw-alias-label-primary-foreground": pair((p, scheme) => scheme === "light" ? "#FFFFFF" : mix(p.background, p.foreground, .05)),
        "--dsw-alias-interactive-bg-hover": pair((p, scheme) => scheme === "light" ? "#26314808" : "#FFFFFF10"),
        // The Windows caption overlay is tinted from this token via a hidden probe, and the
        // native overlay cannot carry alpha, so this must stay an opaque colour. The sidebar
        // gets its translucency from the column rule below instead.
        "--dsw-specific-sidebar-fill": pair((p, scheme) => scheme === "light"
          ? theme.sidebarGlassFill
          : "#1B2028"),
        // These three are "specific" tokens, not alias ones: DSH defaults them to fixed static
        // ramps (a pale blue bubble, bluish nav states), so they ignored the theme and stayed
        // blue on a warm paper background. Derived from the theme instead.
        "--dsw-specific-bubble": pair((p, scheme) => scheme === "light" ? theme.bubble : mix(p.background, p.foreground, .1)),
        "--dsw-specific-bubble-highlight": pair((p, scheme) => scheme === "light" ? theme.bubble : mix(p.background, p.foreground, .16)),
        "--dsw-specific-sidebar-nav-item-active": pair((p, scheme) => scheme === "light" ? theme.sidebarSelected : "#3A4149"),
        "--dsw-specific-sidebar-nav-item-hover": pair((p, scheme) => scheme === "light" ? theme.sidebarRowHover : "#323942"),
        // The composer card, approval/question cards, attachment chips and the image viewer all
        // paint from this one token, and DSH defaults it to static pure white. On a warm theme
        // that white card is the brightest thing on screen. Follows the theme's bubble shade, so
        // the input sits on the same surface family as the transcript behind it.
        "--dsw-specific-input-major": pair((p, scheme) => scheme === "light" ? theme.inputFill : mix(p.background, p.foreground, .14)),
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
    function applyExtras(s, suppressMotion) {
      const scheme = s.mode === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : s.mode;
      const fonts = s.separate ? s[scheme] : s;
      const palette = activePalette(s, scheme);
      const theme = themeOf(s);
      // Inline code sits one tier deeper than a code block, and follows the same slider so the
      // setting feels consistent in both schemes.
      const ct = clamp(s.contrast, 0, 100, 40) / 100;
      const inlineCodeBg = scheme === "light"
        ? mix(theme.content, palette.foreground, .060 + ct * .150)
        : mix(palette.background, palette.foreground, .095 + ct * .095);
      let style = document.getElementById("dca-theme-extras");
      if (!style) { style = document.createElement("style"); style.id = "dca-theme-extras"; document.head.appendChild(style); }
      const density = s.contentStyle === "compact" ? 1.25 : s.contentStyle === "comfortable" ? 1.65 : 1.45;
      const codeHeight = s.codeStyle === "compact" ? 1.25 : s.codeStyle === "comfortable" ? 1.7 : 1.45;
      // Frosted sidebar without backdrop-filter: blur would turn the sidebar into a
      // containing block and shift absolutely positioned chrome (the collapse handle).
      // The sidebar paints --dsw-specific-sidebar-fill on both the column and its inner
      // root, so only the transparent column is set here (the inner root stays clear) and
      // the tinted frame gradient underneath is what the user actually sees through it.
      const glass = scheme === "light"
        ? `body [class*="BynINW_frame"] { background: ${theme.sidebarGlassFill} !important; }
        body [class*="BynINW_sidebarCol"] { background: ${theme.sidebarGlassFill} !important; }`
        : `body [class*="BynINW_frame"] { background: #1B2028 !important; }
        body [class*="BynINW_sidebarCol"] { background: #1B2028 !important; }
        body [class*="centerCol"] { background: ${theme.base} !important; }`;
      // The transcript area gets its own cool off-white in light mode. Only the column and the
      // conversation root are repainted: --dsw-alias-bg-base stays on the app base because
      // twenty other modules read it, and repainting the token would tint the whole window.
      // The composer's bottom fade is a gradient built from that token, so it is rebuilt from
      // the same colour here; otherwise a pale band shows under the last message.
      const content = scheme === "light"
        ? `body [class*="BynINW_centerCol"] { background: ${theme.content} !important; }
        body [class*="Dc7zOa_root"] { background: ${theme.content} !important; }
        body [class*="Dc7zOa_composerSeat"] { background: linear-gradient(180deg, transparent 0px, ${theme.content} 36px) !important; }`
        : '';
      // Electron paints the Windows caption buttons as a native overlay tinted from
      // --dsw-specific-sidebar-fill, which is now opaque and matches the sidebar. Keep body
      // on that same tint so the window edge stays one colour; the content column keeps its
      // own rounded white surface and must not be tinted, or the radius shows a seam.
      const chrome = scheme === "light"
        ? `html, body { background: ${theme.sidebarGlassFill} !important; }`
        : `html, body { background: #1B2028 !important; }`;
      // Light-mode surfaces are painted by these scoped rules with !important, so they — not the
      // token layer — are what the user actually sees. They were pinned to constants, which is
      // why the contrast slider appeared to do nothing in light mode: the tokens moved, the
      // painted pixels did not. Each surface is now derived from the same contrast scale.
      const L = theme.content;
      const toward = (fg, a, b) => mix(L, fg, a + ct * b);
      const ui = {
        panel: L,
        card: toward(palette.foreground, .020, .060),
        control: toward(palette.foreground, .050, .140),
        border: toward(palette.foreground, .080, .090),
        rowHover: toward(palette.foreground, .025, .045),
        navActive: toward(palette.foreground, .040, .060),
      };
      style.textContent = `
        body { font-family: ${FONTS[fonts.uiFont]} !important; font-size: ${s.uiSize}px; line-height: ${s.fontStyle === "compact" ? 1.3 : s.fontStyle === "comfortable" ? 1.65 : 1.45}; --dca-accent: ${palette.accent}; --dca-fg: ${palette.foreground}; }
        body [class*="markdown"], body [class*="messageContent"] { font-family: ${FONTS[fonts.contentFont]}; line-height: ${density}; }
        body pre, body code, body [class*="codeBlock"] { font-family: ${FONTS[fonts.codeFont]} !important; font-size: ${s.codeSize}px; line-height: ${codeHeight}; }
        body :not(pre) > code { background: ${inlineCodeBg} !important; color: ${palette.foreground} !important; border-radius: 5px; padding: 1px 5px; }
        body [class*="markdown"] a:not([class*="fileLink"]) { color: var(--dsw-alias-brand-primary, ${palette.accent}) !important; }
        body :is(a, button)[class*="fileLink"] { color: ${theme.link} !important; }
        body :is(a, button)[class*="fileLink"] * { color: inherit !important; }
        ${scheme === "light" ? `body [class*="wCInkW_panel"] { background: ${ui.panel} !important; --dsw-alias-bg-layer-2: ${ui.card}; --dsw-alias-bg-layer-3: ${ui.control}; --dsw-alias-settings-card-fill: ${ui.card}; --dsw-alias-border-l2: ${ui.border}; --dsw-alias-border-l3: ${ui.border}; }
        body [class*="wCInkW_panel"] [class*="dca-card"] { background: ${ui.card} !important; border-color: ${ui.border} !important; }
        body [class*="wCInkW_panel"] [class*="dca-control"] { background: ${ui.control} !important; border-color: ${ui.border} !important; }
        body [class*="wCInkW_panel"] [class*="dca-mode"] button { background: ${ui.control} !important; }
        body [class*="wCInkW_panel"] [class*="dca-button"] { background: ${ui.control} !important; border-color: ${ui.border} !important; }
        body [class*="wCInkW_panel"] [class*="dca-switch"] { background: ${ui.border} !important; }
        body [class*="wCInkW_navCell"]:hover { background: ${ui.rowHover} !important; }
        body [class*="wCInkW_navCell"][class*="wCInkW_active"] { background: ${ui.navActive} !important; }
        body [class*="haSm5q_split"], body [class*="haSm5q_details"], body [class*="hGyLPq_root"], body [class*="hGyLPq_ledger"], body [class*="QnvEwG_root"], body [class*="haSm5q_trajectory"], body [class*="haSm5q_table"], body [class*="haSm5q_assistantOutput"], body [class*="haSm5q_programPanel"], body [class*="haSm5q_programSource"], body [class*="haSm5q_schema"], body [class*="haSm5q_promptDiff"], body [class*="haSm5q_overviewHeading"], body [class*="haSm5q_overviewPreview"], body [class*="haSm5q_historyLoadButton"], body [class*="haSm5q_historyLoadingBar"] { background: ${ui.panel} !important; --dsw-alias-bg-layer-1: ${ui.panel}; --dsw-alias-bg-layer-2: ${ui.card}; --dsw-alias-bg-layer-3: ${ui.control}; --dsw-alias-border-l2: ${ui.border}; --dsw-alias-border-l3: ${ui.border}; --dsw-alias-border-l4: ${ui.border}; }
        body [class*="haSm5q_turnLabel"], body [class*="haSm5q_systemNeutral"], body [class*="haSm5q_compacted"], body [class*="QnvEwG_search"], body [class*="haSm5q_table"] th { background: ${ui.control} !important; border-color: ${ui.border} !important; }
        body [class*="QnvEwG_search"]:focus-within { background: ${ui.card} !important; }
        body [class*="kuvljq_card"] { background: ${ui.card} !important; }
        body [class*="kuvljq_row"], body [class*="kuvljq_path"], body [class*="kuvljq_counts"] { color: ${mix(theme.foreground, theme.content, .34)} !important; }
        body [class*="kuvljq_list"] { border-top-color: var(--dsw-alias-border-l2); }
        body button[class*="_newSession"] { background: ${theme.sidebarButton} !important; border-color: ${theme.sidebarButtonBorder} !important; color: #262F3C !important; }
        body button[class*="_newSession"]:hover { background: ${theme.sidebarButtonHover} !important; }
        body button[class*="_newSession"] * { background: transparent !important; border-color: transparent !important; }
        body button[class*="_newSession"] :is(kbd, [class*="_key_"]) { background: transparent !important; color: ${mix(theme.foreground, theme.content, .22)} !important; }
        body [class*="hIlkoa_sessionRow"][class*="hIlkoa_selected"] { background: ${theme.sidebarSelected} !important; }
        body [class*="hIlkoa_sessionRow"]:hover:not([class*="hIlkoa_selected"]) { background: ${theme.sidebarRowHover} !important; }` : ''}
        html { background: ${scheme === "light" ? theme.sidebarGlassFill : "#1B2028"}; }
        body { color: ${scheme === "light" ? theme.foreground : palette.foreground}; }
        ${chrome}
        ${content}
        ${glass}
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
      .dca-actions {display:flex;justify-content:flex-end;gap:8px;} .dca-button {border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:9px;padding:7px 12px;cursor:pointer;}
      .dca-slider {width:150px;accent-color:var(--dca-accent,#339CFF);} @media(max-width:680px){.dca-row{flex-wrap:wrap}.dca-mode{gap:5px}.dca-select{min-width:120px}}
      button[data-dca-appearance-nav="true"] svg {display:none;}
      button[data-dca-appearance-nav="true"]::before {content:"";display:inline-block;flex:none;width:16px;height:16px;background:currentColor;mask:center/contain no-repeat url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='4' fill='none' stroke='black' stroke-width='1.8'/%3E%3Cpath d='M12 1.5v2.3M12 20.2v2.3M1.5 12h2.3M20.2 12h2.3M4.57 4.57 6.2 6.2m11.6 11.6 1.63 1.63m0-14.86L17.8 6.2M6.2 17.8l-1.63 1.63' stroke='black' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E");}
    `;
    function injectCss() { if (document.getElementById("dca-settings-css")) return; const el=document.createElement("style");el.id="dca-settings-css";el.textContent=css;document.head.appendChild(el); }
    function choice(value, onChange, options, label) { return h("select", {className:"dca-control dca-select", value, "aria-label":label, onChange:e=>onChange(e.target.value)}, options.map(([v,l])=>h("option",{key:v,value:v},l))); }
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
      const scheme = s.mode === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark":"light") : s.mode;
      const theme = themeOf(s);
      const editable = activePalette(s, scheme);
      const fontValue = field => s.separate ? s[scheme][field] : s[field];
      const changeFont = (field, value) => s.separate ? patch({[scheme]:{...s[scheme],[field]:value}}) : patch({[field]:value});
      const changeColor = (field, value) => patch({[scheme]:{...s[scheme],[field]:value}});
      const fontOpts=[["system","系统"],["sans","无衬线"],["serif","衬线"],["mono","等宽"]];
      return h("div",{className:"dca"},
        h("div",{className:"dca-head"},h("h2",null,"外观"),h("span",{className:"dca-muted"},"实时预览 · 自动保存")),
        h("div",{className:"dca-card"},
          row("护眼主题",h("div",{className:"dca-mode",style:{width:"100%"}},
            THEME_IDS.map(id => preview(s.theme===id,()=>patch(applyTheme(s,id)),THEMES[id].content,THEMES[id].foreground,THEMES[id].accent,THEMES[id].label))),
            "浅色模式使用的配色；切换后会重置浅色的强调色与前景色"),
          row("模式",h("div",{className:"dca-mode",style:{width:"100%"}},
          preview(s.mode==="system",()=>patch({mode:"system"}),"#2A313A","#DAD6D6",BLUE,"跟随系统"),
          preview(s.mode==="light",()=>patch({mode:"light"}),theme.previewBg,theme.foreground,theme.accent,"浅色"),
          preview(s.mode==="dark",()=>patch({mode:"dark"}),"#2A313A","#DAD6D6",BLUE,"深色"))),
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
          row("分别设置浅色和深色模式",switcher(s.separate,v=>patch({separate:v}),"分别设置浅色和深色模式"),"分别选择各自的颜色和字体")),
        h("div",{className:"dca-card"},
          row("界面字体样式",choice(s.fontStyle,v=>patch({fontStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"界面字体样式")),
          row("内容字体",choice(fontValue("contentFont"),v=>changeFont("contentFont",v),fontOpts,"内容字体")),
          row("内容字体样式",choice(s.contentStyle,v=>patch({contentStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"内容字体样式")),
          row("代码字体",choice(fontValue("codeFont"),v=>changeFont("codeFont",v),fontOpts,"代码字体")),
          row("代码字体样式",choice(s.codeStyle,v=>patch({codeStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"代码字体样式")),
          row("对比度",h("div",{style:{display:"flex",alignItems:"center",gap:8}},h(Slider,{value:s.contrast,onChange:v=>patch({contrast:v},true),label:"对比度"}),h("span",null,s.contrast)))) ,
        h("div",{className:"dca-actions"},h("button",{className:"dca-button",type:"button",onClick:()=>setState(DEFAULT)},"重置为默认设置")));
    }
    function apply(ctx) {
      injectCss();
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
          try { scope.theme.setTheme(state.mode); } catch {}
          removeTheme = scope.theme.overrideTokens("dsh-eye-comfort", themeTokens(state));
          applyExtras(state, state.reducedMotion === "on" || (state.reducedMotion === "system" && motionMedia.matches));
        }
        const media = matchMedia("(prefers-color-scheme: dark)");
        const motionMedia = matchMedia("(prefers-reduced-motion: reduce)");
        sync();
        const syncEnvironment = () => { if (state.mode === "system" || state.reducedMotion === "system") sync(); };
        media.addEventListener("change", syncEnvironment);
        motionMedia.addEventListener("change", syncEnvironment);
        listeners.add(sync);
        scope.effect(() => () => { listeners.delete(sync); media.removeEventListener("change", syncEnvironment); motionMedia.removeEventListener("change", syncEnvironment); removeTheme?.(); document.getElementById("dca-theme-extras")?.remove(); }, "dsh-eye-comfort: theme controls");
      });
      ctx.slots.inject("settings.section", () => ctx.slots.register({name:"settings.section",id:"codex-appearance",order:5,label:"外观"},SettingsPage));
    }
    return {apply, inject:["slots"]};
  }
});
