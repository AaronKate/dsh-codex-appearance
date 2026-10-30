# -*- coding: utf-8 -*-
"""雾蓝偏刺眼的量化与候选色板。

刺眼与"蓝"关系不大，与"亮度"关系最大：雾蓝纸面 L* 94.4 是五套里第二高（仅次暖白 95.1），
其余三套都在 91–93。同一亮度下冷色更"亮"，所以雾蓝读起来最扎眼。
"""
import os
from PIL import Image, ImageDraw, ImageFont

from theme_metrics import de2000, contrast, lch, temp
from theme_candidates import lab_to_hex
from theme_compare import family, draw_panel

WARM = {
    "content": "#F1F1EE", "foreground": "#262F3C", "accent": "#339CFF", "link": "#244F94",
    "base": "#F9FAFB", "platform": "#F7F8FB",
    "sidebarGlassFill": "#E8E8E5", "sidebarButton": "#F2F1EE", "sidebarButtonHover": "#F7F6F3",
    "sidebarButtonBorder": "#D5D4CE", "sidebarSelected": "#DEDEDA", "sidebarRowHover": "#EFEEEB",
    "bubble": "#F7F7F6", "inputFill": "#F6F6F4",
}
STONE = {
    "content": "#EDECEA", "foreground": "#2E2E2C", "accent": "#4A6B8A", "link": "#354F6A",
    "base": "#F3F2F1", "platform": "#F0EFED",
    "sidebarGlassFill": "#E4E3E1", "sidebarButton": "#EEEDEB", "sidebarButtonHover": "#F8F7F6",
    "sidebarButtonBorder": "#D1CFCC", "sidebarSelected": "#DAD8D5", "sidebarRowHover": "#ECEBE9",
    "bubble": "#F3F3F1", "inputFill": "#F2F1F0",
}
MIST_OLD = {
    "content": "#ECEFF4", "foreground": "#2A3138", "accent": "#2F7BC4", "link": "#1D5085",
    "base": "#F3F5F8", "platform": "#F0F3F6",
    "sidebarGlassFill": "#E3E6EB", "sidebarButton": "#EDF0F5", "sidebarButtonHover": "#F9FAFC",
    "sidebarButtonBorder": "#CED4DC", "sidebarSelected": "#D8DEE6", "sidebarRowHover": "#EBEEF3",
    "bubble": "#F3F5F8", "inputFill": "#F1F3F7",
}

# 候选：纸面 (L*, C*, h)；正文 (L*, C*, h)。
CANDS = {
    "M1 91.0/260°": ((91.0, 4.2, 260), (19.9, 6.0, 258)),
    "M2 90.7/264°": ((90.7, 4.6, 264), (19.6, 6.4, 262)),
}
# 纸面压暗后链接/强调要跟着调一档，否则链接对纸面的对比度掉到 7:1 以下。
TUNED = {"accent": "#2C74BB", "link": "#1B4A7C"}


def build(p, f):
    pal = family(p, f)
    pal.update(TUNED)
    return pal


def report():
    print("== 现行纸面亮度（L* 越高越容易刺眼）")
    rows = [("暖白", WARM), ("雾蓝", MIST_OLD), ("石墨", STONE)]
    rows += [(n, {"content": pal["content"]}) for n, pal in ((n, build(*v)) for n, v in CANDS.items())]
    rows.append(("米纸", {"content": "#F2EBDC"}))
    for name, pal in sorted(rows, key=lambda r: -lch(r[1]["content"])[0]):
        hx = pal["content"]
        L, C, h = lch(hx)
        print(f"  {name:<12} {hx}  L*{L:5.1f}  C*{C:4.1f}  h{h:5.1f}  {temp(hx):5.0f}K")
    print("\n== 候选")
    for name, (p, f) in CANDS.items():
        pal = build(p, f)
        L, C, h = lch(pal["content"])
        print(f"\n{name}  content {pal['content']} L*{L:.1f} C*{C:.1f} h{h:.0f} {temp(pal['content']):.0f}K")
        for other, op in (("暖白", WARM), ("石墨", STONE), ("米纸", {"content": "#F2EBDC"}), ("旧雾蓝", MIST_OLD)):
            print(f"   ΔE00 vs {other:<5} {de2000(pal['content'], op['content']):5.1f}")
        print(f"   正文 {contrast(pal['content'], pal['foreground']):5.2f}:1  "
              f"链接 {contrast(pal['content'], pal['link']):5.2f}:1  "
              f"强调 {contrast(pal['content'], pal['accent']):5.2f}:1")
        for k in ("content", "foreground", "accent", "link", "base", "platform", "previewBg",
                  "sidebarGlassFill", "sidebarButton", "sidebarButtonHover", "sidebarButtonBorder",
                  "sidebarSelected", "sidebarRowHover", "bubble", "inputFill"):
            v = pal["content"] if k == "previewBg" else pal[k]
            print(f'   {k}: "{v}",')


def image(path):
    panels = [("暖白 0.3.15", WARM, "现行"), ("石墨 0.3.15", STONE, "现行"),
              ("雾蓝 0.3.15", MIST_OLD, "现行 L*94.4")]
    for name, (p, f) in CANDS.items():
        pal = build(p, f)
        panels.append((f"雾蓝 {name}", pal, f"候选 ΔE00 vs 旧 {de2000(pal['content'], MIST_OLD['content']):.1f}"))
    pw, ph, gap = 300, 236, 14
    W, H = len(panels) * (pw + gap) + gap, ph + gap * 2 + 8
    img = Image.new("RGB", (W, H), "#FFFFFF")
    d = ImageDraw.Draw(img)
    for i, (name, pal, note) in enumerate(panels):
        draw_panel(d, gap + i * (pw + gap), gap, pw, ph, pal, name, note)
    img.save(path)
    print("saved", path, img.size)


if __name__ == "__main__":
    report()
    image(os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "mist-compare.png")))
