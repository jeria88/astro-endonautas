#!/usr/bin/env python3
"""
Chequea el estado del pipeline de contenido social.

Uso:
    python3 scripts/social/health_check.py
    python3 scripts/social/health_check.py --json   # output JSON para el KPI email
    python3 scripts/social/health_check.py --auto-retry  # retoma Phase 1 de artículos stuck
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

WEB_PATH    = Path(__file__).parent.parent.parent
PENDING_DIR = WEB_PATH / "pending"

# Cuánto tiempo en cada estado antes de considerarlo "stuck"
STUCK_THRESHOLDS = {
    "pending":             timedelta(hours=2),
    "copy_pending_review": timedelta(hours=48),   # Franco puede tardar
    "copy_approved":       timedelta(hours=3),    # Oracle debería procesar en <30min
    "ready_for_review":    timedelta(hours=72),   # Franco puede tardar
    "copy_error":          timedelta(hours=1),
    "generation_error":    timedelta(hours=1),
}

STATUS_ORDER = [
    "pending", "copy_pending_review", "copy_approved",
    "ready_for_review", "approved", "published",
    "copy_error", "generation_error",
]


def _parse_ts(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return None


def _age(ts: str | None) -> timedelta | None:
    dt = _parse_ts(ts)
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - dt


def _fmt_age(td: timedelta | None) -> str:
    if td is None:
        return "sin timestamp"
    total = int(td.total_seconds())
    h, m = divmod(total // 60, 60)
    return f"{h}h {m}m"


def check() -> dict:
    by_status: dict[str, list] = {}
    stuck: list = []
    errors: list = []

    for f in sorted(PENDING_DIR.glob("*.json")):
        try:
            data = json.loads(f.read_text())
        except Exception:
            errors.append({"file": f.name, "error": "JSON inválido"})
            continue

        slug   = data.get("slug", f.stem)
        status = data.get("status", "unknown")
        ts     = data.get("last_updated")
        err    = data.get("last_error")
        age    = _age(ts)

        entry = {
            "slug": slug,
            "status": status,
            "last_updated": ts,
            "age": _fmt_age(age),
            "last_error": err,
        }

        by_status.setdefault(status, []).append(entry)

        threshold = STUCK_THRESHOLDS.get(status)
        if threshold and age and age > threshold:
            entry["stuck"] = True
            stuck.append(entry)

        if err or status in ("copy_error", "generation_error"):
            errors.append(entry)

    return {"by_status": by_status, "stuck": stuck, "errors": errors}


def print_report(report: dict) -> None:
    print("=" * 60)
    print("PIPELINE FLYWHEEL — ESTADO")
    print("=" * 60)

    total = sum(len(v) for v in report["by_status"].values())
    print(f"\nTotal artículos: {total}\n")

    for status in STATUS_ORDER:
        items = report["by_status"].get(status, [])
        if not items:
            continue
        print(f"  [{status}]  ({len(items)})")
        for it in items:
            flag = " ⚠️ STUCK" if it.get("stuck") else ""
            err  = f"  → {it['last_error']}" if it.get("last_error") else ""
            print(f"    • {it['slug'][:55]}  ({it['age']}){flag}{err}")

    if report["stuck"]:
        print(f"\n⚠️  STUCK ({len(report['stuck'])} artículos):")
        for it in report["stuck"]:
            print(f"  {it['slug']}  status={it['status']}  age={it['age']}")

    if report["errors"]:
        print(f"\n❌ ERRORES ({len(report['errors'])}):")
        for it in report["errors"]:
            print(f"  {it.get('slug', it.get('file', '?'))}  → {it.get('last_error') or it.get('error', '?')}")

    print("\n" + "=" * 60)


def auto_retry(report: dict) -> None:
    """Retoma Phase 1 de artículos stuck en 'pending' si DEEPSEEK_API_KEY disponible."""
    if not os.environ.get("DEEPSEEK_API_KEY"):
        print("[retry] Sin DEEPSEEK_API_KEY — skip auto-retry Phase 1")
        return

    stuck_pending = [
        it for it in report["stuck"] if it["status"] == "pending"
    ]
    if not stuck_pending:
        print("[retry] Sin artículos stuck en 'pending'.")
        return

    print(f"[retry] Reintentando Phase 1 para {len(stuck_pending)} artículos...")
    script = Path(__file__).parent / "batch_phase1.py"
    for it in stuck_pending:
        print(f"  → {it['slug']}")
        r = subprocess.run(
            [sys.executable, str(script), "--slug", it["slug"]],
            cwd=WEB_PATH,
        )
        if r.returncode != 0:
            print(f"    [!] Falló")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--auto-retry", action="store_true", help="Reintentar Phase 1 stuck")
    args = parser.parse_args()

    report = check()

    if args.json:
        print(json.dumps(report, ensure_ascii=False, default=str, indent=2))
    else:
        print_report(report)

    if args.auto_retry:
        auto_retry(report)

    # Exit code 1 si hay stuck o errores (útil para CI/alertas)
    if report["stuck"] or report["errors"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
