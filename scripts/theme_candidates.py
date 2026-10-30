# -*- coding: utf-8 -*-
"""生成候选豆沙绿纸面色：给定 L*/C*/h 反解 sRGB，并给出与米纸的色差。"""
import math
from theme_metrics import de2000, contrast, lch, srgb_to_lin

XN, YN, ZN = 0.95047, 1.0, 1.08883

def lin_to_srgb(v):
    v = max(0.0, min(1.0, v))
    return 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055

def lab_to_hex(L, C, h):
    a = C * math.cos(math.radians(h))
    b = C * math.sin(math.radians(h))
    fy = (L + 16) / 116
    fx = fy + a / 500
    fz = fy - b / 200
    def finv(t):
        return t ** 3 if t ** 3 > (6 / 29) ** 3 else 3 * (6 / 29) ** 2 * (t - 4 / 29)
    x, y, z = finv(fx) * XN, finv(fy) * YN, finv(fz) * ZN
    r = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z
    g = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z
    bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z
    clamp = lambda v: round(lin_to_srgb(v) * 255)
    return "#%02X%02X%02X" % (clamp(r), clamp(g), clamp(bl))

PAPER = "#F2EBDC"
if __name__ == "__main__":
    print("目标 L*/C*/h -> 纸面 hex   ΔE(米纸)  G-R  G-B")
    for L in (89.5, 90.5, 91.5, 92.5):
        for C in (5.0, 6.0, 7.0, 8.0):
            for h in (120, 130, 140, 150):
                hx = lab_to_hex(L, C, h)
                r, g, b = (int(hx[i:i + 2], 16) for i in (1, 3, 5))
                d = de2000(hx, PAPER)
                if d >= 6.0 and g - r >= 6 and g - b >= 8:
                    print(f"  {L:4.1f} {C:3.1f} {h:4d} -> {hx}  {d:5.1f}  {g-r:+3d} {g-b:+3d}")
