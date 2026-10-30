# -*- coding: utf-8 -*-
"""生成豆沙绿候选色板（A/B/C），并与米纸、旧豆沙绿一起画成对比图。

所有颜色都由 L*/C*/h 目标反解得到，明度层次沿用现行色板的相对关系：
纸面 -> 气泡 +3.4L、侧栏 -3.2L、输入框 +1.2L。
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

from theme_metrics import de2000, contrast, lch
from theme_candidates import lab_to_hex

PAPER = {  # 米纸（现行 0.3.15）
    "content": "#F2EBDC", "foreground": "#3B3226", "accent": "#8A6A2A", "link": "#624813",
    "base": "#F6F1E7", "platform": "#F4EFE4",
    "sidebarGlassFill": "#EAE2D4", "sidebarButton": "#F3ECDE", "sidebarButtonHover": "#FBF6EC",
    "sidebarButtonBorder": "#D8CDBA", "sidebarSelected": "#DED3C0", "sidebarRowHover": "#F2EBDF",
    "bubble": "#F7F2E8", "inputFill": "#F6F1E6",
}
GREEN_OLD = {  # 豆沙绿 0.3.15（本次要换掉的）
    "content": "#ECEADC", "foreground": "#33301F", "accent": "#4A7A3A", "link": "#2F5223",
    "base": "#F2F0E4", "platform": "#EFEDE1",
    "sidebarGlassFill": "#E4E1D2", "sidebarButton": "#EDEBDE", "sidebarButtonHover": "#F7F5EA",
    "sidebarButtonBorder": "#D6D3C2", "sidebarSelected": "#DCD8C7", "sidebarRowHover": "#EDEBDE",
    "bubble": "#F5F3E7", "inputFill": "#F3F1E5",
}

# 候选：纸面 (L*, C*, h)；正文另给 (L*, C*, h)。
CANDS = {
    "A 129°": ((90.8, 6.6, 129), (20.0, 7.4, 132)),
    "B 132°": ((89.4, 7.2, 132), (19.6, 7.8, 135)),
    "C 137°": ((91.8, 7.4, 137), (20.2, 7.2, 140)),
}


def family(paper_lch, fg_lch):
    L, C, h = paper_lch
    g = lambda dl, dc, dh=0: lab_to_hex(L + dl, C + dc, h + dh)
    return {
        "content": lab_to_hex(L, C, h),
        "base": g(2.4, -1.0),
        "platform": g(1.4, -0.8),
        "bubble": g(3.4, -1.2),
        "sidebarGlassFill": g(-3.2, 0.4),
        "sidebarButton": g(-1.2, 0.0),
        "sidebarButtonHover": g(3.8, -1.4),
        "sidebarButtonBorder": g(-6.8, 0.6),
        "sidebarSelected": g(-5.0, 0.4),
        "sidebarRowHover": g(-1.2, 0.0),
        "inputFill": g(1.2, -0.6),
        "foreground": lab_to_hex(*fg_lch),
        "accent": "#4A7A3A",
        "link": "#2F5223",
    }


FONT = "C:/Windows/Fonts/msyh.ttc"
FONT_B = "C:/Windows/Fonts/msyhbd.ttc"


def draw_panel(d, x, y, w, h, pal, title, note):
    px = 14
    # 侧栏
    sb = 88
    d.rectangle([x, y, x + w, y + h], fill=pal["content"])
    d.rectangle([x, y, x + sb, y + h], fill=pal["sidebarGlassFill"])
    d.rounded_rectangle([x + 10, y + 12, x + sb - 10, y + 40], 6, fill=pal["sidebarButton"],
                        outline=pal["sidebarButtonBorder"])
    for i in range(4):
        yy = y + 52 + i * 22
        if i == 1:
            d.rounded_rectangle([x + 8, yy - 5, x + sb - 8, yy + 15], 5, fill=pal["sidebarSelected"])
        else:
            d.rectangle([x + 20, yy + 2, x + sb - 20, yy + 8], fill=pal["foreground"])
    # 正文
    tx = x + sb + px
    tw = w - sb - px * 2
    d.text((tx, y + 12), title, font=ImageFont.truetype(FONT_B, 15), fill=pal["foreground"])
    ly = y + 42
    widths = [0.96, 0.88, 0.93, 0.64]
    for i in range(4):
        d.rectangle([tx, ly, tx + int(tw * widths[i]), ly + 6], fill=pal["foreground"])
        ly += 17
    # 链接行
    d.rectangle([tx, ly, tx + int(tw * 0.42), ly + 6], fill=pal["link"])
    ly += 26
    # 气泡卡片
    d.rounded_rectangle([tx, ly, tx + tw, ly + 46], 8, fill=pal["bubble"])
    for i in range(2):
        d.rectangle([tx + 10, ly + 10 + i * 14, tx + tw - 10 - int(tw * 0.2 * i), ly + 16 + i * 14],
                    fill=pal["foreground"])
    # 输入框 + 强调点
    iy = y + h - 52
    d.rounded_rectangle([tx, iy, tx + tw, iy + 40], 8, fill=pal["inputFill"],
                        outline=pal["sidebarButtonBorder"])
    d.ellipse([tx + 12, iy + 14, tx + 24, iy + 26], fill=pal["accent"])
    d.rectangle([tx + 34, iy + 18, tx + tw - 16, iy + 22], fill=pal["foreground"])
    # 脚注
    d.text((x + 6, y + h - 8), note, font=ImageFont.truetype(FONT, 10), fill=pal["foreground"])


def build(path):
    panels = [("米纸 0.3.15", PAPER, "现行"), ("豆沙绿 0.3.15", GREEN_OLD, "现行")]
    for name, (p, f) in CANDS.items():
        pal = family(p, f)
        d_ = de2000(pal["content"], PAPER["content"])
        panels.append((f"豆沙绿 {name}", pal, f"候选 ΔE00 {d_:.1f}"))

    pw, ph, gap = 300, 236, 14
    W = len(panels) * (pw + gap) + gap
    H = ph + gap * 2 + 8
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (name, pal, note) in enumerate(panels):
        x = gap + i * (pw + gap)
        draw_panel(d, x, gap, pw, ph, pal, name, note)
    img.save(path)
    print("saved", path, img.size)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "green-vs-paper.png")
    build(os.path.normpath(out))
    # 指标
    for name, (p, f) in CANDS.items():
        pal = family(p, f)
        L, C, h = lch(pal["content"])
        print(f"\n{name}  content {pal['content']} L*{L:.1f} C*{C:.1f} h{h:.0f} "
              f"ΔE(米纸) {de2000(pal['content'], PAPER['content']):.1f} "
              f"ΔE(旧豆沙绿) {de2000(pal['content'], GREEN_OLD['content']):.1f}")
        print(f"  正文 {contrast(pal['content'], pal['foreground']):.2f}:1  "
              f"链接补正前 {contrast(pal['content'], pal['link']):.2f}:1  强调 {contrast(pal['content'], pal['accent']):.2f}:1")
        print("  " + "  ".join(f"{k}={v}" for k, v in pal.items()))
