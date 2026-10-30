# -*- coding: utf-8 -*-
"""侧栏会话选中态四方案对比：现状 / A 降档 / B 强调色淡染 / C 原色 + 左侧强调条。"""
import os
from PIL import Image, ImageDraw, ImageFont
from theme_metrics import lch, contrast

THEMES = {
    "米纸": ("#EAE2D4", "#3B3226", "#DED3C0", "#8A6A2A"),
    "豆沙绿": ("#D7DED1", "#2C3228", "#D2D9CC", "#4A7A3A"),
}
FONT = "C:/Windows/Fonts/msyh.ttc"
FB = "C:/Windows/Fonts/msyhbd.ttc"
ROW_TXT = "豆沙绿与米纸色对比"


def mix(a, b, r):
    return "#" + "".join("%02X" % round(int(a[i:i+2], 16) * (1 - r) + int(b[i:i+2], 16) * r) for i in (1, 3, 5))


def variants(sb, fg, sel, ac):
    return [
        ("现状  mix .12", mix(sel, fg, .12), None),
        ("A  降档  mix .06", mix(sel, fg, .06), None),
        ("B  强调色 .14", mix(sb, ac, .14), None),
        ("C  原色 + 左条", sel, ac),
    ]


def panel(d, x, y, w, h, name, sb, fg, sel, ac):
    d.rounded_rectangle([x, y, x + w, y + h], 10, fill=sb)
    d.text((x + 14, y + 10), name, font=ImageFont.truetype(FB, 12), fill=fg)
    d.text((x + 14, y + 30), "侧栏会话选中态", font=ImageFont.truetype(FONT, 10), fill=mix(fg, sb, .4))
    yy = y + 50
    for label, bg, bar in variants(sb, fg, sel, ac):
        d.rounded_rectangle([x + 10, yy, x + w - 10, yy + 34], 8, fill=bg)
        if bar:
            d.rounded_rectangle([x + 12, yy + 8, x + 16, yy + 26], 2, fill=bar)
        d.text((x + 26, yy + 4), ROW_TXT, font=ImageFont.truetype(FONT, 11), fill=fg)
        d.text((x + 26, yy + 20), f"{label}   ΔL*{lch(sb)[0]-lch(bg)[0]:.1f}   文字 {contrast(bg, fg):.1f}:1",
               font=ImageFont.truetype(FONT, 9), fill=mix(fg, sb, .55))
        yy += 40


if __name__ == "__main__":
    pw, ph, gap = 236, 236, 12
    W, H = len(THEMES) * (pw + gap) + gap, ph + gap * 2
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (n, (sb, fg, sel, ac)) in enumerate(THEMES.items()):
        panel(d, gap + i * (pw + gap), gap, pw, ph, n, sb, fg, sel, ac)
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "sidebar-selected.png"))
    img.save(out)
    print("saved", out, img.size)
