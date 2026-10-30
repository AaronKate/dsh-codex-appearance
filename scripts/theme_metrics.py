# -*- coding: utf-8 -*-
"""计算主题色板的 CIE LCh 与色差，用于判断两套主题是否真正可区分。"""
import math
import sys

def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hex_to_xyz(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    r, g, b = srgb_to_lin(r), srgb_to_lin(g), srgb_to_lin(b)
    x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
    y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750
    z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041
    # D65 白点
    xn, yn, zn = 0.95047, 1.0, 1.08883
    return x / xn, y / yn, z / zn

def f(t):
    return t ** (1 / 3) if t > (6 / 29) ** 3 else t / (3 * (6 / 29) ** 2) + 4 / 29

def lab(h):
    x, y, z = hex_to_xyz(h)
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))

def lch(h):
    L, a, b = lab(h)
    return L, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360

def de2000(h1, h2):
    L1, a1, b1 = lab(h1)
    L2, a2, b2 = lab(h2)
    C1, C2 = math.hypot(a1, b1), math.hypot(a2, b2)
    Cb = (C1 + C2) / 2
    G = 0.5 * (1 - math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
    a1p, a2p = a1 * (1 + G), a2 * (1 + G)
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360 if C1p else 0
    h2p = math.degrees(math.atan2(b2, a2p)) % 360 if C2p else 0
    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0
    else:
        dhp = h2p - h1p
        if dhp > 180: dhp -= 360
        elif dhp < -180: dhp += 360
    dHp = 2 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp) / 2)
    Lb = (L1 + L2) / 2
    Cbp = (C1p + C2p) / 2
    if C1p * C2p == 0:
        hbp = h1p + h2p
    else:
        hbp = (h1p + h2p) / 2
        if abs(h1p - h2p) > 180:
            hbp += 180 if (h1p + h2p) < 360 else -180
    T = (1 - 0.17 * math.cos(math.radians(hbp - 30)) + 0.24 * math.cos(math.radians(2 * hbp))
         + 0.32 * math.cos(math.radians(3 * hbp + 6)) - 0.20 * math.cos(math.radians(4 * hbp - 63)))
    SL = 1 + 0.015 * (Lb - 50) ** 2 / math.sqrt(20 + (Lb - 50) ** 2)
    SC = 1 + 0.045 * Cbp
    SH = 1 + 0.015 * Cbp * T
    RT = (-2 * math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7))
          * math.sin(math.radians(60 * math.exp(-(((hbp - 275) / 25) ** 2)))))
    return math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2
                     + RT * (dCp / SC) * (dHp / SH))

def contrast(h1, h2):
    def lum(h):
        x, y, z = hex_to_xyz(h)
        return 0.2126 * srgb_to_lin(int(h[1:3], 16)) + 0.7152 * srgb_to_lin(int(h[3:5], 16)) + 0.0722 * srgb_to_lin(int(h[5:7], 16))
    a, b = sorted((lum(h1), lum(h2)), reverse=True)
    return (a + 0.05) / (b + 0.05)

def temp(h):
    """粗估相关色温（McCamy 近似）。"""
    hh = h.lstrip("#")
    r, g, b = (int(hh[i:i + 2], 16) for i in (0, 2, 4))
    X = 0.4124 * r + 0.3576 * g + 0.1805 * b
    Y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    Z = 0.0193 * r + 0.1192 * g + 0.9505 * b
    s = X + Y + Z
    x, y = X / s, Y / s
    n = (x - 0.3320) / (0.1858 - y)
    return 449 * n ** 3 + 3525 * n ** 2 + 6823.3 * n + 5520.33

def row(name, h):
    L, C, hu = lch(h)
    return f"{name:<6} {h}  L*{L:5.1f}  C*{C:4.1f}  h{hu:5.1f}  {temp(h):5.0f}K"

if __name__ == "__main__":
    themes = {
        "暖白": dict(content="#F1F1EE", foreground="#262F3C", accent="#1F6FEB", link="#244F94",
                     base="#F9FAFB", sidebarGlassFill="#E8E8E5", bubble="#F7F7F6"),
        "米纸": dict(content="#F2EBDC", foreground="#3B3226", accent="#8A6A2A", link="#624813",
                     base="#F6F1E7", sidebarGlassFill="#EAE2D4", bubble="#F7F2E8"),
        "豆沙绿": dict(content="#ECEADC", foreground="#33301F", accent="#4A7A3A", link="#2F5223",
                      base="#F2F0E4", sidebarGlassFill="#E4E1D2", bubble="#F5F3E7"),
        "雾蓝": dict(content="#ECEFF4", foreground="#2A3138", accent="#2F7BC4", link="#1D5085",
                     base="#F3F5F8", sidebarGlassFill="#E3E6EB", bubble="#F3F5F8"),
        "石墨": dict(content="#EDECEA", foreground="#2E2E2C", accent="#4A6B8A", link="#354F6A",
                     base="#F3F2F1", sidebarGlassFill="#E4E3E1", bubble="#F3F3F1"),
    }
    roles = ["content", "foreground", "accent", "link", "base", "sidebarGlassFill", "bubble"]
    for t, pal in themes.items():
        print(f"\n== {t}")
        for r in roles:
            print("   ", row(r, pal[r]))
        print(f"    正文对比 {contrast(pal['content'], pal['foreground']):5.2f}:1"
              f"  链接 {contrast(pal['content'], pal['link']):5.2f}:1"
              f"  强调 {contrast(pal['content'], pal['accent']):5.2f}:1")

    print("\n== 主题间纸面色差 ΔE00（content）")
    names = list(themes)
    print("        " + "".join(f"{n:>7}" for n in names))
    for a in names:
        cells = []
        for b in names:
            cells.append(f"{de2000(themes[a]['content'], themes[b]['content']):7.1f}")
        print(f"{a:<6}" + "".join(cells))
    print("\n== 主题间正文色差 ΔE00（foreground）")
    for a in names:
        cells = [f"{de2000(themes[a]['foreground'], themes[b]['foreground']):7.1f}" for b in names]
        print(f"{a:<6}" + "".join(cells))
