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

Flywheel social — GET. Lee `pending/` del repo vía GitHub API. Devuelve tres arrays:
- `scored`: artículos con `status: scored` — IA ya filtró finalistas con score + captions por red
- `copy_pending`: artículos con `status: copy_pending_review` y `avatar_variants` (legacy / sin scoring aún)
- `ready_review`: artículos con `status: ready_to_publish` y `r2_urls` (Franco aprueba el output visual)

Requiere env var `GITHUB_TOKEN` en Cloudflare Pages.

### `functions/api/approve-copy.js`

Flywheel social — POST. Recibe selecciones de Franco, actualiza el pending JSON en GitHub con `approved[]` y `status: copy_approved`. Soporta dos esquemas:

**Nuevo (finalistas IA):**
```json
{
  "slug": "mi-articulo",
  "approved_selections": [
    {
      "finalist_id": "negocio_v0",
      "director": "contrain",
      "carousel": true,
      "reel": true,
      "edited_captions": { "instagram": "...", "tiktok": "...", "linkedin": "...", "youtube_title": "...", "youtube_description": "..." }
    }
  ]
}
```

**Legacy:**
```json
{
  "slug": "mi-articulo",
  "approved_selections": [
    { "avatar": "negocio", "variant_index": 0, "director": "loop", "carousel": true, "reel": false }
  ]
}
```

- `finalist_id`: `"{avatar}_v{variant_index}"` — ej. `"negocio_v0"`
- `edited_captions`: captions que Franco editó en la UI (opcional — fallback a los generados por caption_gen)
- `director`: estilo visual (`loop | contrain | quote | hook | pregunta | edu | documental`)
- Los avatares generan el copy (slides + hooks). Los directores controlan la edición visual.

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
pending → copy_pending_review → scored → copy_approved → ready_to_publish → published
```

Estados de error (reintentables): `scoring_error`, `generation_error`.

| Status | Responsable |
|--------|------------|
| `pending` | `run_ci.py` al publicar artículo |
| `copy_pending_review` | `generate_social.py` — DeepSeek generó 12 variantes de copy |
| `scoring_error` | `generate_social.py` — falló scoring, cron reintenta |
| `scored` | `generate_social.py` — `viral_scores` + `finalists` + `captions` listos |
| `copy_approved` | `approve-copy.js` — Franco aprobó finalistas (+ captions editados) |
| `ready_to_publish` | `generate_social.py` — assets en R2, webhook N8N disparado |
| `generation_error` | `generate_social.py` — falló Phase 2, reintentable |
| `published` | n8n `social_publish` — publicado en Instagram + TikTok + LinkedIn + YouTube |

Copy: DeepSeek, 4 avatares (negocio / profesional / padres / terapeuta).  
Scoring: rubric IA 5 dimensiones → filtra top N finalistas. Pesos calibrables en `scorer_config.json`.  
Captions: generados solo para finalistas, long-form × 4 redes.  
Producción visual: directores cinematográficos (`loop`, `contrain`, `quote`, `hook`, `pregunta`, `edu`, `documental`).  
Scripts Oracle: `/home/ubuntu/content-studio/generate_social.py`

Campos de resiliencia en cada pending JSON: `last_updated` (ISO), `last_error` (string).

### n8n — publicación automática

URL: `https://n8n.146.181.39.4.sslip.io` · Login: `fjeriacastro@gmail.com`

| ID | Nombre | Horario | Acción |
|----|--------|---------|--------|
| `LCSET9g5cyLG5qHZ` | Daily Publish 11:11 | 11:11 Chile (14:11 UTC) | Carousel + reel → IG |
| `noYRxzrL7NpLCORv` | Daily Stories | 13:00 / 16:00 / 19:00 Chile | Historia aleatoria → IG |

**Test manual:** En N8N UI → abrir workflow → "Execute Workflow". Requiere al menos un JSON en `ready_to_publish` (stories requiere al menos uno en `published`).

**OAuth pendiente** (LinkedIn / TikTok):  
Callback URI: `https://n8n.146.181.39.4.sslip.io/rest/oauth2-credential/callback`
- LinkedIn: https://www.linkedin.com/developers/apps/new — scopes: `w_member_social`
- TikTok: https://developers.tiktok.com/apps/ — scopes: `video.upload`, `video.publish`

**YouTube:** Redirect URI ya agregado en Google Console · Credencial N8N `7tyyXesjuDtwHDid` creada. Pendiente solo: ir a N8N UI → Credentials → "YouTube Endonautas" → Connect.

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
