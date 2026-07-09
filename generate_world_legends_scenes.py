import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter

W, H = 2048, 2867
OUTPUT_DIR = "world_legends_scenes"
os.makedirs(OUTPUT_DIR, exist_ok=True)

TEST_ONLY = True  # primeiro gera só 3. Depois mude para False.

players_data = [
    {
        "id": "pele",
        "file": "scene-pele.webp",
        "country": "Brasil",
        "number": "10",
        "pose": "celebration_punch",
        "colors": [(0, 95, 40), (255, 220, 0), (0, 45, 120)],
    },
    {
        "id": "messi",
        "file": "scene-messi.webp",
        "country": "Argentina",
        "number": "10",
        "pose": "arms_up",
        "colors": [(116, 172, 223), (255, 255, 255), (15, 45, 85)],
    },
    {
        "id": "cristiano",
        "file": "scene-cristiano.webp",
        "country": "Portugal",
        "number": "7",
        "pose": "power_stance",
        "colors": [(180, 15, 35), (0, 95, 55), (255, 220, 120)],
    },
    {
        "id": "maradona",
        "file": "scene-maradona.webp",
        "country": "Argentina",
        "number": "10",
        "pose": "low_dribble",
        "colors": [(116, 172, 223), (255, 255, 255), (20, 35, 70)],
    },
    {
        "id": "ronaldo",
        "file": "scene-ronaldo.webp",
        "country": "Brasil",
        "number": "9",
        "pose": "sprint",
        "colors": [(255, 220, 0), (0, 120, 55), (0, 45, 120)],
    },
    {
        "id": "ronaldinho",
        "file": "scene-ronaldinho.webp",
        "country": "Brasil",
        "number": "10",
        "pose": "magic_control",
        "colors": [(255, 220, 0), (0, 120, 55), (120, 0, 180)],
    },
    {
        "id": "zidane",
        "file": "scene-zidane.webp",
        "country": "França",
        "number": "5",
        "pose": "midfield_control",
        "colors": [(0, 35, 120), (255, 255, 255), (210, 25, 45)],
    },
    {
        "id": "cruyff",
        "file": "scene-cruyff.webp",
        "country": "Holanda",
        "number": "14",
        "pose": "elegant_turn",
        "colors": [(255, 95, 0), (255, 255, 255), (20, 20, 30)],
    },
    {
        "id": "beckenbauer",
        "file": "scene-beckenbauer.webp",
        "country": "Alemanha",
        "number": "5",
        "pose": "captain_walk",
        "colors": [(245, 245, 245), (20, 20, 20), (210, 40, 35)],
    },
    {
        "id": "maldini",
        "file": "scene-maldini.webp",
        "country": "Itália",
        "number": "3",
        "pose": "defensive_wall",
        "colors": [(20, 75, 160), (255, 255, 255), (210, 180, 80)],
    },
    {
        "id": "yashin",
        "file": "scene-yashin.webp",
        "country": "Rússia",
        "number": "1",
        "pose": "goalkeeper_stretch",
        "colors": [(15, 15, 20), (80, 100, 140), (220, 230, 255)],
    },
    {
        "id": "kaka",
        "file": "scene-kaka.webp",
        "country": "Brasil",
        "number": "8",
        "pose": "arms_to_sky",
        "colors": [(255, 220, 0), (0, 110, 50), (255, 255, 255)],
    },
    {
        "id": "iniesta",
        "file": "scene-iniesta.webp",
        "country": "Espanha",
        "number": "8",
        "pose": "passing_vision",
        "colors": [(190, 20, 35), (255, 190, 20), (40, 10, 20)],
    },
    {
        "id": "xavi",
        "file": "scene-xavi.webp",
        "country": "Espanha",
        "number": "6",
        "pose": "passing_vision",
        "colors": [(190, 20, 35), (255, 190, 20), (30, 10, 20)],
    },
    {
        "id": "henry",
        "file": "scene-henry.webp",
        "country": "França",
        "number": "14",
        "pose": "speed_dash",
        "colors": [(0, 35, 120), (255, 255, 255), (210, 25, 45)],
    },
    {
        "id": "romario",
        "file": "scene-romario.webp",
        "country": "Brasil",
        "number": "11",
        "pose": "box_predator",
        "colors": [(255, 220, 0), (0, 115, 55), (0, 75, 160)],
    },
    {
        "id": "baggio",
        "file": "scene-baggio.webp",
        "country": "Itália",
        "number": "10",
        "pose": "relaxed_genius",
        "colors": [(20, 75, 160), (255, 255, 255), (150, 90, 220)],
    },
    {
        "id": "eusebio",
        "file": "scene-eusebio.webp",
        "country": "Portugal",
        "number": "9",
        "pose": "sprint",
        "colors": [(170, 20, 35), (0, 90, 45), (255, 220, 120)],
    },
    {
        "id": "garrincha",
        "file": "scene-garrincha.webp",
        "country": "Brasil",
        "number": "7",
        "pose": "elegant_turn",
        "colors": [(255, 220, 0), (0, 110, 50), (0, 45, 120)],
    },
    {
        "id": "charlton",
        "file": "scene-charlton.webp",
        "country": "Inglaterra",
        "number": "9",
        "pose": "power_shot",
        "colors": [(245, 245, 245), (20, 35, 70), (180, 20, 35)],
    },
]


def clamp(v):
    return max(0, min(255, int(v)))


def rgba(color, alpha):
    return (clamp(color[0]), clamp(color[1]), clamp(color[2]), alpha)


def lerp(c1, c2, t):
    return (
        clamp(c1[0] + (c2[0] - c1[0]) * t),
        clamp(c1[1] + (c2[1] - c1[1]) * t),
        clamp(c1[2] + (c2[2] - c1[2]) * t),
    )


def add_gradient_background(base, colors):
    draw = ImageDraw.Draw(base)
    c1, c2, c3 = colors

    for y in range(H):
        t = y / H
        if t < 0.55:
            col = lerp((5, 7, 10), c1, t / 0.55 * 0.65)
        else:
            col = lerp(c1, c2, (t - 0.55) / 0.45 * 0.45)
        draw.line([(0, y), (W, y)], fill=rgba(col, 255))

    # vinheta
    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-600, -300, W + 600, H + 200), fill=170)
    vignette = vignette.filter(ImageFilter.GaussianBlur(260))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 165))
    base.alpha_composite(dark, (0, 0))
    base.putalpha(255)

    light = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ld = ImageDraw.Draw(light)
    ld.ellipse((260, 250, W - 260, H - 250), fill=rgba(c3, 80))
    light = light.filter(ImageFilter.GaussianBlur(220))
    base.alpha_composite(light)


def add_energy_rays(base, colors, pose):
    c1, c2, c3 = colors
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    origin = (W // 2, int(H * 0.55))

    ray_count = 22 if pose in ["celebration_punch", "arms_up", "power_stance"] else 14

    for i in range(ray_count):
        angle = -math.pi * 0.95 + i * (math.pi * 1.9 / max(1, ray_count - 1))
        length = random.randint(1100, 2300)
        x = origin[0] + math.cos(angle) * length
        y = origin[1] + math.sin(angle) * length
        col = random.choice([c1, c2, c3, (255, 255, 255)])
        width = random.randint(8, 26)
        draw.line([origin, (x, y)], fill=rgba(col, random.randint(25, 70)), width=width)

    layer = layer.filter(ImageFilter.GaussianBlur(18))
    base.alpha_composite(layer)


def add_smoke_and_particles(base, colors):
    c1, c2, c3 = colors

    smoke = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(smoke)
    for _ in range(34):
        x = random.randint(120, W - 120)
        y = random.randint(int(H * 0.18), H - 120)
        r = random.randint(160, 520)
        col = random.choice([c1, c2, c3])
        sd.ellipse((x - r, y - r, x + r, y + r), fill=rgba(col, random.randint(12, 42)))
    smoke = smoke.filter(ImageFilter.GaussianBlur(95))
    base.alpha_composite(smoke)

    particles = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(particles)
    for _ in range(260):
        x = random.randint(80, W - 80)
        y = random.randint(180, H - 180)
        r = random.randint(2, 8)
        col = random.choice([c1, c2, c3, (255, 255, 255)])
        alpha = random.randint(25, 135)
        pd.ellipse((x - r, y - r, x + r, y + r), fill=rgba(col, alpha))
    particles = particles.filter(ImageFilter.GaussianBlur(0.4))
    base.alpha_composite(particles)


def body_points(cx, cy, pose):
    # Coordenadas base
    head = (cx, cy - 680)
    neck = (cx, cy - 520)
    waist_l = (cx - 310, cy + 585)
    waist_r = (cx + 310, cy + 585)

    if pose == "celebration_punch":
        return {
            "head": head,
            "torso": [(cx, cy - 520), (cx - 390, cy - 430), (cx - 330, cy + 560), (cx + 310, cy + 560), (cx + 390, cy - 430)],
            "left_arm": [(cx - 360, cy - 410), (cx - 620, cy - 700), (cx - 560, cy - 820)],
            "right_arm": [(cx + 350, cy - 410), (cx + 535, cy - 190), (cx + 610, cy + 130)],
            "legs": [(cx - 190, cy + 560), (cx - 300, cy + 1050), (cx - 50, cy + 1050), (cx + 190, cy + 560), (cx + 320, cy + 1050), (cx + 80, cy + 1050)],
        }

    if pose == "arms_up":
        return {
            "head": head,
            "torso": [(cx, cy - 520), (cx - 390, cy - 430), (cx - 320, cy + 570), (cx + 320, cy + 570), (cx + 390, cy - 430)],
            "left_arm": [(cx - 350, cy - 410), (cx - 680, cy - 760), (cx - 760, cy - 900)],
            "right_arm": [(cx + 350, cy - 410), (cx + 680, cy - 760), (cx + 760, cy - 900)],
            "legs": [(cx - 180, cy + 570), (cx - 310, cy + 1050), (cx - 70, cy + 1050), (cx + 180, cy + 570), (cx + 310, cy + 1050), (cx + 70, cy + 1050)],
        }

    if pose == "power_stance":
        return {
            "head": head,
            "torso": [(cx, cy - 530), (cx - 430, cy - 430), (cx - 350, cy + 600), (cx + 350, cy + 600), (cx + 430, cy - 430)],
            "left_arm": [(cx - 380, cy - 380), (cx - 620, cy + 10), (cx - 560, cy + 230)],
            "right_arm": [(cx + 380, cy - 380), (cx + 620, cy + 10), (cx + 560, cy + 230)],
            "legs": [(cx - 220, cy + 600), (cx - 440, cy + 1080), (cx - 170, cy + 1080), (cx + 220, cy + 600), (cx + 440, cy + 1080), (cx + 170, cy + 1080)],
        }

    if pose == "sprint":
        return {
            "head": (cx + 80, cy - 660),
            "torso": [(cx + 40, cy - 510), (cx - 390, cy - 380), (cx - 260, cy + 560), (cx + 330, cy + 590), (cx + 430, cy - 410)],
            "left_arm": [(cx - 330, cy - 360), (cx - 620, cy - 90), (cx - 520, cy + 180)],
            "right_arm": [(cx + 360, cy - 390), (cx + 650, cy - 620), (cx + 760, cy - 430)],
            "legs": [(cx - 150, cy + 560), (cx - 500, cy + 930), (cx - 260, cy + 1080), (cx + 200, cy + 580), (cx + 520, cy + 970), (cx + 260, cy + 1080)],
        }

    if pose == "goalkeeper_stretch":
        return {
            "head": (cx + 100, cy - 650),
            "torso": [(cx + 40, cy - 500), (cx - 440, cy - 320), (cx - 250, cy + 520), (cx + 350, cy + 600), (cx + 520, cy - 360)],
            "left_arm": [(cx - 390, cy - 300), (cx - 760, cy - 120), (cx - 820, cy + 80)],
            "right_arm": [(cx + 430, cy - 340), (cx + 770, cy - 680), (cx + 870, cy - 820)],
            "legs": [(cx - 140, cy + 520), (cx - 620, cy + 920), (cx - 360, cy + 1100), (cx + 180, cy + 580), (cx + 500, cy + 1040), (cx + 220, cy + 1110)],
        }

    if pose in ["elegant_turn", "low_dribble", "magic_control"]:
        return {
            "head": (cx - 40, cy - 660),
            "torso": [(cx - 40, cy - 510), (cx - 420, cy - 380), (cx - 350, cy + 560), (cx + 280, cy + 590), (cx + 400, cy - 420)],
            "left_arm": [(cx - 360, cy - 350), (cx - 640, cy - 50), (cx - 600, cy + 180)],
            "right_arm": [(cx + 350, cy - 390), (cx + 620, cy - 240), (cx + 660, cy + 30)],
            "legs": [(cx - 200, cy + 560), (cx - 450, cy + 970), (cx - 190, cy + 1080), (cx + 130, cy + 580), (cx + 420, cy + 1030), (cx + 140, cy + 1100)],
        }

    if pose == "defensive_wall":
        return {
            "head": head,
            "torso": [(cx, cy - 530), (cx - 470, cy - 430), (cx - 390, cy + 620), (cx + 390, cy + 620), (cx + 470, cy - 430)],
            "left_arm": [(cx - 420, cy - 380), (cx - 720, cy - 230), (cx - 760, cy + 80)],
            "right_arm": [(cx + 420, cy - 380), (cx + 720, cy - 230), (cx + 760, cy + 80)],
            "legs": [(cx - 210, cy + 620), (cx - 360, cy + 1080), (cx - 90, cy + 1080), (cx + 210, cy + 620), (cx + 360, cy + 1080), (cx + 90, cy + 1080)],
        }

    if pose == "passing_vision":
        return {
            "head": (cx - 20, cy - 670),
            "torso": [(cx - 20, cy - 520), (cx - 410, cy - 410), (cx - 310, cy + 580), (cx + 320, cy + 570), (cx + 420, cy - 410)],
            "left_arm": [(cx - 360, cy - 390), (cx - 660, cy - 210), (cx - 710, cy + 80)],
            "right_arm": [(cx + 360, cy - 390), (cx + 700, cy - 210), (cx + 760, cy + 40)],
            "legs": [(cx - 180, cy + 570), (cx - 350, cy + 1060), (cx - 80, cy + 1080), (cx + 190, cy + 570), (cx + 350, cy + 1060), (cx + 80, cy + 1080)],
        }

    if pose == "power_shot":
        return {
            "head": (cx - 70, cy - 650),
            "torso": [(cx - 60, cy - 500), (cx - 450, cy - 380), (cx - 320, cy + 590), (cx + 300, cy + 600), (cx + 420, cy - 400)],
            "left_arm": [(cx - 390, cy - 350), (cx - 700, cy - 100), (cx - 760, cy + 120)],
            "right_arm": [(cx + 360, cy - 370), (cx + 610, cy - 690), (cx + 720, cy - 760)],
            "legs": [(cx - 190, cy + 590), (cx - 620, cy + 1050), (cx - 360, cy + 1140), (cx + 160, cy + 600), (cx + 520, cy + 900), (cx + 260, cy + 1080)],
        }

    # fallback
    return {
        "head": head,
        "torso": [(cx, cy - 520), (cx - 390, cy - 430), (cx - 320, cy + 570), (cx + 320, cy + 570), (cx + 390, cy - 430)],
        "left_arm": [(cx - 350, cy - 410), (cx - 600, cy - 120), (cx - 560, cy + 150)],
        "right_arm": [(cx + 350, cy - 410), (cx + 600, cy - 120), (cx + 560, cy + 150)],
        "legs": [(cx - 180, cy + 570), (cx - 310, cy + 1050), (cx - 70, cy + 1050), (cx + 180, cy + 570), (cx + 310, cy + 1050), (cx + 70, cy + 1050)],
    }


def draw_player_scene(base, player):
    c1, c2, c3 = player["colors"]
    pose = player["pose"]
    pts = body_points(W // 2, int(H * 0.48), pose)

    silhouette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(silhouette)

    # membros em linhas grossas arredondadas simuladas
    for limb in ["left_arm", "right_arm"]:
        p = pts[limb]
        sd.line(p, fill=(5, 6, 9, 255), width=95, joint="curve")
        sd.line(p, fill=(18, 18, 24, 255), width=68, joint="curve")

    # pernas
    legs = pts["legs"]
    sd.line([legs[0], legs[1], legs[2]], fill=(5, 6, 9, 255), width=110, joint="curve")
    sd.line([legs[3], legs[4], legs[5]], fill=(5, 6, 9, 255), width=110, joint="curve")

    # torso
    sd.polygon(pts["torso"], fill=(14, 15, 20, 255))

    # cabeça sem rosto
    hx, hy = pts["head"]
    sd.ellipse((hx - 130, hy - 145, hx + 130, hy + 145), fill=(5, 6, 9, 255))

    # camisa/costas: bloco semi-colorido, sem escudo/logo
    shirt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shd = ImageDraw.Draw(shirt)
    shirt_poly = pts["torso"]
    main_col = c1 if sum(c1) > sum(c2) else c2
    shd.polygon(shirt_poly, fill=rgba(main_col, 210))

    # textura diagonal da camisa
    for i in range(-900, 1600, 70):
        shd.line((W // 2 - 650 + i, int(H * 0.30), W // 2 + 300 + i, int(H * 0.80)), fill=rgba((255, 255, 255), 22), width=9)

    # número React-like dentro da cena só como parte da camisa? Melhor manter opcional.
    # Para evitar conflito com HUD, fica pequeno e estilizado, como tecido.
    font_color = (245, 245, 245) if sum(main_col) < 380 else (25, 40, 55)
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("Arial Bold.ttf", 310)
    except Exception:
        from PIL import ImageFont
        font = ImageFont.load_default()

    num = player["number"]
    bbox = shd.textbbox((0, 0), num, font=font)
    tx = W // 2 - (bbox[2] - bbox[0]) // 2
    ty = int(H * 0.43)
    shd.text((tx + 8, ty + 10), num, font=font, fill=rgba((0, 0, 0), 80))
    shd.text((tx, ty), num, font=font, fill=rgba(font_color, 185))

    # mascarar camisa no corpo
    shirt_mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(shirt_mask)
    md.polygon(shirt_poly, fill=255)
    shirt.putalpha(Image.composite(shirt.getchannel("A"), Image.new("L", (W, H), 0), shirt_mask))

    character = Image.alpha_composite(silhouette, shirt)

    # rim light forte
    rim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    rd.line(pts["left_arm"], fill=rgba(c3, 210), width=28, joint="curve")
    rd.line(pts["right_arm"], fill=rgba(c3, 210), width=28, joint="curve")
    rd.line([pts["torso"][1], pts["torso"][0], pts["torso"][4]], fill=rgba(c3, 210), width=35)
    rd.ellipse((hx - 145, hy - 160, hx + 145, hy + 160), outline=rgba(c3, 190), width=22)
    rim = rim.filter(ImageFilter.GaussianBlur(18))

    # glow por trás do corpo
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W // 2 - 680, int(H * 0.25), W // 2 + 680, int(H * 0.88)), fill=rgba(c3, 90))
    glow = glow.filter(ImageFilter.GaussianBlur(130))

    base.alpha_composite(glow)
    base.alpha_composite(character)
    base.alpha_composite(rim)

    # bola/elemento de ação em alguns tipos
    if pose in ["power_shot", "sprint", "goalkeeper_stretch", "magic_control", "elegant_turn"]:
        ball = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(ball)
        bx, by = {
            "goalkeeper_stretch": (int(W * 0.78), int(H * 0.24)),
            "power_shot": (int(W * 0.73), int(H * 0.70)),
            "sprint": (int(W * 0.72), int(H * 0.76)),
            "magic_control": (int(W * 0.72), int(H * 0.62)),
            "elegant_turn": (int(W * 0.70), int(H * 0.66)),
        }.get(pose, (int(W * 0.72), int(H * 0.72)))

        bd.ellipse((bx - 62, by - 62, bx + 62, by + 62), fill=(235, 235, 225, 220))
        bd.ellipse((bx - 30, by - 30, bx + 30, by + 30), outline=(20, 20, 20, 180), width=8)
        ball = ball.filter(ImageFilter.GaussianBlur(0.3))
        base.alpha_composite(ball)

    return base


def render_scene(player):
    random.seed(player["id"])

    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    add_gradient_background(img, player["colors"])
    add_energy_rays(img, player["colors"], player["pose"])
    add_smoke_and_particles(img, player["colors"])
    img = draw_player_scene(img, player)

    # safe-zone escurecida para HUD inferior
    fade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fade)
    fd.rectangle((0, int(H * 0.72), W, H), fill=(0, 0, 0, 115))
    fade = fade.filter(ImageFilter.GaussianBlur(90))
    img.alpha_composite(fade)

    return img


def main():
    data = players_data[:3] if TEST_ONLY else players_data

    print(f"Gerando {len(data)} scenes em: {OUTPUT_DIR}")
    for p in data:
        img = render_scene(p)
        out = os.path.join(OUTPUT_DIR, p["file"])
        img.save(out, "WEBP", quality=95, method=6)
        print(f"OK: {out}")

    print("\nPronto.")
    print("Para gerar todos os 20, altere TEST_ONLY = False.")


if __name__ == "__main__":
    main()
