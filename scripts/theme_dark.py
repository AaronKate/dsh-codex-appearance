# -*- coding: utf-8 -*-
"""生成五套深色主题的对比图（与插件里的推导式一致：表面色由 background 朝 foreground 混出）。"""
import os
from PIL import Image, ImageDraw

from theme_compare import draw_panel

def mix(a, b, r):
    return "#" + "".join("%02X" % round(int(a[i:i+2], 16) * (1 - r) + int(b[i:i+2], 16) * r) for i in (1, 3, 5))

DARK = {
    "蓝灰 slate": ("#2A313A", "#1B2028", "#DAD6D6", "#339CFF"),
    "纯黑 black": ("#121416", "#090A0B", "#D3D6D9", "#5AA9FF"),
    "北境 nord": ("#2E3440", "#21262F", "#D8DEE9", "#88C0D0"),
    "暖褐 ember": ("#2B2721", "#1C1915", "#E2D8C7", "#D79B54"),
    "墨绿 pine": ("#1F2823", "#141C18", "#D0DDD4", "#6FB98F"),
}

def palette(bg, base, fg, accent):
    return {
        "content": mix(base, fg, .12),
        "foreground": fg, "accent": accent, "link": mix(accent, "#FFFFFF", .62),
        "base": base, "platform": mix(bg, fg, .07),
        "sidebarGlassFill": base, "sidebarButton": mix(bg, fg, .14),
        "sidebarButtonHover": mix(bg, fg, .22), "sidebarButtonBorder": mix(bg, fg, .18),
        "sidebarSelected": mix(bg, fg, .20), "sidebarRowHover": mix(bg, fg, .12),
        "bubble": mix(bg, fg, .10), "inputFill": mix(bg, fg, .14),
    }

if __name__ == "__main__":
    panels = [(name, palette(*spec), "深色") for name, spec in DARK.items()]
    pw, ph, gap = 300, 236, 14
    W, H = len(panels) * (pw + gap) + gap, ph + gap * 2 + 8
    img = Image.new("RGB", (W, H), "#D8D8D8")
    d = ImageDraw.Draw(img)
    for i, (name, pal, note) in enumerate(panels):
        draw_panel(d, gap + i * (pw + gap), gap, pw, ph, pal, name, note)
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "dark-themes.png"))
    img.save(out)
    print("saved", out, img.size)
