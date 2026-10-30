# -*- coding: utf-8 -*-
"""深色侧选中态：现行会话行 / 现行导航 token（偏亮）/ 建议的强调色淡染。"""
import os
from PIL import Image, ImageDraw, ImageFont
from theme_metrics import lch, contrast

THEMES = {
    "蓝灰": ("#2A313A", "#1B2028", "#DAD6D6", "#339CFF"),
    "北境": ("#2E3440", "#21262F", "#D8DEE9", "#88C0D0"),
    "暖褐": ("#2B2721", "#1C1915", "#E2D8C7", "#D79B54"),
}
FONT = "C:/Windows/Fonts/msyh.ttc"
FB = "C:/Windows/Fonts/msyhbd.ttc"
T = 0.4


def mix(a, b, r):
    return "#" + "".join("%02X" % round(int(a[i:i+2], 16) * (1 - r) + int(b[i:i+2], 16) * r) for i in (1, 3, 5))


def panel(d, x, y, w, h, name, bg, base, fg, ac):
    d.rounded_rectangle([x, y, x + w, y + h], 10, fill=base)
    d.text((x + 14, y + 10), name, font=ImageFont.truetype(FB, 12), fill=fg)
    lvl2 = mix(bg, fg, .05 + T * .065)
    rows = [
        ("会话选中（现行）", mix(base, "#FFFFFF", .06)),
        ("导航 token（现行）", mix(lvl2, fg, .14)),
        ("建议：accent .16", mix(base, ac, .16)),
        ("建议：accent .22", mix(base, ac, .22)),
    ]
    yy = y + 34
    for label, color in rows:
        d.rounded_rectangle([x + 10, yy, x + w - 10, yy + 32], 8, fill=color)
        d.text((x + 22, yy + 4), "豆沙绿与米纸色对比", font=ImageFont.truetype(FONT, 11), fill=fg)
        d.text((x + 22, yy + 19), f"{label}  ΔL*{lch(base)[0]-lch(color)[0]:+.1f}",
               font=ImageFont.truetype(FONT, 9), fill=mix(fg, base, .45))
        yy += 38


if __name__ == "__main__":
    pw, ph, gap = 240, 200, 12
    W, H = len(THEMES) * (pw + gap) + gap, ph + gap * 2
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (n, spec) in enumerate(THEMES.items()):
        panel(d, gap + i * (pw + gap), gap, pw, ph, n, *spec)
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "dark-selected.png"))
    img.save(out)
    print("saved", out, img.size)
