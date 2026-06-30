# Landing Endonautas

Sitio estático de marketing para [endonautas.cl](https://endonautas.cl) construido con Astro 4.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 4.x (SSG) |
| Tipografía | Space Grotesk (headings) + Inter (body) vía Google Fonts |
| Deploy | Cloudflare Pages (auto-deploy al hacer push a `main`) |
| Analytics | Umami — `analytics.endonautas.cl` |
| Functions | Cloudflare Pages Functions (`functions/api/`) |

## Infraestructura de producción

**Deploy:** Cloudflare Pages · proyecto `astro-endonautas`  
**Dominio:** `https://endonautas.cl` (DNS en Cloudflare)  
**Repo:** `github.com/jeria88/astro-endonautas`  
**Branch:** `main` → auto-deploy en Cloudflare Pages al hacer push

## Desarrollo local

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # verificar build antes de push
```

## Páginas

| URL | Descripción |
|-----|-------------|
| `/` | Landing principal con hero, comparativa, instrumentos, precios, FAQ, newsletter |
| `/profesionales` | Landing B2B — Plan Practicante para terapeutas y coaches |
| `/blog/` | Índice del blog |
| `/ebook` | Página del libro *Endonautica* |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos de uso |
| `/contacto` | Formulario de contacto |
| `/equipo` | Equipo / acerca de |
| `/review-social` | Revisión interna de copy variants (excluida del sitemap, solo Franco) |

## CTAs principales

| CTA | Destino |
|-----|---------|
| "Ver mi Mapa de Patrones" (hero) | `https://app.endonautas.cl/tests/mapa-patrones/` |
| "Empezar gratis" | `https://app.endonautas.cl/registro/` |
| "Activar Navegante" | `https://app.endonautas.cl/registro/?plan=navegante` |
| "Activar Practicante" | `https://app.endonautas.cl/registro/?plan=practicante` |

## Redes sociales

| Red | URL |
|-----|-----|
| Instagram | `https://www.instagram.com/endonautas/` |
| TikTok | `https://www.tiktok.com/@endonautas` |
| YouTube | `https://m.youtube.com/channel/UC9hqN2eNx1X-U-2ev9GUsCg` |
| LinkedIn | `https://www.linkedin.com/company/endonautas` |

## Cloudflare Pages Functions

### `functions/api/subscribe.js`

Proxy POST hacia Listmonk (evita CORS desde el navegador). Acepta:

```json
{ "email": "user@example.com", "list": "lanzamiento" }
```

| Campo `list` | Lista Listmonk | UUID |
|-------------|---------------|------|
| `lanzamiento` (default) | Lanzamiento (ID 8) | `431ebe70-b897-416b-9016-daea6acc030c` |
| `practicante` | Practicantes (ID 5) | `574f7450-0663-4848-95e5-8ebe4765a33a` |

### `functions/api/list-pending.js`

Flywheel social — GET. Lee `pending/` del repo vía GitHub API. Devuelve dos arrays:
- `copy_pending`: artículos con `status: copy_pending_review` y `avatar_variants` (Franco elige qué generar)
- `ready_review`: artículos con `status: ready_for_review` y `r2_urls` (Franco aprueba el output visual)

Requiere env var `GITHUB_TOKEN` en Cloudflare Pages.

### `functions/api/approve-copy.js`

Flywheel social — POST. Recibe selecciones de Franco (`slug`, `approved_selections[]`), actualiza el pending JSON en GitHub con `approved[]` y `status: copy_approved`. El cron en Oracle detecta el cambio y genera las piezas de media.

```json
{
  "slug": "mi-articulo",
  "approved_selections": [
    { "avatar": "negocio", "variant_index": 0, "director": "loop", "carousel": true, "reel": false }
  ]
}
```

- **`avatar`**: público objetivo del copy (`negocio | profesional | padres | terapeuta`)
- **`director`**: estilo visual de la pieza (`loop | contrain | quote | hook | pregunta | edu | documental`)
- Los avatares generan el copy (Instagram/TikTok/LinkedIn + slides + hook). Los directores controlan la edición visual.

### `functions/api/approve-visual.js`

Flywheel social — POST. Franco aprueba el output visual generado (status `ready_for_review → approved`).

```json
{
  "slug": "mi-articulo",
  "scheduled_at": "2026-07-01T15:00:00.000Z",
  "reel_formats": { "0": "reel", "1": "story" }
}
```

- `scheduled_at` (opcional): ISO datetime para programar la publicación. Omitir = próximo ciclo n8n (~2h).
- `reel_formats` (opcional): formato por índice de reel. Valores: `"reel"` (Reel IG) o `"story"` (Story IG). Default: `"reel"`.

### `functions/api/health.js`

Flywheel social — GET. Monitoreo del estado del pipeline. Lee todos los `pending/*.json`, detecta artículos atascados por umbral de tiempo por status, y retorna `{ healthy, total, by_status, stuck, errors }`.

**Env var requerida en Cloudflare Pages:** `GITHUB_TOKEN` (con permisos `contents: read` sobre el repo).

## Blog

- Artículos en `src/content/blog/*.md`, generados por `scripts/seo/run_ci.py` (DeepSeek + Pexels)
- Schema en `src/content/config.ts` — campos relevantes: `image` (URL Pexels landscape, opcional), `ogImage`, `category`, `layer`, `cta`
- Páginas de artículo (`/blog/[slug]/`): hero image encima del título, cosmos Three.js reducido a opacity 0.12, layout 960px
- Pipeline de imágenes: `writer.py` llama Pexels al generar; `backfill_images.py` asignó imágenes a artículos existentes (ya ejecutado)

### Flywheel social — pipeline de status

```
pending → copy_pending_review → copy_approved → ready_for_review → approved → published
```

| Status | Responsable |
|--------|------------|
| `pending` | `run_ci.py` al publicar artículo |
| `copy_pending_review` | `generate_social.py` Phase 1 (Oracle cron) o `batch_phase1.py` (local) |
| `copy_approved` | `approve-copy.js` — Franco elige avatar + director en `/review-social` |
| `ready_for_review` | `generate_social.py` Phase 2 (Oracle) — imágenes/video en R2 |
| `approved` | `approve-visual.js` — Franco aprueba output + scheduling + reel/story |
| `published` | n8n workflow — publica en Instagram + Facebook |
| `generation_error` | `generate_social.py` en fallo — reintentable automáticamente |

Copy generado por DeepSeek en 4 avatares (negocio / profesional / padres / terapeuta).  
Producción visual con directores cinematográficos (`loop`, `contrain`, `quote`, `hook`, `pregunta`, `edu`, `documental`).  
Scripts en Oracle: `/home/ubuntu/content-studio/generate_social.py`

Scripts locales: `scripts/social/batch_phase1.py` (generar copy en lote), `scripts/social/health_check.py` (monitoreo).

Campos de resiliencia en cada pending JSON: `last_updated` (ISO), `last_error` (string).

### n8n — publicación automática (Instagram + Facebook)

Workflow `e6381324-1127-4713-b755-17f30b30cb9d` · activo · cada 2h.

- Busca JSON con `status: approved`
- Si `scheduled_at` está en el futuro → salta (no publica todavía)
- Publica carousel en IG + foto de portada en FB Page
- Publica reels o stories según `reel_formats` (`REELS` vs `STORIES` en Graph API v21.0)
- Actualiza JSON a `status: published`

## Servicios relacionados (Oracle Cloud — mismo servidor que la app)

| Servicio | URL | Función |
|---------|-----|---------|
| Umami | `https://analytics.endonautas.cl` | Analytics (open source) |
| Uptime Kuma | `https://status.endonautas.cl` | Monitoreo de uptime |
| Listmonk | `https://mail.endonautas.cl` | Email marketing |
| SerpBear | `https://seo.endonautas.cl` | Tracking keywords SEO |
| n8n | (interno) | Automatización de marketing |

### Listmonk — listas activas

| Lista | ID | UUID | Descripción |
|-------|----|------|-------------|
| Usuarios App | 4 | — | Registrados en app.endonautas.cl |
| Practicantes | 5 | `574f7450-0663-4848-95e5-8ebe4765a33a` | Leads de /profesionales/ |
| Leads App | 7 | — | Usuarios free → upgrade |
| Lanzamiento | 8 | `431ebe70-b897-416b-9016-daea6acc030c` | Leads de la landing |

SMTP configurado: `smtp-relay.brevo.com:587` · login `aaccf1001@smtp-brevo.com` · from `hola@endonautas.cl`

## Analytics (Umami)

Script integrado en `src/layouts/Layout.astro`:
```html
<script defer data-website-id="e03fa69e-9931-411c-9838-7f6ffea90426"
        src="https://analytics.endonautas.cl/script.js"></script>
```

## Deploy

```bash
git add .
git commit -m "fix: ..."
git push origin main    # activa auto-deploy en Cloudflare Pages
```
