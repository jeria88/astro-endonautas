#!/usr/bin/env python3
"""
Genera avatar_variants para todos los pending JSONs con status 'pending'.

Uso:
    DEEPSEEK_API_KEY=sk-... python3 scripts/social/batch_phase1.py
    DEEPSEEK_API_KEY=sk-... python3 scripts/social/batch_phase1.py --slug mi-articulo
    DEEPSEEK_API_KEY=sk-... python3 scripts/social/batch_phase1.py --retry-empty

Genera 4 avatares × 3 variantes por artículo (carousel + reel + social copy).
Actualiza pending/<slug>.json a status: copy_pending_review.
Git push automático al terminar cada artículo.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import requests

DEEPSEEK_URL   = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"
MAX_RETRIES    = 3
WEB_PATH       = Path(__file__).parent.parent.parent
PENDING_DIR    = WEB_PATH / "pending"
BLOG_DIR       = WEB_PATH / "src/content/blog"

AVATARES = {
    "negocio": {
        "label": "Dueños de negocio",
        "carousel_angle": "cómo este conocimiento mejora la toma de decisiones, el liderazgo y la gestión de equipos",
        "reel_angle": "el patrón inconsciente que sabotea negocios y equipos sin que el líder lo vea",
        "ig_angle": "insight de liderazgo con aplicación directa en decisiones de negocio",
        "tiktok_angle": "patrón de comportamiento que todos los líderes repiten sin saber por qué",
        "linkedin_angle": "reflexión profesional sobre autoconocimiento aplicado a liderazgo y cultura organizacional",
    },
    "profesional": {
        "label": "Profesionales",
        "carousel_angle": "cómo este conocimiento impacta el rendimiento, las relaciones laborales y el crecimiento profesional",
        "reel_angle": "el patrón que frena a los profesionales más capaces sin que lo sepan",
        "ig_angle": "herramienta concreta de autoconocimiento para el desarrollo profesional",
        "tiktok_angle": "por qué los profesionales exitosos se autosabotean (y cómo salir de eso)",
        "linkedin_angle": "perspectiva sobre el vínculo entre autoconocimiento y carrera profesional sostenible",
    },
    "padres": {
        "label": "Padres",
        "carousel_angle": "cómo este conocimiento transforma la crianza, los vínculos y los patrones que se transmiten a los hijos",
        "reel_angle": "el patrón familiar que los padres repiten sin querer y que sus hijos van a heredar",
        "ig_angle": "reflexión sobre crianza consciente y los patrones que transmitimos sin darnos cuenta",
        "tiktok_angle": "lo que tus hijos aprenden de ti aunque nunca se lo digas",
        "linkedin_angle": "sobre crianza, patrones intergeneracionales y el trabajo interior de ser padre o madre",
    },
    "terapeuta": {
        "label": "Terapeutas",
        "carousel_angle": "cómo este marco conceptual enriquece la práctica clínica y el trabajo con pacientes",
        "reel_angle": "lo que la psicometría puede ver que la clínica sola no alcanza",
        "ig_angle": "herramienta o marco teórico para terapeutas que trabajan con autoconocimiento",
        "tiktok_angle": "lo que tu paciente no te dice pero los tests sí",
        "linkedin_angle": "perspectiva clínica sobre el uso de psicometría y autoconocimiento en psicoterapia",
    },
}

_SYSTEM = """\
Sos un experto en marketing de contenidos para Endonautas, plataforma de autoconocimiento y psicometría.
Tu trabajo es generar copy para redes sociales adaptado a un avatar específico.

OUTPUT: JSON puro, sin markdown code blocks.
"""

_USER_TEMPLATE = """\
Artículo: "{title}"
Avatar: {label} ({avatar_key})
Ángulo carrusel: {carousel_angle}
Ángulo reel: {reel_angle}
Ángulo Instagram: {ig_angle}
Ángulo TikTok: {tiktok_angle}
Ángulo LinkedIn: {linkedin_angle}

Extracto del artículo:
{excerpt}

Generá 3 variantes de copy. Cada variante incluye:
1. carousel: objeto con "slides" (array de 7 strings, cada uno máx 18 palabras), "keywords" (array de 3 strings) y "layout" ("L1")
2. reel: objeto con "hook_a" (frase impacto ≤12 palabras), "hook_b" (alternativa ≤12 palabras), "cta" (llamado a acción ≤10 palabras), "keywords" (array de 3 strings)
3. social: objeto con "instagram" (caption ≤150 chars + 3 hashtags), "tiktok" (caption ≤100 chars, tono directo), "linkedin" (párrafo reflexivo 120-180 chars)

El primer slide del carrusel debe ser el hook más fuerte.
Español latinoamericano. Sin frases vacías.

Responder SOLO con este JSON (exactamente 3 elementos en "variants"):
{{"variants": [{{"carousel": {{"slides": [...7 strings...], "keywords": [...3 strings...], "layout": "L1"}}, "reel": {{"hook_a": "...", "hook_b": "...", "cta": "...", "keywords": [...3 strings...]}}, "social": {{"instagram": "...", "tiktok": "...", "linkedin": "..."}}}}]}}
"""


def _call_deepseek(system: str, user: str) -> str:
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not key:
        raise RuntimeError("DEEPSEEK_API_KEY no configurada")
    r = requests.post(
        DEEPSEEK_URL,
        json={"model": DEEPSEEK_MODEL, "messages": [
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ], "max_tokens": 6000},
        headers={"Authorization": f"Bearer {key}"},
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _read_excerpt(article_path: Path, max_chars: int = 1200) -> str:
    try:
        text = article_path.read_text(encoding="utf-8")
        body = re.sub(r"^---.*?---\s*", "", text, flags=re.DOTALL)
        body = re.sub(r"#{1,3}\s*", "", body)
        body = re.sub(r"\*{1,2}(.+?)\*{1,2}", r"\1", body)
        return body[:max_chars].strip()
    except Exception:
        return ""


def _parse_variants(raw: str) -> list:
    # Strip markdown fences
    cleaned = re.sub(r"^```[a-z]*\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"```\s*$", "", cleaned.strip(), flags=re.MULTILINE)
    # Extract first {...} block in case model adds surrounding text
    m = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if m:
        cleaned = m.group(0)
    data = json.loads(cleaned)
    variants = data["variants"]
    if not isinstance(variants, list) or not variants:
        raise ValueError("variants vacío o no es lista")
    return variants


def _generate_avatar(title: str, avatar_key: str, avatar_data: dict, excerpt: str) -> list:
    """Llama DeepSeek con retry. Lanza excepción si todos los intentos fallan."""
    user_msg = _USER_TEMPLATE.format(
        title=title,
        label=avatar_data["label"],
        avatar_key=avatar_key,
        carousel_angle=avatar_data["carousel_angle"],
        reel_angle=avatar_data["reel_angle"],
        ig_angle=avatar_data["ig_angle"],
        tiktok_angle=avatar_data["tiktok_angle"],
        linkedin_angle=avatar_data["linkedin_angle"],
        excerpt=excerpt,
    )
    last_err = None
    for attempt in range(MAX_RETRIES):
        if attempt > 0:
            print(f"retry {attempt}...", end=" ", flush=True)
        try:
            raw = _call_deepseek(_SYSTEM, user_msg)
            variants = _parse_variants(raw)
            return variants
        except Exception as e:
            last_err = e
    raise RuntimeError(f"Falló tras {MAX_RETRIES} intentos: {last_err}")


def _git_push(slug: str, msg: str) -> None:
    rel = f"pending/{slug}.json"
    try:
        subprocess.run(["git", "add", rel], cwd=WEB_PATH, check=True)
        subprocess.run(["git", "commit", "-m", msg], cwd=WEB_PATH, check=True)
        subprocess.run(["git", "push"], cwd=WEB_PATH, check=True)
        print(f"  [git] pushed")
    except subprocess.CalledProcessError as e:
        print(f"  [git] error: {e}")


def generate_for_article(slug: str) -> None:
    path = PENDING_DIR / f"{slug}.json"
    if not path.exists():
        print(f"[!] No existe: {path}")
        return

    data = json.loads(path.read_text(encoding="utf-8"))
    if data["status"] not in ("pending",):
        print(f"[skip] {slug} — status: {data['status']}")
        return

    title = data.get("title", slug)
    article_path = WEB_PATH / data.get("article_path", f"src/content/blog/{slug}.md")
    excerpt = _read_excerpt(article_path)

    avatar_variants = data.get("avatar_variants", {})
    for avatar_key, avatar_data in AVATARES.items():
        print(f"  [{avatar_key}] generando...", end=" ", flush=True)
        try:
            variants = _generate_avatar(title, avatar_key, avatar_data, excerpt)
            avatar_variants[avatar_key] = variants
            print(f"✓ {len(variants)} variantes")
        except Exception as e:
            print(f"FAIL: {e}")
            avatar_variants[avatar_key] = []

    empty = [k for k, v in avatar_variants.items() if not v]
    data["avatar_variants"] = avatar_variants
    if empty:
        print(f"  [!] Avatares vacíos: {empty} — status sigue 'pending' para reintento")
        data["status"] = "pending"
    else:
        data["status"] = "copy_pending_review"

    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    _git_push(slug, f"content(social): avatar copy variants ready — {slug}")


def retry_empty() -> None:
    """Regenera solo los avatares vacíos en artículos copy_pending_review."""
    fixed_any = False
    for f in sorted(PENDING_DIR.glob("*.json")):
        data = json.loads(f.read_text())
        if data.get("status") != "copy_pending_review":
            continue
        empty_avatars = [k for k, v in data.get("avatar_variants", {}).items() if not v]
        if not empty_avatars:
            continue

        slug = data["slug"]
        print(f"\n→ {slug} (vacíos: {empty_avatars})")
        title = data.get("title", slug)
        article_path = WEB_PATH / data.get("article_path", f"src/content/blog/{slug}.md")
        excerpt = _read_excerpt(article_path)

        changed = False
        for avatar_key in empty_avatars:
            avatar_data = AVATARES[avatar_key]
            print(f"  [{avatar_key}] regenerando...", end=" ", flush=True)
            try:
                variants = _generate_avatar(title, avatar_key, avatar_data, excerpt)
                data["avatar_variants"][avatar_key] = variants
                print(f"✓ {len(variants)} variantes")
                changed = True
            except Exception as e:
                print(f"FAIL: {e}")

        if changed:
            still_empty = [k for k, v in data["avatar_variants"].items() if not v]
            data["status"] = "copy_pending_review" if not still_empty else "pending"
            f.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
            _git_push(slug, f"content(social): fix avatares vacíos — {slug}")
            fixed_any = True

    if not fixed_any:
        print("Sin avatares vacíos.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", help="Procesar solo este slug")
    parser.add_argument("--retry-empty", action="store_true",
                        help="Regenerar avatares vacíos en artículos copy_pending_review")
    args = parser.parse_args()

    if args.retry_empty:
        retry_empty()
        return

    if args.slug:
        slugs = [args.slug]
    else:
        slugs = []
        for f in sorted(PENDING_DIR.glob("*.json")):
            d = json.loads(f.read_text())
            if d.get("status") == "pending":
                slugs.append(d["slug"])

    if not slugs:
        print("Nada pendiente.")
        return

    print(f"Artículos a procesar: {len(slugs)}")
    for slug in slugs:
        print(f"\n→ {slug}")
        generate_for_article(slug)

    print("\nListo.")


if __name__ == "__main__":
    main()
