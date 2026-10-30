# -*- coding: utf-8 -*-
"""停止按钮呼吸光晕的三帧示意：白圈透明度 0.18 → 0.72 → 0.18（2.6s 一轮）。"""
import os
from PIL import Image, ImageDraw, ImageFont

BG = "#F2EBDC"
FILL = "#339CFF"
FONT = "C:/Windows/Fonts/msyh.ttc"
FB = "C:/Windows/Fonts/msyhbd.ttc"


def frame(size, ring_alpha, glow):
    S = size * 4  # 4x 超采样
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = int(S * 0.10)
    # 外发光
    if glow > 0:
        for i in range(10, 0, -1):
            a = int(255 * glow * (i / 10) * 0.25)
            d.ellipse([pad - i * 2, pad - i * 2, S - pad + i * 2, S - pad + i * 2], outline=(255, 255, 255, a), width=3)
    # 按钮本体
    d.ellipse([pad, pad, S - pad, S - pad], fill=FILL)
    # 内侧 2px 白圈
    w = max(2, int(S * 0.02))
    d.ellipse([pad + w // 2, pad + w // 2, S - pad - w // 2, S - pad - w // 2],
              outline=(255, 255, 255, int(255 * ring_alpha)), width=w)
    # 停止图标（方块）
    b = int(S * 0.11)
    c = S // 2
    d.rounded_rectangle([c - b, c - b, c + b, c + b], radius=int(b * 0.3), fill=(255, 255, 255, 255))
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    size, gap = 108, 26
    frames = [(0.18, 0.0, "0.0s / 起"), (0.72, 1.0, "1.3s / 峰"), (0.18, 0.0, "2.6s / 收")]
    W = len(frames) * size + (len(frames) + 1) * gap
    H = size + gap * 2 + 22
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    for i, (ra, glow, label) in enumerate(frames):
        fr = frame(size, ra, glow)
        x = gap + i * (size + gap)
        img.paste(fr, (x, gap), fr)
        d.text((x + 8, gap + size + 4), label, font=ImageFont.truetype(FONT, 11), fill="#5A5449")
    d.text((gap, 2), "会话进行时：停止按钮内侧白圈呼吸（2.6s）", font=ImageFont.truetype(FB, 11), fill="#3B3226")
    out = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "breathe-button.png"))
    img.save(out)
    print("saved", out, img.size)
