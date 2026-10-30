# -*- coding: utf-8 -*-
"""对比浅色模式下"文件链接"的现行色与候选色（同一张纸面上的实际观感）。"""
import os
from PIL import Image, ImageDraw, ImageFont

LINK_BLUE = "#2F6FD0"
THEMES = {
    "暖白": ("#F1F1EE", "#262F3C", "#244F94"),
    "米纸": ("#F2EBDC", "#3B3226", "#624813"),
    "豆沙绿": ("#E1E7DB", "#2C3228", "#2F5223"),
    "雾蓝": ("#E0E6ED", "#293139", "#1B4A7C"),
    "石墨": ("#EDECEA", "#2E2E2C", "#354F6A"),
}
FONT = "C:/Windows/Fonts/msyh.ttc"
FONT_B = "C:/Windows/Fonts/msyhbd.ttc"


def mix(a, b, r):
    return "#" + "".join("%02X" % round(int(a[i:i+2], 16) * (1 - r) + int(b[i:i+2], 16) * r) for i in (1, 3, 5))


def current(lk, fg):
    return mix(mix(lk, LINK_BLUE, .7), fg, .12)


def candidate(lk):
    return mix(mix(lk, LINK_BLUE, .72), "#1E3A5F", .20)


def panel(d, x, y, w, h, content, fg, cur, cand, name):
    d.rounded_rectangle([x, y, x + w, y + h], 10, fill=content)
    f_t = ImageFont.truetype(FONT_B, 13)
    f_s = ImageFont.truetype(FONT, 12)
    f_b = ImageFont.truetype(FONT, 13)
    d.text((x + 14, y + 12), name, font=f_t, fill=fg)
    d.text((x + 14, y + 40), "本轮修改（仅前端）", font=f_b, fill=fg)
    d.text((x + 14, y + 64), "取消", font=f_s, fill=mix(fg, content, .45))
    # 现行
    cy = y + 96
    d.text((x + 14, cy), "现行", font=f_s, fill=mix(fg, content, .45))
    d.text((x + 48, cy), "MrQualityControl.js", font=f_b, fill=cur)
    tw = d.textlength("MrQualityControl.js", font=f_b)
    for dx in range(0, int(tw), 3):
        d.point([(x + 48 + dx, cy + 19)], fill=cur)
    # 候选
    cy += 34
    d.text((x + 14, cy), "候选", font=f_s, fill=mix(fg, content, .45))
    d.text((x + 48, cy), "MrQualityControl.js", font=f_b, fill=cand)
    for dx in range(0, int(tw), 3):
        d.point([(x + 48 + dx, cy + 19)], fill=cand)
    d.text((x + 14, y + h - 22), f"ΔE {_de(cur, fg):.0f} → {_de(cand, fg):.0f}", font=f_s, fill=mix(fg, content, .5))


def _de(a, b):
    from theme_metrics import de2000
    return de2000(a, b)


if __name__ == "__main__":
    pw, ph, gap = 268, 190, 12
    W, H = len(THEMES) * (pw + gap) + gap, ph + gap * 2
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (name, (content, fg, lk)) in enumerate(THEMES.items()):
        panel(d, gap + i * (pw + gap), gap, pw, ph, content, fg, current(lk, fg), candidate(lk), name)
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "light-links.png"))
    img.save(out)
    print("saved", out, img.size)
