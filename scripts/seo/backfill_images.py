#!/usr/bin/env python3
"""Asigna imagen Pexels a artículos de blog existentes que no tienen campo image."""
import re
import sys
from pathlib import Path

import requests

PEXELS_KEY = "bV1hblCTVtLISKHB7G0Kcx1OzmwOSlwBa8WbgiquRKE3iAyu6bJguGEV"
BLOG_DIR = Path(__file__).parent.parent.parent / "src/content/blog"


def fetch_pexels_image(keyword: str) -> str:
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
    except Exception as e:
        print(f"  [pexels] error con '{keyword}': {e}", file=sys.stderr)
        return ""


def extract_tags(content: str) -> list[str]:
    m = re.search(r'^tags:\s*\[([^\]]+)\]', content, re.MULTILINE)
    if not m:
        return []
    return [t.strip().strip('"').strip("'") for t in m.group(1).split(",")]


def has_image(content: str) -> bool:
    return bool(re.search(r'^image:\s*".+"', content, re.MULTILINE))


def insert_image(content: str, url: str) -> str:
    # Inserta 'image: "url"' después de 'draft: false'
    return re.sub(
        r'(^draft: false)',
        f'\\1\nimage: "{url}"',
        content,
        flags=re.MULTILINE,
    )


def main():
    mds = sorted(BLOG_DIR.glob("*.md"))
    print(f"Artículos encontrados: {len(mds)}")
    updated = 0
    for md in mds:
        content = md.read_text(encoding="utf-8")
        if has_image(content):
            print(f"  skip {md.name} (ya tiene image)")
            continue
        tags = extract_tags(content)
        keyword = tags[0] if tags else md.stem.replace("-", " ")
        print(f"  {md.name} → buscando '{keyword}'...")
        url = fetch_pexels_image(keyword)
        if not url:
            print(f"    sin resultado Pexels")
            continue
        md.write_text(insert_image(content, url), encoding="utf-8")
        print(f"    ✓ {url[:60]}...")
        updated += 1
    print(f"\nActualizados: {updated}/{len(mds)}")


if __name__ == "__main__":
    main()
