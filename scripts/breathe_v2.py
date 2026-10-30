# -*- coding: utf-8 -*-
"""呼吸强度：按用户截图实测的按钮色 #4176E6 复现旧/新两版在真实尺寸（51px @150%）下的样子。"""
import os
from PIL import Image, ImageDraw, ImageFont

BASE = (0x41, 0x76, 0xE6)
CREAM = (0xF7, 0xF3, 0xE9)
FONT = "C:/Windows/Fonts/msyh.ttc"
FB = "C:/Windows/Fonts/msyhbd.ttc"


def frame(ring_px, ring_alpha, glow, scale, label):
    S = 62
    img = Image.new("RGB", (S, S), CREAM)
    d = ImageDraw.Draw(img)
    c = S / 2
    r = (S - 12) / 2 * scale
    # 外圈柔光
    if glow:
        for i in range(6, 0, -1):
            a = int(255 * glow * (i / 6) * 0.5)
            d.ellipse([c - r - i, c - r - i, c + r + i, c + r + i], outline=(255, 255, 255, a), width=2)
    d.ellipse([c - r, c - r, c + r, c + r], fill=BASE)
    # 内环：用近似 alpha 混合画出
    for k in range(ring_px):
        t = 1 - k / max(1, ring_px)
        col = tuple(round(BASE[i] * (1 - ring_alpha * t) + 255 * ring_alpha * t) for i in range(3))
        d.ellipse([c - r + k, c - r + k, c + r - k, c + r - k], outline=col, width=1)
    # 图标
    b = 9
    d.rounded_rectangle([c - b, c - b, c + b, c + b], radius=3, fill=(255, 255, 255))
    return img, label


if __name__ == "__main__":
    cases = [
        (2, 0.20, 0.0, 1.0, "旧：2px / 20%"),
        (2, 0.38, 0.0, 1.0, "新：谷值 2px / 38%"),
        (3, 0.95, 1.0, 1.06, "新：峰值 3px / 95% + 光 + 1.06x"),
    ]
    W = len(cases) * 74 + 16
    H = 92
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (rp, ra, gl, sc, label) in enumerate(cases):
        fr, _ = frame(rp, ra, gl, sc, label)
        img.paste(fr, (8 + i * 74, 8))
        d.text((8 + i * 74, 74), label, font=ImageFont.truetype(FONT, 9), fill="#3B3226")
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "breathe-v2.png"))
    img.save(out)
    print("saved", out, img.size)
