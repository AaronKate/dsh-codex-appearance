# -*- coding: utf-8 -*-
"""按 L*/C*/h 目标生成一整套豆沙绿纸面色，并打印色差与对比度。"""
import math
from theme_metrics import de2000, contrast, lch
from theme_candidates import lab_to_hex

PAPER = "#F2EBDC"
WARM = "#F1F1EE"

# 色相统一在 129°，只靠明度分层次；前景另取 132° 稍冷一档，避免与米纸的暖褐同族。
SPEC = {
    "content": (90.8, 6.6, 129),
    "base": (93.2, 5.6, 129),
    "platform": (92.2, 5.8, 129),
    "bubble": (94.2, 5.4, 129),
    "sidebarGlassFill": (87.6, 7.0, 129),
    "sidebarButton": (89.6, 6.6, 129),
    "sidebarButtonHover": (94.6, 5.2, 129),
    "sidebarButtonBorder": (84.0, 7.2, 129),
    "sidebarSelected": (85.8, 7.0, 129),
    "inputFill": (92.0, 6.0, 129),
    "foreground": (20.0, 7.5, 132),
}
FIXED = {"accent": "#4A7A3A", "link": "#2F5223"}

if __name__ == "__main__":
    pal = {k: lab_to_hex(*v) for k, v in SPEC.items()}
    pal.update(FIXED)
    for k, v in pal.items():
        L, C, h = lch(v)
        print(f"  {k:<20} {v}  L*{L:5.1f} C*{C:4.1f} h{h:5.1f}   ΔE(米纸纸面) {de2000(v, PAPER):5.1f}")
    print(f"\n  正文对比 {contrast(pal['content'], pal['foreground']):5.2f}:1")
    print(f"  链接对比 {contrast(pal['content'], pal['link']):5.2f}:1")
    print(f"  强调对比 {contrast(pal['content'], pal['accent']):5.2f}:1")
    print(f"  正文 vs 侧栏按钮 {contrast(pal['sidebarButton'], pal['foreground']):5.2f}:1")
    print(f"  纸面 vs 气泡 ΔE {de2000(pal['content'], pal['bubble']):4.1f} / 纸面 vs 侧栏 ΔE {de2000(pal['content'], pal['sidebarGlassFill']):4.1f}")
    print(f"\n  纸面ΔE(米纸) {de2000(pal['content'], PAPER):.1f}  纸面ΔE(暖白) {de2000(pal['content'], WARM):.1f}")
    print(f"  正文ΔE(米纸) {de2000(pal['foreground'], '#3B3226'):.1f}")
    print("\nJS:")
    for k in ("content", "foreground", "accent", "link", "base", "platform", "sidebarGlassFill",
              "sidebarButton", "sidebarButtonHover", "sidebarButtonBorder", "sidebarSelected",
              "sidebarRowHover", "bubble", "inputFill"):
        v = pal.get(k) or pal["sidebarButton"]
        print(f'  {k}: "{v}",')
