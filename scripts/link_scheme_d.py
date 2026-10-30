# -*- coding: utf-8 -*-
"""方案 D：每套浅色主题一个专属链接色（不再五套收敛到同一个蓝） vs 现行统一蓝。"""
import os
from PIL import Image, ImageDraw, ImageFont
from theme_metrics import contrast, de2000, lch

BLUE = "#2F6FD0"
# 现行（统一蓝）与方案 D（专属链接色）
ROWS = [
    ("暖白", "#F1F1EE", "#262F3C", "#244F94", "#244F94"),
    ("米纸", "#F2EBDC", "#3B3226", "#624813", "#4A3B6B"),
    ("豆沙绿", "#E1E7DB", "#2C3228", "#2F5223", "#24596B"),
    ("雾蓝", "#E0E6ED", "#293139", "#1B4A7C", "#1B4A7C"),
    ("石墨", "#EDECEA", "#2E2E2C", "#354F6A", "#354F6A"),
]
FONT = "C:/Windows/Fonts/msyh.ttc"
FB = "C:/Windows/Fonts/msyhbd.ttc"


def mix(a, b, r):
    return "#" + "".join("%02X" % round(int(a[i:i+2], 16) * (1 - r) + int(b[i:i+2], 16) * r) for i in (1, 3, 5))


def now_color(lk, fg):
    return mix(mix(lk, BLUE, .7), fg, .12)


def panel(d, x, y, w, h, name, content, fg, a, b):
    card = mix(content, fg, .044)
    d.rounded_rectangle([x, y, x + w, y + h], 10, fill=content)
    d.text((x + 12, y + 9), name, font=ImageFont.truetype(FB, 13), fill=fg)
    d.text((x + 12, y + 32), "本轮修改（仅前端）", font=ImageFont.truetype(FONT, 13), fill=fg)
    f_s = ImageFont.truetype(FONT, 11)
    f_l = ImageFont.truetype(FONT, 12)
    yy = y + 62
    for label, color in (("现行", a), ("方案D", b)):
        d.text((x + 12, yy), label, font=f_s, fill=mix(fg, content, .45))
        d.text((x + 54, yy - 2), "MrQualityControl.js:118", font=f_l, fill=color)
        tw = d.textlength("MrQualityControl.js:118", font=f_l)
        for dx in range(0, int(tw), 3):
            d.point([(x + 54 + dx, yy + 15)], fill=color)
        d.text((x + w - 46, yy), f"ΔE{de2000(color, fg):.0f}", font=f_s, fill=mix(fg, content, .55))
        yy += 30
    d.text((x + 12, y + h - 20), f"卡片对比 {contrast(card, a):.2f} → {contrast(card, b):.2f}", font=f_s, fill=mix(fg, content, .5))


if __name__ == "__main__":
    pw, ph, gap = 250, 168, 10
    W, H = len(ROWS) * (pw + gap) + gap, ph + gap * 2
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (name, content, fg, lk, dlink) in enumerate(ROWS):
        panel(d, gap + i * (pw + gap), gap, pw, ph, name, content, fg, now_color(lk, fg), dlink)
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "link-scheme-d.png"))
    img.save(out)
    print("saved", out, img.size)
    for name, content, fg, lk, dlink in ROWS:
        card = mix(content, fg, .044)
        a = now_color(lk, fg)
        L, C, h = lch(dlink)
        hf = lch(fg)[2]
        print(f"  {name} 现行 {a} 卡片{contrast(card,a):.2f} ΔE{de2000(a,fg):.0f} | D {dlink} 卡片{contrast(card,dlink):.2f} C*{C:.0f} h{h:.0f}(正文h{hf:.0f}) ΔE{de2000(dlink,fg):.0f}")
