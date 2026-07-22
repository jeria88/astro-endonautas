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
| `/taller-terapeutas` | `src/pages/taller-terapeutas.astro` | Landing dedicada Taller 1 Terapeutas (1-ago) — oferta única sin dilución (agenda, beneficios, FAQ, checkout de seña $5.000 vía MP). Usa `minimalNav` en Layout/Nav para ocultar links de precios/CTAs alternativos |

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
| `taller1-terapeutas` | Lista de espera Taller 1 (2026-07-18) | `af786bb5-cada-49a8-92fb-cb4ca441f689` |

Para agregar una lista nueva: agregar al objeto `LIST_UUIDS` en el archivo.

**Fix 2026-07-18:** `LISTMONK_URL` apuntaba a `mail.endonautas.cl`, dominio caído desde la migración de servicios de jun-2026 (daba 503) — el formulario de `/profesionales/` respondía "ok" pero el lead nunca llegaba a Listmonk. Ahora apunta a `https://mail.146.181.39.4.sslip.io/api/public/subscription` (mismo host que documenta el CLAUDE.md de la app).

### Flywheel social — ARCHIVADO (2026-07-03), reemplazado por ACME Agents

Las 6 Cloudflare Functions del pipeline social (`list-pending.js`, `approve-copy.js`, `approve-visual.js`,
`health.js`, `publish-now.js`, `retry-generation.js`), la página `review-social.astro`, y los scripts
`scripts/social/batch_phase1.py` / `health_check.py` **ya no existen en este repo**. Este CLAUDE.md
documentaba en detalle (endpoints, esquemas JSON, pipeline de status, directores cinematográficos, cron
n8n) un sistema que fue migrado a Oracle FastAPI (`api.endonautas.cl`, commit `eb77acb`, 2026-07-01) y dos
días después archivado por completo — "superseded por ACME Agents (content-studio + lazycash-web)"
(commit `4affd5f`, 2026-07-03). Todo el código viejo (incluyendo los `pending/*.json` de esa era) quedó
movido a `/home/nikka/Proyectos/_archivo_ecosistema/endonautas-web/`, no borrado.

**Sistema vigente:** generación y publicación de contenido social corre ahora vía la plataforma ACME
Agents (MCP `acmeagents-endonautas` — `create_article` → `approve_variants` → `approve_visual_plan` →
`publish`). No hay documentación de arquitectura de ese sistema en este repo — ver bitácora de ACME Agents.

**Nota:** `functions/api/subscribe.js` y `functions/api/contact.js` siguen activos y no forman parte de
este pipeline archivado — ver sección de arriba.

**Basura huérfana pendiente de limpiar:** `pending/` todavía tiene 5 archivos `.json` con el esquema
viejo (`avatar_variants`, sin `status` consumible) que nadie procesa — ningún código lee ese directorio
hoy. Están ahí porque `4affd5f` archivó el pipeline pero no vació completamente `pending/`.

## Blog

### Campo `image` en artículos

El schema de `src/content/config.ts` incluye `image: z.string().optional()` (URL Pexels landscape).

- La página de artículo (`src/pages/blog/[...slug].astro`) muestra hero image si el campo existe
- El cosmos Three.js (`#cbg`) se reduce a `opacity: 0.12` en las páginas de artículo (`:global(#cbg)`)
- Layout: `.post-wrap` max-width 960px, `.prose` max-width 780px

### Pipeline de imágenes

- **Nuevos artículos**: `scripts/seo/writer.py` llama a Pexels automáticamente al generar. `scripts/seo/run_ci.py` lo incluye en el frontmatter y en el pending JSON.
- **Backfill (one-time, ya ejecutado)**: `scripts/seo/backfill_images.py` asignó imagen a los 11 artículos existentes.

## Flywheel social — ARCHIVADO, ver sección "Cloudflare Pages Functions" arriba

Todo lo que vivía aquí (pipeline de status `pending→...→published`, 4 avatares de copy, 7 directores
cinematográficos, scripts `batch_phase1.py`/`health_check.py`, scripts Oracle `generate_social.py`,
workflows n8n de publicación IG/YouTube/LinkedIn/TikTok) describía el flywheel social que fue archivado
el 2026-07-03 (`4affd5f`, ver nota arriba). No reinstalar sin revisar primero si ACME Agents ya lo cubre.

## Listmonk — listas y campañas

| Lista | ID | UUID |
|-------|----|------|
| Usuarios App | 4 | — |
| Practicantes | 5 | `574f7450-0663-4848-95e5-8ebe4765a33a` |
| Leads App | 7 | — |
| Lanzamiento | 8 | `431ebe70-b897-416b-9016-daea6acc030c` |
| Taller 1 Terapeutas (lista de espera) | — | `af786bb5-cada-49a8-92fb-cb4ca441f689` |

9 campañas email en draft (3 × Lanzamiento, 3 × Leads App, 3 × Practicantes).
Acceso admin: `https://mail.146.181.39.4.sslip.io` (dominio propio `mail.endonautas.cl` caído desde jun-2026, ver fix arriba) · usuario `admin` · contraseña en README.md del repo app.

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

## review-social — ARCHIVADA (2026-07-03)

`src/pages/review-social.astro` ya no existe en el repo — archivada junto con el resto del flywheel
social (ver nota arriba). El código sigue en `/home/nikka/Proyectos/_archivo_ecosistema/endonautas-web/functions-review-social/` y `.../review-social.astro` por si hace falta consultarlo.

## Sitemap

Configurado en `astro.config.mjs`. Filtros activos:
- `/draft/` — excluido
- `/fractones/` — excluido (página legacy de tokens)
- `/review-social` — filtro sigue en el config pero es no-op: la página fue eliminada del repo (ver arriba), no hace daño dejarlo

## Deploy

Push a `main` → Cloudflare Pages detecta vía webhook → build Astro → deploy estático.

```bash
git add .
git commit -m "fix: ..."
git push origin main
```
