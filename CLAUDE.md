# CLAUDE.md — Landing Endonautas (Astro)

> Contexto técnico para Claude. Leer antes de tocar código.

## Stack
- Astro 4.x — SSG (estático puro, sin server-side)
- Repo: `github.com/jeria88/astro-endonautas`
- Branch: `main` → auto-deploy en **Cloudflare Pages** al hacer push
- URL producción: `https://endonautas.cl`

## Arrancar en desarrollo
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/ para verificar
```

## Estructura de páginas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `src/pages/index.astro` | Landing principal — hero, reconoc, dif, inst, precios, FAQ, newsletter |
| `/profesionales` | `src/pages/profesionales.astro` | Landing B2B para terapeutas y coaches — Plan Practicante + captura de leads |
| `/privacidad` | `src/pages/privacidad.astro` | Política de privacidad |
| `/terminos` | `src/pages/terminos.astro` | Términos de uso |
| `/contacto` | `src/pages/contacto.astro` | Formulario de contacto |
| `/ebook` | `src/pages/ebook.astro` | Página del libro Endonautica |
| `/equipo` | `src/pages/equipo.astro` | Equipo / acerca de |
| `/blog/*` | `src/pages/blog/` | Blog |
| `/review-social` | `src/pages/review-social.astro` | Revisión interna de copy variants (excluida del sitemap) |

## Decisiones de diseño (no romper)

- Un solo archivo HTML/Astro por página — sin componentes atomizados salvo que sea necesario
- Fondo oscuro: `#030306` base
- Sistema tipográfico: `Space Grotesk` (headings) + `Inter` (body)
- Color primario: `#7ECCCD` (calipso)
- Sin emojis como iconos — solo ✦ · ◎ como decorativos mínimos
- Animaciones: `from-b` / `from-l` / `from-r` con `data-d` para stagger
- Motion: entrada rápida, salida lenta

## Cloudflare Pages Functions

### `functions/api/subscribe.js`

Proxy POST hacia Listmonk public subscription endpoint. Evita CORS directo desde el browser.

Acepta:
```json
{ "email": "user@example.com", "list": "lanzamiento" }
```

Routing por lista:
| Campo `list` | Lista Listmonk | UUID |
|-------------|---------------|------|
| `lanzamiento` (default) | Lanzamiento (ID 8) | `431ebe70-b897-416b-9016-daea6acc030c` |
| `practicante` | Practicantes (ID 5) | `574f7450-0663-4848-95e5-8ebe4765a33a` |

Para agregar una lista nueva: agregar al objeto `LIST_UUIDS` en el archivo.

### `functions/api/list-pending.js`

GET endpoint del flywheel social. Lee `pending/` vía GitHub Contents API. Devuelve dos arrays separados por etapa del pipeline. Usa `GITHUB_TOKEN` (env var en Cloudflare Pages — nunca expuesto al cliente).

Respuesta:
```json
{
  "copy_pending": [{ "slug": "...", "title": "...", "article_path": "...", "avatar_variants": { ... } }],
  "ready_review":  [{ "slug": "...", "title": "...", "r2_urls": [...], "approved": [...] }]
}
```

- `copy_pending` → status `copy_pending_review` + campo `avatar_variants` presente
- `ready_review` → status `ready_for_review` + campo `r2_urls` presente

### `functions/api/approve-copy.js`

POST endpoint del flywheel social. Recibe selecciones de Franco y actualiza el pending JSON en GitHub.

Acepta:
```json
{
  "slug": "mi-articulo",
  "approved_selections": [
    { "avatar": "negocio", "variant_index": 0, "director": "loop", "carousel": true, "reel": false }
  ]
}
```

- `avatar`: uno de `negocio | profesional | padres | terapeuta`
- `director`: uno de los 7 directores cinematográficos (para edición visual, no para copy)
- `variant_index`: 0, 1 o 2 (tres variantes por avatar)

Flujo interno:
1. Lee `pending/<slug>.json` via GitHub Contents API (para obtener el SHA actual)
2. Extrae copy de `avatar_variants[avatar][variant_index]`
3. Escribe `approved[]` (incluye `avatar`, `director`, `carousel_copy`, `reel_copy`, `social_copy`) y `status: copy_approved`
4. PUT a GitHub Contents API con el SHA → commit automático en el repo

La próxima ejecución del cron en Oracle detecta `status: copy_approved` y genera las piezas de media.

**Env var requerida en Cloudflare Pages:** `GITHUB_TOKEN` con permisos `contents: write` sobre el repo.

### `functions/api/approve-visual.js`

POST endpoint del flywheel social. Franco aprueba el output visual generado y lo manda a publicar.

Acepta:
```json
{
  "slug": "mi-articulo",
  "scheduled_at": "2026-07-01T15:00:00.000Z",
  "reel_formats": { "0": "reel", "1": "story" }
}
```

- `scheduled_at`: ISO timestamp opcional. Si se omite, n8n publica en el próximo ciclo (~2h).
- `reel_formats`: mapa `{índice → "reel"|"story"}` por cada video en `r2_urls`. Default: `"reel"`.

Flujo interno:
1. Valida que `status === "ready_for_review"`
2. Escribe `status: "approved"`, `last_updated`, `scheduled_at` (si viene), `reel_formats` (si viene)
3. n8n detecta `status: approved` en el próximo ciclo y publica

### `functions/api/health.js`

GET endpoint de monitoreo. Lee todos los `pending/*.json` y reporta el estado del pipeline.

```json
{
  "healthy": true,
  "total": 10,
  "by_status": { "copy_pending_review": [...], "approved": [...] },
  "stuck": [],
  "errors": []
}
```

Umbrales de "stuck": `pending > 2h`, `copy_approved > 3h`, `copy_pending_review > 48h`, `ready_for_review > 72h`, errores > 1h.

## Blog

### Campo `image` en artículos

El schema de `src/content/config.ts` incluye `image: z.string().optional()` (URL Pexels landscape).

- La página de artículo (`src/pages/blog/[...slug].astro`) muestra hero image si el campo existe
- El cosmos Three.js (`#cbg`) se reduce a `opacity: 0.12` en las páginas de artículo (`:global(#cbg)`)
- Layout: `.post-wrap` max-width 960px, `.prose` max-width 780px

### Pipeline de imágenes

- **Nuevos artículos**: `scripts/seo/writer.py` llama a Pexels automáticamente al generar. `scripts/seo/run_ci.py` lo incluye en el frontmatter y en el pending JSON.
- **Backfill (one-time, ya ejecutado)**: `scripts/seo/backfill_images.py` asignó imagen a los 11 artículos existentes.

## Flywheel social — pipeline de status

```
pending → copy_pending_review → copy_approved → ready_for_review → approved → published
```

| Status | Quién lo escribe | Significado |
|--------|-----------------|-------------|
| `pending` | `run_ci.py` | Artículo publicado, sin copy generado |
| `copy_pending_review` | `generate_social.py` Phase 1 / `batch_phase1.py` | DeepSeek generó `avatar_variants` |
| `copy_approved` | `approve-copy.js` | Franco aprobó variantes + eligió director |
| `ready_for_review` | `generate_social.py` Phase 2 | Imágenes/video subidos a R2 |
| `approved` | `approve-visual.js` | Franco aprueba output visual + scheduling + formato reel/story |
| `published` | n8n workflow `e6381324` | Publicado en Instagram + Facebook |
| `generation_error` | `generate_social.py` | Falló Phase 2 — reintentable |

Campos de resiliencia en cada JSON: `last_updated` (ISO), `last_error` (string, si falló).

Campos opcionales post-aprobación visual: `scheduled_at` (ISO, si se programó), `reel_formats` (`{"0":"reel","1":"story"}`).

### Avatares de copy (4)

| Key | Público |
|-----|---------|
| `negocio` | Dueños de negocio |
| `profesional` | Profesionales |
| `padres` | Padres |
| `terapeuta` | Terapeutas |

Cada avatar genera: `carousel` (slides), `reel` (hook_a/hook_b/cta), `social` (instagram/tiktok/linkedin).

### Directores cinematográficos (7, solo para edición visual)

| Key | Estilo |
|-----|--------|
| `loop` | Loop — Malick |
| `contrain` | Contraintuición — Fincher |
| `quote` | Cita — Anderson |
| `hook` | Hook — WKW |
| `pregunta` | Pregunta — PTA |
| `edu` | Educativo — McKay |
| `documental` | Documental — Herzog |

Determinan el estilo visual de la pieza, no el copy.

### Scripts de soporte (local)

- `scripts/social/batch_phase1.py` — genera `avatar_variants` para artículos en `pending`/`copy_pending_review` sin copy. Llama DeepSeek directamente. Flags: `--slug X`, `--retry-empty`. Retry × 3 por avatar, guard: si algún avatar queda vacío mantiene `status: pending`.
- `scripts/social/health_check.py` — reporta estado de todos los pending JSONs con edad y stuck detection. Flags: `--json`, `--auto-retry`. Exit code 1 si hay stuck/errores.

### Oracle — scripts de producción

Path: `/home/ubuntu/content-studio/generate_social.py`

- **Phase 1** (`status: pending → copy_pending_review`): cron detecta artículos `pending`, llama DeepSeek para generar `avatar_variants`, escribe pending JSON.
- **Phase 2** (`status: copy_approved → ready_for_review`): cron detecta `copy_approved`, genera imágenes/video, sube a R2, escribe `r2_urls` y avanza status.
- En fallo escribe `status: generation_error` + `last_error`.

### n8n — publicación automática

Workflow ID: `e6381324-1127-4713-b755-17f30b30cb9d` · Activo · corre cada 2h.

Lógica: busca primer JSON con `status: approved`, chequea `scheduled_at` (si futuro, lo salta), publica carousel en IG + primera imagen en FB, publica reels/stories según `reel_formats`, actualiza a `status: published`.

Credenciales Meta:
- `IG_USER_ID`: `17841408150037364`
- `FB_PAGE_ID`: `112522961877445`
- `PAGE_TOKEN`: never-expiring Page token (en el código del workflow — no mover)

## Listmonk — listas y campañas

| Lista | ID | UUID |
|-------|----|------|
| Usuarios App | 4 | — |
| Practicantes | 5 | `574f7450-0663-4848-95e5-8ebe4765a33a` |
| Leads App | 7 | — |
| Lanzamiento | 8 | `431ebe70-b897-416b-9016-daea6acc030c` |

9 campañas email en draft (3 × Lanzamiento, 3 × Leads App, 3 × Practicantes).
Acceso admin: `https://mail.endonautas.cl` · usuario `admin` · contraseña en README.md del repo app.

## Redes sociales (en Footer.astro)

| Red | URL |
|-----|-----|
| Instagram | `https://www.instagram.com/endonautas/` |
| TikTok | `https://www.tiktok.com/@endonautas` |
| YouTube | `https://m.youtube.com/channel/UC9hqN2eNx1X-U-2ev9GUsCg` |
| LinkedIn | `https://www.linkedin.com/company/endonautas` |

## Secciones de index.astro

| ID | Nombre | Función |
|----|--------|---------|
| `#inicio` | Hero | H1 + CTA principal → Mapa de Patrones |
| `#reconoc` | Reconocimiento | 3 quotes de identificación de dolor |
| `#dif` | Diferencia | Versus: terapia/tests/autoayuda vs Endonautas |
| `#inst` | Instrumentos | 6 módulos explicados en lista numerada |
| `#franco` | Autor | Sección sobre Franco |
| `#precios` | Precios | 3 planes: Free / Navegante / Practicante |
| `#faq` | FAQ | Preguntas frecuentes — acordeón |
| `#newsletter` | Captura email | Formulario → lista Lanzamiento vía /api/subscribe |

## Hero — copy actual (2026-06-23)

```
Eyebrow: "Para quienes ya saben lo que les pasa — y siguen igual."
H1:      "Sé lo que me pasa. / Y aun así / lo sigo haciendo."
Subtitle: "Saber lo que te pasa no es suficiente.
           Lo que cambia es la práctica en los días entre sesiones, libros y epifanías."
CTA 1:   "Ver mi Mapa de Patrones" → https://app.endonautas.cl/tests/mapa-patrones/
CTA 2:   "Ver planes" → #precios
```

## Planes en index.astro — precios actuales

| Plan | Precio | CTA |
|------|--------|-----|
| Gratuito | $0 | https://app.endonautas.cl/registro/ |
| Navegante | $10 USD/mes | https://app.endonautas.cl/registro/?plan=navegante |
| Practicante | $39 USD/mes | https://app.endonautas.cl/registro/?plan=practicante |

**Espejo IA en plan free:** tiene límite — NO decir "sin límite" en el copy. El free plan tiene 1 sesión/día y 45 min máx.

## Regla de cambios de copy

Cuando cambies copy de planes, verificar que sea consistente con:
1. `src/pages/index.astro` → sección `#precios`
2. `src/pages/profesionales.astro` → sección plan Practicante
3. `templates/payments/planes.html` en la app Django
4. `templates/legal/terminos.html` en la app Django

## Sitemap

Configurado en `astro.config.mjs`. Filtros activos:
- `/draft/` — excluido
- `/fractones/` — excluido (página legacy de tokens)
- `/review-social` — excluido (página interna de revisión de copy)

## Deploy

Push a `main` → Cloudflare Pages detecta vía webhook → build Astro → deploy estático.

```bash
git add .
git commit -m "fix: ..."
git push origin main
```
