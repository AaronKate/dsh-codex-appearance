# -*- coding: utf-8 -*-
"""呼吸强度三代对比：v2(弱) / v3(太强) / v4(收敛)，按真实尺寸 51px 渲染。"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE = (0x41, 0x76, 0xE6)
CREAM = (0xF1, 0xF1, 0xEE)
FONT = "C:/Windows/Fonts/msyh.ttc"


def ring(d, cc, r, px, alpha, color):
    for k in range(px):
        t = 1 if px == 1 else k / (px - 1)
        a = alpha * (1 - 0.25 * t)
        col = tuple(round(BASE[i] * (1 - a) + color[i] * a) for i in range(3))
        d.ellipse([cc - r + k, cc - r + k, cc + r - k, cc + r - k], outline=col, width=1)


def frame(kind):
    S = 62
    img = Image.new("RGB", (S, S), CREAM)
    d = ImageDraw.Draw(img)
    c = S / 2
    scale = {"weak": 1.0, "strong": 1.10, "v4": 1.035}[kind]
    r = (S - 16) / 2 * scale
    body = BASE
    if kind == "strong":
        for i in range(9, 0, -1):
            a = 0.5 * (i / 9)
            d.ellipse([c - r - i, c - r - i, c + r + i, c + r + i],
                      outline=tuple(round(BASE[j] * (1 - a) + 0x0F * a) if j != 2 else round(BASE[j] * (1 - a) + 0x7E * a) for j in range(3)), width=2)
        body = tuple(min(255, round(v * 1.35)) for v in BASE)
        d.ellipse([c - r, c - r, c + r, c + r], fill=body)
        ring(d, c, r, 3, 1.0, (0x0F, 0x2F, 0x7E))
        ring(d, c, r - 3, 2, 0.95, (0xFF, 0xFF, 0xFF))
    elif kind == "v4":
        for i in range(5, 0, -1):
            a = 0.22 * (i / 5)
            d.ellipse([c - r - i, c - r - i, c + r + i, c + r + i],
                      outline=tuple(round(BASE[j] * (1 - a) + (0x2F, 0x5F, 0xB8)[j] * a) for j in range(3)), width=2)
        d.ellipse([c - r, c - r, c + r, c + r], fill=body)
        ring(d, c, r, 2, 0.55, (0x2F, 0x5F, 0xB8))
    else:
        d.ellipse([c - r, c - r, c + r, c + r], fill=body)
        ring(d, c, r, 1, 0.2, (0xFF, 0xFF, 0xFF))
    b = 9
    d.rounded_rectangle([c - b, c - b, c + b, c + b], radius=3, fill=(255, 255, 255))
    return img


if __name__ == "__main__":
    cases = [("weak", "v2 太弱"), ("strong", "v3 太强（你截图这版）"), ("v4", "v4 收敛：单环 2px")]
    W, H = 74 * len(cases) + 16, 96
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (kind, label) in enumerate(cases):
        img.paste(frame(kind), (8 + i * 74, 8))
        d.text((8 + i * 74, 74), label, font=ImageFont.truetype(FONT, 9), fill="#3B3226")
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "breathe-v4.png"))
    img.save(out)
    print("saved", out, img.size)
