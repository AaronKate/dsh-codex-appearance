# -*- coding: utf-8 -*-
"""行内代码底色四方案对比：现状 / A 仅加描边 / B 淡底+描边 / C 淡底+强调色+描边。"""
import os
from PIL import Image, ImageDraw, ImageFont
from theme_metrics import contrast, lch

THEMES = {
    "米纸": ("#F2EBDC", "#3B3226", "#8A6A2A"),
    "豆沙绿": ("#E1E7DB", "#2C3228", "#4A7A3A"),
    "雾蓝": ("#E0E6ED", "#293139", "#2C74BB"),
    "暖白": ("#F1F1EE", "#262F3C", "#339CFF"),
    "石墨": ("#EDECEA", "#2E2E2C", "#4A6B8A"),
}
FONT = "C:/Windows/Fonts/msyh.ttc"
FBC = "C:/Windows/Fonts/consola.ttf"
FB = "C:/Windows/Fonts/msyhbd.ttc"
CT = 0.4


def mix(a, b, r):
    return "#" + "".join("%02X" % round(int(a[i:i+2], 16) * (1 - r) + int(b[i:i+2], 16) * r) for i in (1, 3, 5))


def now_bg(c, fg):
    return mix(c, fg, .060 + CT * .150)


def variants(c, fg, ac):
    b = lambda bg: mix(bg, fg, .20)
    light = mix(c, fg, .055)
    tint = mix(mix(c, fg, .075), ac, .08)
    return [
        ("现状：ΔL*7.8 无描边", now_bg(c, fg), None),
        ("A：仅加发丝边", now_bg(c, fg), b(now_bg(c, fg))),
        ("B：淡底 ΔL*3.5 + 边", light, b(light)),
        ("C：淡底+强调色8% + 边", tint, b(tint)),
    ]


def panel(d, x, y, w, h, name, c, fg, ac):
    d.rounded_rectangle([x, y, x + w, y + h], 10, fill=c)
    d.text((x + 12, y + 8), name, font=ImageFont.truetype(FB, 12), fill=fg)
    yy = y + 32
    for label, bg, border in variants(c, fg, ac):
        d.text((x + 12, yy), label, font=ImageFont.truetype(FONT, 9), fill=mix(fg, c, .55))
        bx0, by0, bx1 = x + 12, yy + 13, x + w - 12
        d.rounded_rectangle([bx0, by0, bx1, by0 + 40], 5, fill=bg, outline=border or bg)
        d.text((bx0 + 5, by0 + 4), "OutpatientManyRcru", font=ImageFont.truetype(FBC, 11), fill=fg)
        d.text((bx0 + 5, by0 + 20), "lePost", font=ImageFont.truetype(FBC, 11), fill=fg)
        yy += 56


if __name__ == "__main__":
    pw, ph, gap = 232, 266, 10
    W, H = len(THEMES) * (pw + gap) + gap, ph + gap * 2
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (n, (c, fg, ac)) in enumerate(THEMES.items()):
        panel(d, gap + i * (pw + gap), gap, pw, ph, n, c, fg, ac)
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "inline-code.png"))
    img.save(out)
    print("saved", out, img.size)
