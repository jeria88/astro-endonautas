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
| `/` | `src/pages/index.astro` | Landing principal — hero, reconoc, dif, incluye, navegante, comunidad, preview, franco, precios, FAQ, newsletter. Reescrita `4858764` (2026-07-29, ver "Posicionamiento" abajo) |
| `/profesionales` | `src/pages/profesionales.astro` | Landing B2B para terapeutas y coaches — Plan Practicante + captura de leads. Alineada al mismo reposicionamiento que `/` (`4858764`, `8bebd73`, `4aa34e5`, `69ea2a2`) |
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

## Posicionamiento — terapeuta como cliente ideal (2026-07-29, `4858764`)

Decisión de Franco: el ICP pasó de "navegante" (usuario final) a terapeuta/coach que necesita
agenda, ficha clínica y clientes — el navegante llega después, porque quiere usar la herramienta
que usa su terapeuta. Reescritura completa de copy con criterio de oferta (se vende el resultado,
no el mecanismo) sobre `index.astro`, `profesionales.astro`, `ebook.astro`, `equipo.astro`,
`contacto.astro`, `404.astro`, `Nav.astro` y `Footer.astro`:

- Nav: `Para terapeutas / Qué incluye / Precios / Blog / Contacto`; Ebook y Equipo bajan al footer.
- Plan **Practicante pasa a ser el plan destacado/central** (antes era la tercera tarjeta sin
  destaque); Navegante queda como la puerta para quien no atiende clientes.
- Se corrigieron dos afirmaciones que la web hacía y el producto no cumple: exportación de fichas
  (no existe — solo se exporta el chat del Espejo) y el "8 minutos por sesión" de `/profesionales/`
  (estadística sin fuente).
- Se retiró el voseo rioplatense de las páginas estáticas (sigue pendiente en los artículos del blog).
- **Garantía de 30 días sin preguntas** (`8bebd73`, mismo día): aplica una vez por cuenta, sobre el
  primer pago de una suscripción (Navegante o Practicante); no cubre la seña ni el bono del taller.
  Forzó corregir `terminos.astro`, que decía literalmente "No hay reembolsos por períodos ya
  facturados" — sin ese fix la garantía habría quedado contradicha por el único texto que la obliga.
  Facturación pasó de "USD" a "CLP o USD según el medio de pago" en el mismo cambio.
- CTA principal reescrito de "Abrir mi consulta" a **"Evolucionar mi consulta"** (`69ea2a2`, versión
  corta "Elevar mi consulta" en botones `btn-sm`) en 8 apariciones de 4 archivos — el CTA de
  `Nav.astro`/`Footer.astro` no estaba en ese commit y sigue diciendo "Abrir mi consulta" (posible
  inconsistencia menor a revisar).
- H1 del hero sigue en lenguaje terapeuta ("tu cliente") por decisión de ticket; en vez de un
  selector, `40c0d81` agregó un pre-header con dos links ("Soy terapeuta" / "Voy a terapia") que
  enrutan a `#incluye`/`#navegante` sin tocar el H1.
- `4aa34e5` sumó secciones propias `#navegante` y `#comunidad` (antes solo existían como una
  columna de precio y un bullet suelto) — ver tabla de secciones abajo.

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

## Analytics (Umami)

Script de tracking en `src/layouts/Layout.astro`, website id `e03fa69e-9931-411c-9838-7f6ffea90426`.

**Fix 2026-07-30 (`199b76f`):** apuntaba a `analytics.endonautas.cl`, dominio caído desde la
migración de servicios de jun-2026 (503) — Umami nunca recibió una sola visita real pese a tener
la API de lectura bien configurada del lado del dashboard. Corregido a
`https://analytics.146.181.39.4.sslip.io/script.js` (mismo host que documenta el CLAUDE.md de la
app). Mismo patrón que el fix de Listmonk de arriba — dominios `*.endonautas.cl` de herramientas de
servidor quedaron rotos con esa migración; si aparece otro similar, la URL genérica vigente vive en
el CLAUDE.md de `app-endonautas`.

## Redes sociales (en Footer.astro)

| Red | URL |
|-----|-----|
| Instagram | `https://www.instagram.com/endonautas/` |
| TikTok | `https://www.tiktok.com/@endonautas` |
| YouTube | `https://m.youtube.com/channel/UC9hqN2eNx1X-U-2ev9GUsCg` |
| LinkedIn | `https://www.linkedin.com/company/endonautas` |

## Secciones de index.astro (actualizado 2026-07-29, `4858764`/`4aa34e5`)

| ID | Nombre | Función |
|----|--------|---------|
| `#inicio` | Hero | Pre-header "Soy terapeuta"/"Voy a terapia" + H1 + CTA principal → registro Practicante |
| `#reconoc` | Reconocimiento | 3 quotes de identificación de dolor (dirigidas al terapeuta) |
| `#dif` | Diferencia | Versus: software de agenda/fichas/PDF vs Endonautas |
| `#incluye` | Instrumentos | 6 módulos explicados en lista numerada. Renombrado de `#inst` a `#incluye` en `4858764` — el nav y los CTAs "Ver qué incluye" apuntan a este id |
| `#navegante` | Navegante | Sección propia (nueva, `4aa34e5`) para quien no tiene consulta — antes solo era una columna de precio |
| `#comunidad` | Comunidad | Sección propia (nueva, `4aa34e5`) — 4 foros (Soñadores Lúcidos, Emprendedores, Padres, Errores & Soporte), incluida desde el plan gratis |
| `#preview` | Galería 3D | Carrusel de screenshots de la app (no tocado por los commits de este ciclo; preexistente sin documentar) |
| `#franco` | Autor | Sección sobre Franco |
| `#precios` | Precios | 3 planes: Gratuito / Practicante (destacado) / Navegante |
| `#faq` | FAQ | Preguntas frecuentes — acordeón, reescritas como objeciones reales del terapeuta (`4858764`) + objeción de garantía (`8bebd73`) |
| `#newsletter` | Captura email | Formulario → lista Lanzamiento vía /api/subscribe |

## Hero — copy actual (2026-07-30, `4aa34e5`+`40c0d81`+`69ea2a2`)

```
Pre-header: "Soy terapeuta" (→ #incluye) · "Voy a terapia" (→ #navegante)
H1:      "Mira lo que tu cliente hizo entre sesiones, antes de que entre."
Subtitle: "Agenda, fichas clínicas y 35 tests que asignas y llegan corregidos a la ficha.
           Todo en un lugar. Por menos de lo que cobras por una sesión."
CTA 1:   "Evolucionar mi consulta" → https://app.endonautas.cl/registro/?plan=practicante
CTA 2:   "Ver qué incluye" → #incluye
Nota:    "$39.990 al mes · 30 días de garantía, sin preguntas · Sin contrato"
```

## Planes en index.astro — precios actuales (2026-07-29/30)

| Plan | Precio | CTA |
|------|--------|-----|
| Gratuito | $0/mes | "Conocer la app" → https://app.endonautas.cl/registro/ |
| Practicante (destacado) | $39.990 CLP/mes (≈ $39,99 USD fuera de Chile) | "Elevar mi consulta" → https://app.endonautas.cl/registro/?plan=practicante |
| Navegante | $9.990 CLP/mes (≈ $9,99 USD fuera de Chile) | "Activar Navegante" → https://app.endonautas.cl/registro/?plan=navegante |

Precios cambiaron de USD-only a CLP como moneda base (`terminos.astro`: "se facturan mensualmente en
CLP o USD según el medio de pago", `8bebd73`). Practicante es ahora el plan central/destacado, no la
tercera tarjeta. **Garantía de 30 días sin preguntas** en ambos planes pagados — ver nota de
"Posicionamiento" arriba y `terminos.astro` (sección "Garantía de 30 días").

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
- `/fractones/` — filtro sigue en el config pero es no-op desde `4574d41` (2026-07-29): `src/pages/fractones.astro`
  **ya no existe en el repo** (la economía de Fractones murió en `ddba5b8`, 2026-06-22, ver CLAUDE.md
  de la app). `/fractones` y `/fractones/*` ahora redirigen 301 a `https://app.endonautas.cl/planes/`
  vía `public/_redirects` — mismo patrón que `/review-social` (línea de abajo): el filtro no hace daño
  dejarlo, pero ya no filtra nada real
- `/review-social` — filtro sigue en el config pero es no-op: la página fue eliminada del repo (ver arriba), no hace daño dejarlo

## Deploy

Push a `main` → Cloudflare Pages detecta vía webhook → build Astro → deploy estático.

```bash
git add .
git commit -m "fix: ..."
git push origin main
```
