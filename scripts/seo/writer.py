"""SEO article writer — 1 DeepSeek call → Article(frontmatter, body)."""
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import requests

DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"
PEXELS_KEY = "bV1hblCTVtLISKHB7G0Kcx1OzmwOSlwBa8WbgiquRKE3iAyu6bJguGEV"

# Muestra real de tono/estilo del blog (evita repetir)
_EXISTING_SLUGS = [
    "autoconocimiento-que-es-y-por-que-no-basta-con-saber",
    "carta-natal-human-design-saju-mapas-simbolicos-de-autoconocimiento",
    "el-problema-no-es-el-insight",
    "espejo-ia-autoconocimiento-lo-que-una-ia-puede-y-no-puede-hacer-por-ti",
    "mapa-de-patrones-personales-como-leer-lo-que-tus-tests-revelan",
    "por-que-repito-los-mismos-patrones-aunque-ya-los-reconozco",
    "psicometria-y-trabajo-interior-cuando-los-datos-y-la-conciencia-se-encuentran",
    "regulacion-emocional-herramientas-concretas-mas-alla-del-mindfulness",
    "tests-psicometricos-online-que-miden-y-como-usarlos",
    "trabajo-entre-sesiones-de-terapia-los-6-dias-que-tu-terapeuta-no-ve",
]

_SYSTEM = """Sos un escritor de artículos de blog para Endonautas, plataforma de autoconocimiento y psicometría para adultos.

TONO Y VOZ:
- Práctico, directo, honesto. Sin fluff espiritual ni promesas vacías.
- Sin listas de "X pasos para Y". Los H2 son ideas, no instructivos.
- Español latinoamericano neutro. Vos/tú: usar "vos" solo ocasionalmente, preferir construcciones impersonales.
- Escritura densa en ideas pero sin jerga académica innecesaria.
- No decir "en este artículo vamos a ver" ni "esperamos que este contenido te sirva".

ESTRUCTURA:
- Apertura: 1 párrafo que entra directo al problema sin introducir el artículo.
- 3-5 H2 con desarrollo real de cada sección.
- Cierre: párrafo de integración (no de resumen) + transición natural al CTA.
- Longitud: 1200-1500 palabras en el body.

SEO:
- La keyword debe aparecer en el título, en el primer párrafo y en al menos 1 H2.
- Meta description: 130-155 caracteres, orientada a búsqueda, sin clickbait.

CTA FINAL (al final del body, en markdown):
---
{CTA_PLACEHOLDER}
---

CATEGORÍAS válidas: "Proceso" | "Instrumentos" | "Fundamentos"
LAYERS válidas: "awareness" | "journey" | "consciousness"

OUTPUT FORMAT (JSON puro, sin markdown code blocks):
{
  "frontmatter": {
    "title": "...",
    "description": "...",
    "category": "...",
    "layer": "...",
    "tags": ["...", "...", "..."],
    "cta": "..."
  },
  "body": "contenido markdown completo del artículo..."
}

El campo "body" es markdown puro: H2 con ##, párrafos, sin H1 (el título va en frontmatter).
No incluir el título como H1 dentro del body."""

_CTA_TEMPLATE = (
    "El **Mapa de Patrones** de Endonautas incluye 3 tests psicométricos validados, "
    "análisis con IA y un perfil de patrones en 10 minutos. "
    "Podés empezar gratis en [endonautas.cl](https://app.endonautas.cl/tests/mapa-patrones/)."
)


@dataclass
class Article:
    title: str
    description: str
    category: str
    layer: str
    tags: list[str]
    cta: str
    body: str
    slug: str = field(default="")
    image: str = field(default="")

    def __post_init__(self):
        if not self.slug:
            self.slug = _slugify(self.title)


def _fetch_pexels_image(keyword: str) -> str:
    try:
        r = requests.get(
            "https://api.pexels.com/v1/search",
            params={"query": keyword, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": PEXELS_KEY},
            timeout=10,
        )
        r.raise_for_status()
        photos = r.json().get("photos", [])
        return photos[0]["src"]["large2x"] if photos else ""
    except Exception:
        return ""


def _slugify(text: str) -> str:
    text = text.lower()
    for src, dst in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),("ü","u"),("ñ","n")]:
        text = text.replace(src, dst)
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_]+", "-", text).strip("-")


def _call_deepseek(messages: list, max_tokens: int = 3000) -> str:
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not key:
        return ""
    r = requests.post(
        DEEPSEEK_URL,
        json={"model": DEEPSEEK_MODEL, "messages": messages, "max_tokens": max_tokens},
        headers={"Authorization": f"Bearer {key}"},
        timeout=90,
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


_FALLBACK_BODY = """\
Este artículo es un placeholder generado sin API key.

## Por qué aparece esto

No se encontró `DEEPSEEK_API_KEY` en el entorno. Configurá la variable y volvé a correr el script.

## Qué hacer

```bash
export DEEPSEEK_API_KEY=sk-...
python3 seo/run.py --dry-run
```
"""


def generate(topic: str, keyword: str, category: str, layer: str) -> Article:
    """1 llamada DeepSeek → Article. Fallback si no hay API key."""
    user_msg = (
        f"Escribí un artículo SEO sobre: {topic}\n"
        f"Keyword principal: {keyword}\n"
        f"Categoría: {category}\n"
        f"Layer: {layer}\n\n"
        f"CTA a incluir al final:\n{_CTA_TEMPLATE}"
    )
    system = _SYSTEM.replace("{CTA_PLACEHOLDER}", _CTA_TEMPLATE)

    img = _fetch_pexels_image(keyword)
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    if not key:
        print("[seo/writer] Sin DEEPSEEK_API_KEY — usando fallback", file=sys.stderr)
        return Article(
            title=topic,
            description=f"Artículo sobre {keyword}. (placeholder — falta API key)",
            category=category,
            layer=layer,
            tags=[keyword],
            cta=_CTA_TEMPLATE,
            body=_FALLBACK_BODY,
            image=img,
        )

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_msg},
    ]
    try:
        raw = _call_deepseek(messages)
        # Strip markdown code block if model wraps the JSON
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw.strip())
        data = json.loads(raw)
        fm = data["frontmatter"]
        return Article(
            title=fm["title"],
            description=fm["description"],
            category=fm.get("category", category),
            layer=fm.get("layer", layer),
            tags=fm.get("tags", [keyword]),
            cta=fm.get("cta", _CTA_TEMPLATE),
            body=data["body"],
            image=img,
        )
    except Exception as e:
        print(f"[seo/writer] Error: {e} — usando fallback", file=sys.stderr)
        return Article(
            title=topic,
            description=f"Artículo sobre {keyword}.",
            category=category,
            layer=layer,
            tags=[keyword],
            cta=_CTA_TEMPLATE,
            body=_FALLBACK_BODY,
            image=img,
        )
