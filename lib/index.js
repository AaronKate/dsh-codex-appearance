/**
 * Host side of dsh-eye-comfort.
 *
 * The browser cannot enumerate installed fonts: `queryLocalFonts()` needs a permission the
 * DSH host never grants, and there is no other web API for the local font catalog. The theme
 * therefore used to offer four coarse families plus a hand-maintained candidate list, which
 * meant any font outside that list was invisible in the picker.
 *
 * Here we read the real list from the OS and expose it on a small read-only route under the
 * plugin's own prefix. The client fetches it once and merges it into the picker. Nothing is
 * written, and the payload is only family names.
 */
import { execFileSync } from "node:child_process";

/** Route path, kept under the plugin's namespace so it cannot collide with another plugin. */
const FONTS_PATH = "/api/dsh-eye-comfort/fonts";

/** @type {string[] | null} */
let cache = null;

/**
 * Windows: the system font catalog is exposed through GDI+. Enumerating it is the only
 * reliable API available without native modules, and it is what Win32 itself reports.
 * @returns {string[]}
 */
function windowsFonts() {
  // 输出编码是这个探测的唯一陷阱：powershell.exe 默认按系统 ANSI 代码页（简体中文机器上是
  // GBK）写出，而 Node 按 UTF-8 解码，纯中文字体名（微软雅黑、宋体、华文楷体…）会整条变成
  // 替换字符并被去重合并掉。先把 Console::OutputEncoding 钉成 UTF-8，再输出。
  const script = [
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    "$OutputEncoding = [System.Text.Encoding]::UTF8",
    "Add-Type -AssemblyName System.Drawing",
    "(New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }",
  ].join("; ");
  const out = execFileSync(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    { encoding: "utf8", windowsHide: true, timeout: 15000, maxBuffer: 4 * 1024 * 1024 },
  );
  return out.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
}

/**
 * macOS: `system_profiler` reports the installed families. Linux: fontconfig's `fc-list`
 * is the authority and every desktop ships it. Both are plain text / JSON — no native deps.
 * @returns {string[] | null}
 */
function unixFonts() {
  try {
    if (process.platform === "darwin") {
      const out = execFileSync("system_profiler", ["SPFontsDataType", "-json"], {
        encoding: "utf8",
        timeout: 20000,
        maxBuffer: 16 * 1024 * 1024,
      });
      const families = [];
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== "object") return;
        if (typeof node._name === "string" && node._name) families.push(node._name);
        for (const value of Object.values(node)) walk(value);
      };
      walk(JSON.parse(out));
      return families;
    }
    const out = execFileSync("fc-list", ["-f", "%{family}\n"], {
      encoding: "utf8",
      timeout: 15000,
      maxBuffer: 16 * 1024 * 1024,
    });
    // fc-list prints comma-separated aliases per face ("Noto Sans,Noto Sans CJK SC").
    const families = new Set();
    for (const line of out.split("\n")) {
      for (const alias of line.split(",")) {
        const name = alias.trim();
        if (name) families.add(name);
      }
    }
    return [...families];
  } catch {
    return null;
  }
}

/**
 * Read (and memoise) the installed font families. A failed probe is cached as an empty list:
 * retrying per request would run a subprocess on every settings render, and a machine whose
 * font catalog cannot be read is not going to start reporting it a second later.
 * @returns {string[]}
 */
export function installedFonts() {
  if (cache !== null) return cache;
  let families = null;
  try {
    families = process.platform === "win32" ? windowsFonts() : unixFonts();
  } catch {
    families = null;
  }
  cache = [...new Set((families ?? []).map((name) => String(name).trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  return cache;
}

/**
 * Register the read-only route. Returns a disposer, matching the Cordis effect contract.
 *
 * The route is admitted through Connection's fence when that service is present (Host/Origin
 * check plus the browser session cookie), so another site open in the same browser cannot read
 * the machine's font catalog — the list is fingerprinting-grade data. `connection` is optional
 * only so an older host still serves the route; when it is present the fence always applies.
 * @param {any} ctx
 */
export function registerFontsRoute(ctx) {
  return ctx.webServer.register({
    kind: "exact",
    path: FONTS_PATH,
    handler: async (request, response) => {
      const connection = ctx.get?.("connection");
      if (connection?.admit) {
        let admission;
        try {
          admission = connection.admit(request);
        } catch {
          // Fail closed: a fence that cannot decide must not hand out the font list.
          response.writeHead(403);
          response.end("forbidden");
          return;
        }
        if (admission && typeof admission === "object" && "rejection" in admission) {
          response.writeHead(admission.rejection);
          response.end(admission.rejection === 401 ? "unauthorized" : "forbidden");
          return;
        }
      }
      if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, { allow: "GET, HEAD" });
        response.end();
        return;
      }
      const fonts = installedFonts();
      const body = JSON.stringify({ platform: process.platform, fonts });
      response.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-cache",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    },
  });
}

export const inject = ["webServer"];

/** @param {any} ctx */
export async function apply(ctx) {
  const dispose = registerFontsRoute(ctx);
  return () => dispose();
}
