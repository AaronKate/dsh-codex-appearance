window.__ModuleLoader__.load({
  id: "dsh-codex-appearance",
  factory: (require) => {
    const React = require("react");
    const h = React.createElement;
    const KEY = "dsh-codex-appearance/v1";
    const BLUE = "#339CFF";
    const DEFAULT = {
      mode: "dark", preset: "codex", separate: false,
      accent: BLUE, background: "#2A313A", foreground: "#DAD6D6",
      light: {accent: BLUE, background: "#F7F8F9", foreground: "#262F3C", uiFont:"system", contentFont:"inherit", codeFont:"system"}, // raw base; themeTokens pins the palette to LIGHT_THEME
      dark: {accent: BLUE, background: "#2A313A", foreground: "#DAD6D6", uiFont:"system", contentFont:"inherit", codeFont:"system"},
      uiFont: "system", contentFont: "inherit", codeFont: "system",
      uiSize: 14, codeSize: 12, fontStyle: "normal", contentStyle: "normal", codeStyle: "normal",
      sidebarGlass: true, contrast: 40, reducedMotion: "system"
    };
    const FONTS = {system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", inherit: "inherit", sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", serif: "Georgia, 'Songti SC', serif", mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"};
    // Codex blue-gray light theme, final values only — tune colors here, one place.
    // Surfaces are white; layering comes from borders and the few tinted accents below.
    const LIGHT_THEME = {
      base: "#F9FAFB", layer1: "#FDFDFE", layer2: "#FAFBFD", layer3: "#F5F7FA", platform: "#F7F8FB",
      codeBlock: "#F6F8FC", inlineCode: "#EFF2F7", sidebar: "#EAEEF2", previewBg: "#F9FAFB",
      settingsPanel: "#FFFFFF", settingsCard: "#FAFBFD",
      foreground: "#262F3C", link: "#2858A4", accent: BLUE
    };
    const listeners = new Set();
    function hex(value, fallback) { return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toUpperCase() : fallback; }
    function clamp(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback; }
    function sanitize(raw) {
      const x = raw && typeof raw === "object" ? raw : {};
      const palette = (v, base) => ({accent: hex(v?.accent, base.accent), background: hex(v?.background, base.background), foreground: hex(v?.foreground, base.foreground), uiFont:FONTS[v?.uiFont] ? v.uiFont : "system", contentFont:FONTS[v?.contentFont] ? v.contentFont : "inherit", codeFont:FONTS[v?.codeFont] ? v.codeFont : "system"});
      return {
        mode: ["system", "light", "dark"].includes(x.mode) ? x.mode : DEFAULT.mode,
        preset: ["codex", "custom"].includes(x.preset) ? x.preset : DEFAULT.preset,
        separate: !!x.separate,
        accent: hex(x.accent, BLUE), background: hex(x.background, DEFAULT.background), foreground: hex(x.foreground, DEFAULT.foreground),
        light: palette(x.light, DEFAULT.light), dark: palette(x.dark, DEFAULT.dark),
        uiFont: FONTS[x.uiFont] ? x.uiFont : "system", contentFont: FONTS[x.contentFont] ? x.contentFont : "inherit", codeFont: FONTS[x.codeFont] ? x.codeFont : "system",
        uiSize: clamp(x.uiSize, 11, 20, 14), codeSize: clamp(x.codeSize, 10, 20, 12),
        fontStyle: ["normal", "compact", "comfortable"].includes(x.fontStyle) ? x.fontStyle : "normal",
        contentStyle: ["normal", "compact", "comfortable"].includes(x.contentStyle) ? x.contentStyle : "normal",
        codeStyle: ["normal", "compact", "comfortable"].includes(x.codeStyle) ? x.codeStyle : "normal",
        sidebarGlass: x.sidebarGlass === undefined ? DEFAULT.sidebarGlass : !!x.sidebarGlass, contrast: clamp(x.contrast, 0, 100, 40),
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
      if (s.preset === "codex") return scheme === "dark" ? DEFAULT.dark : DEFAULT.light;
      return s.separate ? s[scheme] : {accent: s.accent, background: s.background, foreground: s.foreground};
    }
    function themeTokens(s) {
      const light = {...activePalette(s, "light"), background: LIGHT_THEME.base, foreground: LIGHT_THEME.foreground};
      const dark = activePalette(s, "dark");
      const pair = fn => ({light: fn(light, "light"), dark: fn(dark, "dark")});
      return {
        "--dsw-alias-brand-primary": pair(p => p.accent),
        "--dsw-alias-brand-primary-new-colorprimary-new-color": pair(p => p.accent),
        "--dsw-alias-brand-text": pair(p => p.accent),
        "--dsw-alias-bg-base": pair(p => p.background),
        "--dsw-alias-bg-layer-1": pair((p, scheme) => scheme === "light" ? LIGHT_THEME.layer1 : mix(p.background, p.foreground, .025 + s.contrast / 2000)),
        "--dsw-alias-bg-layer-2": pair((p, scheme) => scheme === "light" ? LIGHT_THEME.layer2 : mix(p.background, p.foreground, .055 + s.contrast / 1200)),
        "--dsw-alias-bg-layer-3": pair((p, scheme) => scheme === "light" ? LIGHT_THEME.layer3 : mix(p.background, p.foreground, .085 + s.contrast / 900)),
        "--dsw-alias-bg-module-platform": pair((p, scheme) => scheme === "light" ? LIGHT_THEME.platform : mix(p.background, p.foreground, .07)),
        "--dsw-alias-markdown-code-block": pair((p, scheme) => scheme === "light" ? LIGHT_THEME.codeBlock : mix(p.background, p.foreground, .1 + s.contrast / 900)),
        "--dsw-alias-markdown-code-block-banner": pair((p, scheme) => scheme === "light" ? LIGHT_THEME.codeBlock : mix(p.background, p.foreground, .1 + s.contrast / 900)),
        "--dsw-alias-link": pair(() => LIGHT_THEME.link),
        "--dsw-alias-settings-card-fill": pair((p, scheme) => scheme === "light" ? LIGHT_THEME.settingsCard : mix(p.background, p.foreground, .055 + s.contrast / 1200)),
        "--dsw-alias-label-primary-foreground": pair((p, scheme) => scheme === "light" ? "#FFFFFF" : mix(p.background, p.foreground, .05)),
        "--dsw-alias-interactive-bg-hover": pair((p, scheme) => scheme === "light" ? "#26314808" : "#FFFFFF10"),
        // The Windows caption overlay is tinted from this token via a hidden probe, and the
        // native overlay cannot carry alpha, so this must stay an opaque colour. The sidebar
        // gets its translucency from the column rule below instead.
        "--dsw-specific-sidebar-fill": pair((p, scheme) => scheme === "light"
          ? (s.sidebarGlass ? "#E0E7F3" : LIGHT_THEME.sidebar)
          : (s.sidebarGlass ? "#1B2028" : mix(p.background, p.foreground, .022))),
        // Elevated buttons (the sidebar's New Session) sit on the sidebar surface, so their
        // fill has to follow that surface: the tinted glass sidebar and the plain grey one have
        // different hues, and one hard-coded fill only ever matches one of them.
        "--dsw-alias-button-elevated-fill": pair((p, scheme) => scheme === "light"
          ? (s.sidebarGlass ? "#DCE4F2" : "#F2F4F7")
          : (s.sidebarGlass ? "#262D36" : "#2B303A")),
        // Hover stays in the same family one step deeper — a jump to pure white reads as a
        // different component sitting on the sidebar.
        "--dsw-alias-button-floating-hover": pair((p, scheme) => scheme === "light"
          ? (s.sidebarGlass ? "#E9EFF8" : "#E7EAF0")
          : (s.sidebarGlass ? "#2E363F" : "#343A45")),
        "--dsw-alias-label-primary": pair(p => p.foreground),
        "--dsw-alias-label-secondary": pair(p => mix(p.foreground, p.background, .34)),
        "--dsw-alias-label-tertiary": pair(p => mix(p.foreground, p.background, .52)),
        "--dsw-alias-border-l1": pair(p => mix(p.background, p.foreground, .14)),
        "--dsw-alias-border-l2": pair(p => mix(p.background, p.foreground, .12)),
        "--dsw-alias-border-l3": pair((p, scheme) => scheme === "light" ? "#DDE3EC" : mix(p.background, p.foreground, .16)),
        "--dsw-alias-border-l4": pair((p, scheme) => scheme === "light" ? "#E3E8F0" : mix(p.background, p.foreground, .1))
      };
    }
    function applyExtras(s, suppressMotion) {
      const scheme = s.mode === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : s.mode;
      const fonts = s.separate ? s[scheme] : s;
      const palette = activePalette(s, scheme);
      const inlineCodeBg = scheme === "light" ? LIGHT_THEME.inlineCode : mix(palette.background, palette.foreground, .085 + s.contrast / 1500);
      let style = document.getElementById("dca-theme-extras");
      if (!style) { style = document.createElement("style"); style.id = "dca-theme-extras"; document.head.appendChild(style); }
      const density = s.contentStyle === "compact" ? 1.25 : s.contentStyle === "comfortable" ? 1.65 : 1.45;
      const codeHeight = s.codeStyle === "compact" ? 1.25 : s.codeStyle === "comfortable" ? 1.7 : 1.45;
      // Frosted sidebar without backdrop-filter: blur would turn the sidebar into a
      // containing block and shift absolutely positioned chrome (the collapse handle).
      // The sidebar paints --dsw-specific-sidebar-fill on both the column and its inner
      // root, so only the transparent column is set here (the inner root stays clear) and
      // the tinted frame gradient underneath is what the user actually sees through it.
      const glass = s.sidebarGlass ? (scheme === "light"
        ? `body [class*="BynINW_frame"] { background: #E0E7F3 !important; }
        body [class*="BynINW_sidebarCol"] { background: #E0E7F3 !important; }
        body [class*="centerCol"] { background: ${LIGHT_THEME.base} !important; }`
        : `body [class*="BynINW_frame"] { background: #1B2028 !important; }
        body [class*="BynINW_sidebarCol"] { background: #1B2028 !important; }
        body [class*="centerCol"] { background: ${LIGHT_THEME.base} !important; }`)
        : '';
      // Electron paints the Windows caption buttons as a native overlay tinted from
      // --dsw-specific-sidebar-fill, which is now opaque and matches the sidebar. Keep body
      // on that same tint so the window edge stays one colour; the content column keeps its
      // own rounded white surface and must not be tinted, or the radius shows a seam.
      const chrome = s.sidebarGlass ? (scheme === "light"
        ? `html, body { background: #E0E7F3 !important; }`
        : `html, body { background: #1B2028 !important; }`)
        : '';
      style.textContent = `
        body { font-family: ${FONTS[fonts.uiFont]} !important; font-size: ${s.uiSize}px; line-height: ${s.fontStyle === "compact" ? 1.3 : s.fontStyle === "comfortable" ? 1.65 : 1.45}; --dca-accent: ${s.accent}; --dca-contrast: ${s.contrast}; }
        body [class*="markdown"], body [class*="messageContent"] { font-family: ${FONTS[fonts.contentFont]}; line-height: ${density}; }
        body pre, body code, body [class*="codeBlock"] { font-family: ${FONTS[fonts.codeFont]} !important; font-size: ${s.codeSize}px; line-height: ${codeHeight}; }
        body :not(pre) > code { background: ${inlineCodeBg} !important; color: ${palette.foreground} !important; border-radius: 5px; padding: 1px 5px; }
        body [class*="markdown"] a:not([class*="fileLink"]):not([class*="fileMention"]) { color: var(--dsw-alias-brand-primary, ${palette.accent}) !important; }
        ${scheme === "light" ? `body [class*="wCInkW_panel"] { background: ${LIGHT_THEME.settingsPanel} !important; }
        body [class*="haSm5q_split"], body [class*="haSm5q_details"], body [class*="hGyLPq_root"], body [class*="hGyLPq_ledger"], body [class*="QnvEwG_root"] { background: ${LIGHT_THEME.base} !important; }
        body [class*="kuvljq_card"] { background: #FFFFFF !important; }
        body [class*="kuvljq_row"], body [class*="kuvljq_path"], body [class*="kuvljq_counts"] { color: #55606E !important; }
        body [class*="kuvljq_list"] { border-top-color: var(--dsw-alias-border-l2); }
        body [class*="_newSession"] { background: ${s.sidebarGlass ? "#DCE4F2" : "#F2F4F7"} !important; border-color: ${s.sidebarGlass ? "#C9D4E6" : "#E2E6EC"} !important; color: #262F3C !important; }
        body [class*="_newSession"]:hover { background: ${s.sidebarGlass ? "#E9EFF8" : "#E7EAF0"} !important; }` : ''}
        html { background: ${s.sidebarGlass ? (scheme === "light" ? "#E0E7F3" : "#1B2028") : LIGHT_THEME.base}; }
        body { color: ${scheme === "light" ? LIGHT_THEME.foreground : palette.foreground}; }
        ${chrome}
        ${glass}
        ${suppressMotion ? 'body *, body *::before, body *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }' : ''}
      `;
      document.body.dataset.dca = "enabled";
      document.body.style.setProperty("--dca-ui-size", s.uiSize + "px");
      document.body.style.setProperty("--dca-code-size", s.codeSize + "px");
    }
    const css = `
      .dca { color:var(--dsw-alias-label-primary); font-family:inherit; padding:0 0 20px; }
      .dca * { box-sizing:border-box; }
      .dca-head { display:flex;align-items:baseline;justify-content:space-between;margin-bottom:18px; }
      .dca h2 {font-size:20px;font-weight:600;margin:0;} .dca h3 {font-size:14px;font-weight:600;margin:0;}
      .dca-muted {color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.5;}
      .dca-card {border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:var(--dsw-alias-bg-layer-2);margin:0 0 16px;padding:8px 18px;}
      .dca-row {min-height:53px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid var(--dsw-alias-border-l2);padding:10px 0;}
      .dca-row:last-child {border-bottom:0;} .dca-row-label {font-size:14px;min-width:110px;}
      .dca-row:has(.dca-mode) {display:block;} .dca-row:has(.dca-mode) .dca-row-copy {margin-bottom:12px;}
      .dca-row-copy {flex:1;} .dca-row-copy strong {display:block;font-size:14px;font-weight:500;}
      .dca-row-copy span {display:block;color:var(--dsw-alias-label-secondary);font-size:12px;margin-top:3px;}
      .dca-control {background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;min-height:34px;padding:5px 9px;font:inherit;font-size:13px;}
      .dca-control:focus-visible, .dca button:focus-visible {outline:2px solid var(--dca-accent,#339CFF);outline-offset:2px;}
      .dca-select {min-width:140px;max-width:200px;} .dca-number {width:67px;text-align:right;}
      .dca-mode {display:flex;gap:10px;align-items:center;}
      .dca-mode button {flex:1;min-width:0;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);border:2px solid transparent;border-radius:12px;padding:8px;cursor:pointer;}
      .dca-mode button[aria-pressed="true"] {border-color:#339CFF;color:var(--dsw-alias-label-primary);}
      .dca-mini {height:61px;border-radius:8px;border:1px solid #6664;margin-bottom:7px;display:flex;overflow:hidden;box-shadow:0 2px 6px #0002;}
      .dca-mini i {display:block;width:25%;opacity:.7;} .dca-mini b {flex:1;align-self:center;height:4px;margin:0 15px;border-radius:3px;box-shadow:0 10px currentColor,0 -10px currentColor;opacity:.4;}
      .dca-color {display:flex;align-items:center;gap:8px;} .dca-color input[type=color] {width:30px;height:30px;padding:2px;background:transparent;border:0;cursor:pointer;}
      .dca-hex {width:94px;text-transform:uppercase;} .dca-section {font-size:13px;font-weight:600;color:var(--dsw-alias-label-secondary);margin:24px 0 10px;}
      .dca-switch {width:42px;height:25px;border-radius:99px;border:0;background:var(--dsw-alias-border-l1);padding:3px;cursor:pointer;}
      .dca-switch[aria-checked="true"] {background:#339CFF;} .dca-switch::before {content:"";display:block;width:19px;height:19px;border-radius:50%;background:white;transition:transform .18s;}
      .dca-switch[aria-checked="true"]::before {transform:translateX(17px);}
      .dca-actions {display:flex;justify-content:flex-end;gap:8px;} .dca-button {border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:9px;padding:7px 12px;cursor:pointer;}
      .dca-slider {width:150px;accent-color:#339CFF;} @media(max-width:680px){.dca-row{flex-wrap:wrap}.dca-mode{gap:5px}.dca-select{min-width:120px}}
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
      const editable = s.preset === "codex" ? activePalette(s, scheme) : s.separate ? s[scheme] : s;
      const fontValue = field => s.separate ? s[scheme][field] : s[field];
      const changeFont = (field, value) => s.separate ? patch({[scheme]:{...s[scheme],[field]:value}}) : patch({[field]:value});
      const changeColor = (field,value) => {
        if(s.separate) patch({preset:"custom",[scheme]:{...s[scheme],[field]:value}});
        else {
          const shown = scheme === "light" ? {accent: LIGHT_THEME.accent, background: LIGHT_THEME.base, foreground: LIGHT_THEME.foreground} : activePalette(s, "dark");
          patch({preset:"custom",...(s.preset === "codex" ? shown : {}),[field]:value});
        }
      };
      const fontOpts=[["system","系统"],["sans","无衬线"],["serif","衬线"],["mono","等宽"]];
      return h("div",{className:"dca"},
        h("div",{className:"dca-head"},h("h2",null,"外观"),h("span",{className:"dca-muted"},"实时预览 · 自动保存")),
        h("div",{className:"dca-card"},row("模式",h("div",{className:"dca-mode",style:{width:"100%"}},
          preview(s.mode==="system",()=>patch({mode:"system"}),"#2A313A","#DAD6D6",BLUE,"跟随系统"),
          preview(s.mode==="light",()=>patch({mode:"light"}),LIGHT_THEME.previewBg,LIGHT_THEME.foreground,BLUE,"浅色"),
          preview(s.mode==="dark",()=>patch({mode:"dark"}),"#2A313A","#DAD6D6",BLUE,"深色"))),
          row("主题",choice(s.preset,v=>patch({preset:v}),[["codex","Codex 蓝灰"],["custom","自定义"]],"主题")),
          colorRow("强调色",editable.accent,v=>changeColor("accent",v)),
          colorRow("背景",editable.background,v=>changeColor("background",v)),
          colorRow("前景",editable.foreground,v=>changeColor("foreground",v)),
          row("界面字体",choice(fontValue("uiFont"),v=>changeFont("uiFont",v),fontOpts,"界面字体"))),
        h("div",{className:"dca-section"},"高级"),
        h("div",{className:"dca-card"},
          row("界面字号",numberRowWrap("uiSize","界面字号","调整软件界面的基础字号",11,20)),
          row("代码字体大小",numberRowWrap("codeSize","代码字体大小","调整聊天和差异视图中的代码字号",10,20))),
        h("div",{className:"dca-card"},
          row("减少动态效果",choice(s.reducedMotion,v=>patch({reducedMotion:v}),[["system","系统"],["on","开启"],["off","关闭"]],"减少动态效果"),"减少动画效果或匹配系统设置"),
          row("分别设置浅色和深色模式",switcher(s.separate,v=>patch({separate:v}),"分别设置浅色和深色模式"),"分别选择各自的颜色和字体")),
        h("div",{className:"dca-card"},
          row("界面字体样式",choice(s.fontStyle,v=>patch({fontStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"界面字体样式")),
          row("内容字体",choice(fontValue("contentFont"),v=>changeFont("contentFont",v),fontOpts,"内容字体")),
          row("内容字体样式",choice(s.contentStyle,v=>patch({contentStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"内容字体样式")),
          row("代码字体",choice(fontValue("codeFont"),v=>changeFont("codeFont",v),fontOpts,"代码字体")),
          row("代码字体样式",choice(s.codeStyle,v=>patch({codeStyle:v}),[["normal","常规"],["compact","紧凑"],["comfortable","舒适"]],"代码字体样式")),
          row("半透明侧边栏",switcher(s.sidebarGlass,v=>patch({sidebarGlass:v}),"半透明侧边栏")),
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
      ctx.effect(() => () => navObserver.disconnect(), "dsh-codex-appearance: settings icon");
      let removeTheme = null;
      ctx.inject(["theme"], scope => {
        function sync() {
          removeTheme?.();
          try { scope.theme.setTheme(state.mode); } catch {}
          removeTheme = scope.theme.overrideTokens("dsh-codex-appearance", themeTokens(state));
          applyExtras(state, state.reducedMotion === "on" || (state.reducedMotion === "system" && motionMedia.matches));
        }
        const media = matchMedia("(prefers-color-scheme: dark)");
        const motionMedia = matchMedia("(prefers-reduced-motion: reduce)");
        sync();
        const syncEnvironment = () => { if (state.mode === "system" || state.reducedMotion === "system") sync(); };
        media.addEventListener("change", syncEnvironment);
        motionMedia.addEventListener("change", syncEnvironment);
        listeners.add(sync);
        scope.effect(() => () => { listeners.delete(sync); media.removeEventListener("change", syncEnvironment); motionMedia.removeEventListener("change", syncEnvironment); removeTheme?.(); document.getElementById("dca-theme-extras")?.remove(); }, "dsh-codex-appearance: theme controls");
      });
      ctx.slots.inject("settings.section", () => ctx.slots.register({name:"settings.section",id:"codex-appearance",order:5,label:"外观"},SettingsPage));
    }
    return {apply, inject:["slots"]};
  }
});
