#!/usr/bin/env python3
"""GitHub Actions runner — lee queue, genera artículo, escribe .md, registra en SerpBear, escribe pending JSON."""
import json
import os
import sys
import urllib3
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import yaml
import requests
from writer import generate

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

QUEUE_PATH = Path(__file__).parent / "queue.yaml"
BLOG_DIR = Path(__file__).parent.parent.parent / "src/content/blog"

SERPBEAR_URL = os.environ.get("SERPBEAR_URL", "https://seo.146.181.39.4.sslip.io")
SERPBEAR_KEY = os.environ.get("SERPBEAR_API_KEY", "")


def load_queue():
    return yaml.safe_load(QUEUE_PATH.read_text(encoding="utf-8")) or []


def save_queue(items):
    QUEUE_PATH.write_text(
        "# Cola de artículos SEO para Endonautas\n"
        "# El script toma el primero con published: false\n"
        "# Después de publicar: published: true + published_date: YYYY-MM-DD\n\n"
        + yaml.dump(items, allow_unicode=True, default_flow_style=False, sort_keys=False),
        encoding="utf-8",
    )


def render_md(article):
    tags_yaml = "[" + ", ".join(f'"{t}"' for t in article.tags) + "]"
    today = date.today().isoformat()
    fm = [
        "---",
        f'title: "{article.title}"',
        f'description: "{article.description}"',
        f'pubDate: {today}',
        f'category: "{article.category}"',
        f'layer: "{article.layer}"',
        f'tags: {tags_yaml}',
        "draft: false",
    ]
    if article.image:
        fm.append(f'image: "{article.image}"')
    fm.append(f'cta: "{article.cta}"')
    fm.append("---")
    return "\n".join(fm) + "\n\n" + article.body + "\n"


def register_serpbear(keyword):
    if not SERPBEAR_KEY:
        print("[seo] Sin SERPBEAR_API_KEY — skip SerpBear", file=sys.stderr)
        return
    try:
        r = requests.post(
            f"{SERPBEAR_URL}/api/keywords",
            json={"domain": "endonautas.cl", "keywords": [keyword], "device": "desktop", "country": "cl", "tags": []},
            headers={"x-api-key": SERPBEAR_KEY},
            timeout=15,
            verify=False,
        )
        r.raise_for_status()
        print(f"[seo] SerpBear: '{keyword}' registrada")
    except Exception as e:
        print(f"[seo] SerpBear error (no bloqueante): {e}", file=sys.stderr)


def main():
    items = load_queue()
    entry = next((i for i in items if not i.get("published", False)), None)
    if not entry:
        print("[seo] Queue vacía — todos los temas publicados")
        sys.exit(0)

    topic, keyword, category, layer = entry["topic"], entry["keyword"], entry["category"], entry["layer"]
    print(f"[seo] Generando: {topic}")
    print(f"[seo] Keyword: {keyword} | {category} | {layer}")

    article = generate(topic, keyword, category, layer)
    print(f"[seo] Artículo: '{article.title}' ({len(article.body)} chars)")

    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    blog_path = BLOG_DIR / f"{article.slug}.md"
    blog_path.write_text(render_md(article), encoding="utf-8")
    print(f"[seo] Escrito: {blog_path}")

    for item in items:
        if item["topic"] == topic:
            item["published"] = True
            item["published_date"] = date.today().isoformat()
            break
    save_queue(items)

    register_serpbear(keyword)

    # Escribir pending JSON para el pipeline social
    pending_dir = Path(__file__).parent.parent.parent / "pending"
    pending_dir.mkdir(exist_ok=True)
    pending_path = pending_dir / f"{article.slug}.json"
    pending_path.write_text(json.dumps({
        "slug": article.slug,
        "title": article.title,
        "keyword": keyword,
        "layer": layer,
        "category": category,
        "image": article.image,
        "article_path": f"src/content/blog/{article.slug}.md",
        "published_date": date.today().isoformat(),
        "status": "pending",
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[seo] Pending: {pending_path}")

    print(f"[seo] URL: https://endonautas.cl/blog/{article.slug}/")


if __name__ == "__main__":
    main()
