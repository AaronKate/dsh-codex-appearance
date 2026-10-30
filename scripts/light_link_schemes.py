# -*- coding: utf-8 -*-
"""浅色链接色三方案对比：A 现状统一蓝 / C 与主题色五五混 / B 完全主题化（用 theme.link）。"""
import os
from PIL import Image, ImageDraw, ImageFont
from theme_metrics import contrast, de2000, lch

BLUE = "#2F6FD0"
THEMES = {
    "暖白": ("#F1F1EE", "#262F3C", "#244F94"),
    "米纸": ("#F2EBDC", "#3B3226", "#624813"),
    "豆沙绿": ("#E1E7DB", "#2C3228", "#2F5223"),
    "雾蓝": ("#E0E6ED", "#293139", "#1B4A7C"),
    "石墨": ("#EDECEA", "#2E2E2C", "#354F6A"),
}
FONT = "C:/Windows/Fonts/msyh.ttc"
FB = "C:/Windows/Fonts/msyhbd.ttc"


def mix(a, b, r):
    return "#" + "".join("%02X" % round(int(a[i:i+2], 16) * (1 - r) + int(b[i:i+2], 16) * r) for i in (1, 3, 5))


def fit(color, fg, card, target=4.8):
    out = color
    for i in range(0, 61):
        t = mix(color, fg, i / 100)
        out = t
        if contrast(card, t) >= target:
            return t
    return out


def variants(fg, lk):
    card = "#FFFFFF"
    return {
        "A 现状(蓝70%)": fit(mix(lk, BLUE, .7), fg, card),
        "C 五五混": fit(mix(lk, BLUE, .5), fg, card),
        "B 主题 link": fit(lk, fg, card),
    }


def panel(d, x, y, w, h, name, content, fg, lk):
    card = mix(content, fg, .044)
    d.rounded_rectangle([x, y, x + w, y + h], 10, fill=content)
    f_b = ImageFont.truetype(FB, 13)
    f_s = ImageFont.truetype(FONT, 11)
    d.text((x + 12, y + 9), name, font=f_b, fill=fg)
    d.text((x + 12, y + 32), "删除临时文件", font=ImageFont.truetype(FONT, 13), fill=fg)
    yy = y + 58
    for label, color in [("A", fit(mix(lk, BLUE, .7), fg, card)),
                         ("C", fit(mix(lk, BLUE, .5), fg, card)),
                         ("B", fit(lk, fg, card))]:
        d.text((x + 12, yy), label, font=f_s, fill=mix(fg, content, .45))
        d.text((x + 30, yy - 2), "MrQualityControl.js:118", font=ImageFont.truetype(FONT, 12), fill=color)
        tw = d.textlength("MrQualityControl.js:118", font=ImageFont.truetype(FONT, 12))
        for dx in range(0, int(tw), 3):
            d.point([(x + 30 + dx, yy + 15)], fill=color)
        de = de2000(color, fg)
        d.text((x + w - 52, yy), f"ΔE{de:.0f}", font=f_s, fill=mix(fg, content, .55))
        yy += 26
    d.text((x + 12, y + h - 18), f"卡片对比 {contrast(card, fit(lk, fg, card)):.2f}", font=f_s, fill=mix(fg, content, .5))


if __name__ == "__main__":
    pw, ph, gap = 250, 176, 10
    W, H = len(THEMES) * (pw + gap) + gap, ph + gap * 2
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (name, (content, fg, lk)) in enumerate(THEMES.items()):
        panel(d, gap + i * (pw + gap), gap, pw, ph, name, content, fg, lk)
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "light-link-schemes.png"))
    img.save(out)
    print("saved", out, img.size)
    for name, (content, fg, lk) in THEMES.items():
        card = mix(content, fg, .044)
        for label, color in [("A", fit(mix(lk, BLUE, .7), fg, card)), ("C", fit(mix(lk, BLUE, .5), fg, card)), ("B", fit(lk, fg, card))]:
            L, C, h = lch(color)
            print(f"  {name} {label} {color} 卡片{contrast(card,color):.2f} C*{C:.0f} h{h:.0f} ΔE{de2000(color, fg):.0f}")
