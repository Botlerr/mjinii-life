#!/usr/bin/env python
"""Generate MJINII LIFE PWA icons — black bg, acid-green rounded border + M mark.
Pure stdlib (zlib + struct), no Pillow required."""
import zlib, struct, os

BG = (0x0a, 0x0a, 0x0a)
FG = (0xcc, 0xff, 0x00)

def dist_seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5

def rounded_ring_hit(x, y, s, inset, thickness, radius):
    """True if (x,y) falls on a rounded-square ring inset from the edge."""
    lo, hi = inset, s - inset
    if x < lo - thickness or x > hi + thickness or y < lo - thickness or y > hi + thickness:
        return False
    cx = min(max(x, lo + radius), hi - radius)
    cy = min(max(y, lo + radius), hi - radius)
    d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
    # distance from the ring's centerline
    return abs(d - radius) <= thickness / 2 if (x < lo + radius or x > hi - radius) and (y < lo + radius or y > hi - radius) else (
        abs(min(abs(x - lo), abs(x - hi))) <= thickness / 2 if lo + radius <= y <= hi - radius else
        abs(min(abs(y - lo), abs(y - hi))) <= thickness / 2
    )

def make(size):
    s = size
    rows = []
    m_pts = [(0.20, 0.82), (0.20, 0.18), (0.50, 0.60), (0.80, 0.18), (0.80, 0.82)]
    m_stroke = 0.115 * s
    inset = 0.055 * s
    thickness = max(2.0, 0.022 * s)
    radius = 0.16 * s

    for y in range(s):
        row = bytearray()
        for x in range(s):
            r, g, b = BG
            # rounded border ring
            if rounded_ring_hit(x, y, s, inset, thickness, radius):
                r, g, b = FG
            else:
                # M glyph strokes
                hit = False
                for i in range(len(m_pts) - 1):
                    ax, ay = m_pts[i][0] * s, m_pts[i][1] * s
                    bx, by = m_pts[i + 1][0] * s, m_pts[i + 1][1] * s
                    if dist_seg(x, y, ax, ay, bx, by) <= m_stroke / 2:
                        hit = True
                        break
                if hit:
                    r, g, b = FG
            row += bytes((r, g, b, 255))
        rows.append(bytes(row))

    raw = b''.join(b'\x00' + r for r in rows)

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data +
                struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', s, s, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(raw, 9))
           + chunk(b'IEND', b''))
    return png

out_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project root
for size in (192, 512):
    path = os.path.join(out_dir, f'icon-{size}.png')
    with open(path, 'wb') as f:
        f.write(make(size))
    print(f'wrote {path} ({os.path.getsize(path)} bytes)')
