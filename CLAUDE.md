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

GET endpoint del flywheel social. Lee `pending/` vía GitHub Contents API. Devuelve tres arrays separados por etapa del pipeline. Usa `GITHUB_TOKEN` (env var en Cloudflare Pages — nunca expuesto al cliente).

Respuesta:
```json
{
  "scored":       [{ "slug": "...", "title": "...", "article_path": "...", "finalists": [...], "viral_scores": {...}, "avatar_variants": {...}, "captions": {...} }],
  "copy_pending": [{ "slug": "...", "title": "...", "article_path": "...", "avatar_variants": { ... } }],
  "ready_review": [{ "slug": "...", "title": "...", "r2_urls": [...], "approved": [...] }]
}
```

- `scored` → status `scored` + `finalists[]` presente (IA ya filtró — Franco revisa solo finalistas)
- `copy_pending` → status `copy_pending_review` + `avatar_variants` (legacy / fallback sin scoring)
- `ready_review` → status `ready_to_publish` + `r2_urls` presente

### `functions/api/approve-copy.js`

POST endpoint del flywheel social. Recibe selecciones de Franco y actualiza el pending JSON en GitHub. Soporta dos esquemas:

**Esquema nuevo (finalistas IA):**
```json
{
  "slug": "mi-articulo",
  "approved_selections": [
    {
      "finalist_id": "negocio_v0",
      "director": "contrain",
      "carousel": true,
      "reel": true,
      "edited_captions": {
        "instagram": "...", "tiktok": "...", "linkedin": "...",
        "youtube_title": "...", "youtube_description": "..."
      }
    }
  ]
}
```

**Esquema legacy:**
```json
{
  "slug": "mi-articulo",
  "approved_selections": [
    { "avatar": "negocio", "variant_index": 0, "director": "loop", "carousel": true, "reel": false }
  ]
}
```

- `finalist_id`: formato `"{avatar}_v{variant_index}"` — ej. `"negocio_v0"`, `"profesional_v2"`
- `edited_captions`: captions editados por Franco en la UI (opcional — si omite, usa los generados por caption_gen)
- `director`: uno de los 7 directores cinematográficos (estilo visual, no copy)

Flujo interno:
1. Lee `pending/<slug>.json` via GitHub Contents API (para obtener SHA)
2. Parsea `finalist_id` con regex `/^(.+)_v(\d+)$/` → extrae avatar + variant_index
3. Extrae copy de `avatar_variants[avatar][variant_index]`
4. Captions: usa `edited_captions` si vienen del UI, sino fallback a `captions[finalist_id]` del JSON
5. Escribe `approved[]` con `finalist_id`, `captions`, `carousel_copy`, `reel_copy` y `status: copy_approved`
6. PUT a GitHub Contents API con SHA → commit automático en el repo

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
pending → copy_pending_review → scored → copy_approved → ready_to_publish → published
```

Estados de error (reintentables por cron): `scoring_error`, `generation_error`.

| Status | Quién lo escribe | Significado |
|--------|-----------------|-------------|
| `pending` | `run_ci.py` | Artículo publicado, sin copy generado |
| `copy_pending_review` | `generate_social.py` Phase 1 | DeepSeek generó 12 variantes (`avatar_variants`) |
| `scoring_error` | `generate_social.py` Phase 1 | Falló el scoring — reintentable |
| `scored` | `generate_social.py` Phase 1 | `viral_scores` + `finalists` + `captions` escritos |
| `copy_approved` | `approve-copy.js` | Franco aprobó finalistas + editó captions |
| `ready_to_publish` | `generate_social.py` Phase 2 | Imágenes/video en R2, webhook a N8N disparado |
| `generation_error` | `generate_social.py` | Falló Phase 2 — reintentable |
| `published` | n8n workflow | Publicado en Instagram + TikTok + LinkedIn + YouTube |

Campos de resiliencia en cada JSON: `last_updated` (ISO), `last_error` (string, si falló).

Campos opcionales post-aprobación visual: `scheduled_at` (ISO, si se programó), `reel_formats` (`{"0":"reel","1":"story"}`).

### Avatares de copy (4)

| Key | Público |
|-----|---------|
| `negocio` | Dueños de negocio |
| `profesional` | Profesionales |
| `padres` | Padres |
| `terapeuta` | Terapeutas |

Cada avatar genera: `carousel` (slides), `reel` (hook_a/hook_b/cta). Captions largos los genera `caption_gen.py` solo para finalistas post-scoring.

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

**Claves de `reel_copy` por director (formato actual):**  
El copy generado tiene siempre `{ hook_a, hook_b, cta, keywords }`. Cada director mapea estas claves a sus propias variables internas:
- `loop` → `hook_a`, `hook_b` (match directo)
- `contrain` → `hook_a` = contrain, `hook_b` = reencuadre
- `quote` → `hook_a` = cita, `hook_b` = atribucion
- `pregunta` → `hook_a` = pregunta
- `hook` → `hook_a` = fase_0, `hook_b` = fase_1, fallback para fase_2/fase_final
- `documental` → `hook_a` = reflexion_1, `hook_b` = reflexion_2

Todos los directores tienen fallback integrado si la clave no existe. No regenerar copy para cambiar director.

### Scripts de soporte (local)

- `scripts/social/batch_phase1.py` — genera `avatar_variants` para artículos `copy_pending_review`. Flags: `--slug X`, `--retry-empty`.
- `scripts/social/health_check.py` — estado de pending JSONs + stuck detection. Flags: `--json`, `--auto-retry`. Exit 1 si hay errores.

### Oracle — scripts de producción

Path: `/home/ubuntu/content-studio/generate_social.py`  
SSH key local: `/home/nikka/DevTools/oracle-free/ssh/ssh-key-2026-06-14.key`  
Env obligatorio: `/home/ubuntu/.env_endonautas` (contiene `DEEPSEEK_API_KEY`, `R2_*`, `N8N_WEBHOOK_URL`, `BROLLS_BASE_PATH`)

**CRÍTICO:** Siempre sourcer el env antes de correr manualmente. Sin él, DeepSeek devuelve vacío y scoring falla.

**Dependencias del sistema (Oracle):** `ffmpeg` requerido para renderizar reels. Verificar con `which ffmpeg` antes de correr batch. Instalado 2026-07-01.

**B-rolls:** `/home/ubuntu/content-studio/brolls/endonautas/biblioteca/{cluster}/*.mp4`  
Clusters disponibles: `terapia`, `fractales`, `colibri`, `emociones`, `patrones`, `autoconocimiento`, `espejo-ia`.  
Agregado via: `rsync -avz --progress -e "ssh -i KEY" local/brolls/ ubuntu@146.181.39.4:/home/ubuntu/content-studio/brolls/`  
`BROLLS_BASE_PATH=/home/ubuntu/content-studio/brolls/endonautas` en `.env_endonautas`.

```bash
# Procesar siguiente artículo pendiente (detecta fase por status)
ssh -i /home/nikka/DevTools/oracle-free/ssh/ssh-key-2026-06-14.key ubuntu@146.181.39.4 \
  "source /home/ubuntu/.env_endonautas && cd /home/ubuntu/content-studio && python3 generate_social.py --auto"

# Slug específico
ssh -i /home/nikka/DevTools/oracle-free/ssh/ssh-key-2026-06-14.key ubuntu@146.181.39.4 \
  "source /home/ubuntu/.env_endonautas && cd /home/ubuntu/content-studio && python3 generate_social.py el-problema-no-es-el-insight"

# Batch: procesar N artículos seguidos (útil cuando hay muchos copy_approved)
ssh -i /home/nikka/DevTools/oracle-free/ssh/ssh-key-2026-06-14.key ubuntu@146.181.39.4 \
  "source /home/ubuntu/.env_endonautas && cd /home/ubuntu/content-studio && \
   nohup bash -c 'for i in \$(seq 1 11); do python3 generate_social.py --auto; sleep 5; done' \
   >> /home/ubuntu/logs/social_batch.log 2>&1 &"
```

Cron: `/home/ubuntu/scripts/run_social.sh` · cada 30 min (`*/30 * * * *`) · ya sourcea el env.

**Bugs históricos corregidos en `_git_push()`:**
1. Orden incorrecto: `pull --rebase` ANTES de commit → "unstaged changes". Fix: `git add` → `git commit` → `git stash` → `git pull --rebase` → `git stash pop` → `git push`.
2. (2026-07-01) `git stash pop` fallaba si no había nada que stashear (batch secuencial = 0 cambios extra). Fix: solo hace `stash pop` si `stash` realmente guardó algo (`"No local changes to save" not in stdout`). No revertir este patrón.

**Resiliencia de reels (2026-07-01):** Si un reel falla, el artículo igualmente llega a `ready_to_publish` con los carruseles. El error del reel se loguea como WARN pero no propaga la excepción. Antes, cualquier error en Phase 2 bloqueaba el artículo entero.

Fases detectadas por status:
- **Phase 1** (`pending → copy_pending_review`): 12 variantes de copy vía DeepSeek.
- **Phase 1b** (`copy_pending_review/scoring_error → scored`): scoring IA + captions para finalistas.
- **Phase 2** (`copy_approved → ready_to_publish`): genera JPG/MP4, sube a R2.

### n8n — publicación automática en Instagram

URL: `https://n8n.146.181.39.4.sslip.io`  
Login: `fjeriacastro@gmail.com` (contraseña propia de N8N)

| Workflow ID | Nombre | Horario (UTC) | Acción |
|-------------|--------|---------------|--------|
| `LCSET9g5cyLG5qHZ` | Daily Publish 11:11 | 14:11 (= 11:11 Chile) | Toma primer `ready_to_publish` → carousel + reel en IG |
| `noYRxzrL7NpLCORv` | Daily Stories | 16:00 / 19:00 / 22:00 | Reel random de `published` → historia IG |
| `e6381324-...` | Instagram Publisher (legacy) | — | **DESACTIVADO** |

**Flujo completo de test:**
1. Oracle: `python generate_social.py --auto` → procesa artículo `copy_pending_review` → `scored`
2. `https://endonautas.cl/review-social/` → aprobar finalista
3. Oracle: `python generate_social.py --auto` → genera assets → `ready_to_publish`
4. N8N UI → `Daily Publish 11:11` → "Execute Workflow" (manual trigger)

Credenciales Meta (no mover del nodo Code):
- `IG_USER_ID`: `17841408150037364` · `FB_PAGE_ID`: `112522961877445`
- `PAGE_TOKEN`: never-expiring token en el código del workflow

### n8n — YouTube (credencial creada, redirect URI agregado — pendiente connect final)

Credencial N8N ID: `7tyyXesjuDtwHDid` — "YouTube Endonautas"  
Google project: `oout-endonautas` | Channel: `UC9hqN2eNx1X-U-2ev9GUsCg`  
Client ID: `763071214392-rlvc5qblai35te7u1n7e6bof2hbs0mf4.apps.googleusercontent.com`

**Estado (2026-06-30):** Redirect URI `https://n8n.146.181.39.4.sslip.io/rest/oauth2-credential/callback` ya agregado en Google Console. Falta conectar el token OAuth.

**Para completar la conexión:**
1. En N8N UI → Credentials → "YouTube Endonautas" → Connect → autorizar con cuenta Google (`fjeriacastro@gmail.com`)
2. Listo — el workflow `Daily Publish 11:11` ya tiene el nodo YouTube integrado

El nodo de YouTube en el workflow Code es **no bloqueante**: si el token no está disponible, publica igual en IG y loguea `[YT] credencial pendiente`.

### n8n — OAuth pendiente (LinkedIn, TikTok)

**Callback URI:**
```
https://n8n.146.181.39.4.sslip.io/rest/oauth2-credential/callback
```

| Red | Crear app en | Scopes | Estado |
|-----|-------------|--------|--------|
| **LinkedIn** | https://www.linkedin.com/developers/apps/new | `w_member_social`, `openid`, `profile` | ⏳ pendiente aprobación |
| **TikTok** | https://developers.tiktok.com/apps/ | `video.upload`, `video.publish` | ⏳ pendiente aprobación |

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

## review-social — página interna de aprobación

`src/pages/review-social.astro` — solo acceso Franco, excluida del sitemap.

**Layout:** filmstrip horizontal — `display:flex` con `overflow-x:auto`. Cada `.finalist-card` tiene `flex: 0 0 260px` (ancho fijo), todos en una sola fila. No wrappea.

**IDs de elementos:** todos los textareas y charcount llevan prefijo `{slug}-{fid}` para evitar colisión cuando dos artículos distintos tienen el mismo `finalist_id` (ej. `padres_v0`). Formato: `ta-{slug}-{fid}-{network}`.

**Bug histórico (corregido):** El botón "Enviar aprobados" usaba `onclick="submitApproved(..., ${JSON.stringify(finalists)})"` — las comillas dobles del JSON rompían el atributo HTML y el botón no disparaba nada. Ahora usa `addEventListener('click', ...)`.

**Flujo de uso:**
1. Carga `GET /api/list-pending` → muestra artículos `scored` en filmstrip
2. Franco revisa slides, captions por red (tabs Instagram/TikTok/LinkedIn/YT), edita si necesita
3. Marca Aprobar/Skip por tarjeta; selecciona director y formatos (carrusel/reel)
4. "Enviar aprobados" → `POST /api/approve-copy` → artículo pasa a `copy_approved`
5. Cron Oracle detecta y genera assets en ~30 min por artículo

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
