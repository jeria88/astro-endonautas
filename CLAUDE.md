# CLAUDE.md — Landing Endonautas (Astro)

> Contexto técnico para Claude. Leer antes de tocar código.

## Stack
- Astro 4.x — SSG (estático puro, sin server-side). **Sin `three` desde el 2026-08-30** (se apagó el cosmos).
- Repo: `github.com/jeria88/astro-endonautas`
- Branch: `main` → auto-deploy en **Cloudflare Pages** al hacer push (~1-2 min)
- URL producción: `https://endonautas.cl`

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # genera dist/ para verificar
```

Máquina con poca RAM: builds y screenshots con `systemd-run --user --scope -p MemoryMax=1500M`.

---

## Rework visual 2026-08-30 — glass / "Vidrio ámbar" (LO MÁS IMPORTANTE)

Auditoría + decisión de Franco: un solo sistema visual, **sin cosmos Three.js**, con **toggle
claro/oscuro en toda superficie (default oscuro)**, y la **raíz = landing del libro** (no la
página-elección). Plan: `plans/endonautas/2026-08-30-rework-glass-fase-b.md`. Docs de la
auditoría: `~/Proyectos/endonautas/endonautas-rework/` (`MAPA-Y-COPY.md`, `DECISIONES.md`).

### Tokens — `src/styles/tokens.css` (fuente de verdad, compartida con Django `base.html`)
`:root` = **dark** (default). `:root[data-theme="light"]` = variante clara cálida.
```
DARK:  --bg #14100c · --surface #20190f · --border #453720
       --text #f4efe6 · --text-muted #c3b39a · --text-dim #8a7a60
       --accent #e0a24a (ámbar) · --accent-ink #1a1206
       --ok #7cc98a · --warn #e6b955 · --danger #df7a6a
LIGHT: --bg #f5efe3 · --surface #fdf9f0 · --text #241c12 · --accent #a4641a
```
- **Tipografía:** `Bricolage Grotesque` (display) + `Hanken Grotesk` (body). Ambas fuera de la
  lista "reflejo de IA". Se cargan por `@import` en `global.css:2`.
- **Alias de compat** en `tokens.css`: `--c/--txt/--dim/--mut/--bdr/--fd/--fi/--ts` apuntan a
  los nombres nuevos, para que los `<style>` scoped de páginas aún no migradas rendericen. Se
  van eliminando a medida que cada página usa los nombres nuevos.
- **Glass** (`backdrop-filter: blur`): SOLO en cromo elevado (nav, menú móvil, modales). Las
  tarjetas de contenido/datos son `var(--surface)` opaco.

### Toggle de tema
- `src/components/ThemeToggle.astro` (botón sol/luna). El listener y el script anti-flash viven
  en `Layout.astro` (`localStorage['endo-theme']`, default `'dark'`).

### Cosmos apagado
No hay `#cbg`, ni `three`, ni `Layout.astro:108-252`. `global.css` ya no tiene `.s-dark::after`
ni `.halo` (eran velos para legibilidad sobre el cosmos). `blog/[...slug].astro` ya no tiene
`:global(#cbg)`. Si aparece un screenshot headless que se cuelga: ya NO es por el `rAF` del
cosmos (eso era antes).

---

## Estructura de páginas (post-rework 2026-08-30)

| Ruta | Archivo | Qué es |
|------|---------|--------|
| `/` | `src/pages/index.astro` | **Landing del libro Endonautica** ($17). Era `/ebook`; se movió acá con `git mv` el 08-30. Usa `<Layout navHideCta>`. Mantiene TODO el funnel (ids, forms MP/PayPal, script `?herida=`, 3 eventos Umami). |
| `/para-terapeutas/` | `src/pages/para-terapeutas.astro` | **Landing del SaaS (única)**. Era `software.astro`; fusiona lo que antes estaba en `/software` + `/profesionales`. Hero, reconoc, dif, incluye, navegante, comunidad, preview, franco, precios, FAQ, newsletter. |
| `/circulo/` | `src/pages/circulo.astro` | **El Círculo Endonauta** — waitlist WhatsApp. El paso después del libro. Enlazada desde el FAQ de `/`. |
| `/test-heridas-de-infancia/` | `src/pages/test-heridas-de-infancia.astro` | Lead magnet SEO (ver abajo). Sus CTAs de resultado apuntan a `/?herida=<slug>`. |
| `/heridas/<slug>/` | `src/pages/heridas/[slug].astro` | 5 páginas long-tail (`getStaticPaths` desde `src/data/heridas.ts`). CTAs a `/?herida=<slug>`. |
| `/blog/` + `/blog/<slug>/` | `src/pages/blog/` | Blog. El CTA de cada post apunta a `/` (era `app…/tests/mapa-patrones/`). **Voseo pendiente de pasar a neutro** (33 posts). |
| `/equipo/` `/contacto/` `/privacidad/` `/terminos/` `/404` | idem | Legales / contacto / equipo. Solo en footer. |

**Borradas el 08-30** (`git mv` / `git rm`): `index.astro` (página-elección), `software.astro`
(→ `para-terapeutas`), `profesionales.astro`, `taller-terapeutas.astro`, `ebook.astro` (→ `index`).

### `public/_redirects` — reglas del rework
```
/ebook             /:splat            301   (preserva ?herida=)
/software           /para-terapeutas/  301
/profesionales      /para-terapeutas/  301
/taller-terapeutas  /para-terapeutas/  301
```
(más las históricas: www→apex, `/login` `/registro` `/app/*` → app, `/fractones` → `/planes/`,
`/heridas` → `/test-heridas-de-infancia/`).

---

## `/` — la landing del libro (LAUNCH-CRITICAL, no romper el funnel)

- **El hero estático es el de tráfico frío** ("El mapa que nadie te dio…"). El
  `<script define:vars>` lo reescribe si llega `?herida=<slug>` (reescribe `#hk`, `#h1`,
  `#hero-sub`, `#m-title`, `#m-text` — por `id`, así que esos ids no se tocan).
  **Al tocar el hero, cambiar el HTML, no el script.**
- **`#m-text` tiene fallback estático** (frontmatter `MUESTRA_DEFAULT` = fragmento de abandono):
  si el JS no corre, la sección no queda vacía. El JS lo reescribe para otras heridas.
- **Checkout:** 2 `<form method="POST">` a `https://app.endonautas.cl/pago/ebook/comprar/{mp,paypal}/`,
  hidden `canal_origen="ebook-landing"`, `name="email"`. `class="buy-form"` (el script de Umami
  la usa). **No cambiar el `action` ni los campos.**
- **`TESTIMONIOS` está vacío a propósito** (frontmatter de `index.astro` — no `ebook.astro`).
  Con 3+ frases reales la sección aparece sola. **No se inventan citas.**
- Secciones alternan `.sec` / `.sec-alt`: al insertar una, recalcular la cadena.
- Precio: USD + CLP. El CLP real vive en `payments/constants.py` de la app (`price_clp`).
- **205 páginas** (conteo real del PDF maquetado).
- **Nav sin CTAs:** `<Layout navHideCta={true}>` → `Nav.astro` oculta "Ingresar" y "Empezar con
  Practicante" (su único CTA es comprar). El resto de las páginas los conserva.

### Medición del embudo (Umami) — `src/layouts/Layout.astro`, id `e03fa69e-…`
| Evento | Dónde | Props |
|---|---|---|
| `test-completado` / `test-lead-submit` / `test-cta-libro` | test de heridas | `herida` |
| `ebook-cta-comprar` | hero de `/` | `origen` (slug o `frio`) |
| `ebook-checkout-submit` | forms de pago | `gateway`, `origen` |
*(el evento `raiz-puerta` murió con la página-elección)*

Para que el reporte KPI los lea falta `UMAMI_API_KEY` en Coolify (bloqueante de panel de Franco).

---

## Nav y Layout

- **`src/layouts/Layout.astro`** — todas las páginas lo usan. Props: `title`, `description`,
  `ogImage`, `ogType`, `navHideCta`. Inyecta `Nav.astro` + `Footer.astro`, el script anti-flash
  del tema, Umami, el schema Organization+WebSite, y el `<script>` de reveals + acordeón FAQ +
  toggle. `<slot name="head" />` para schema por página (`/` mete un `Book`, `/para-terapeutas/`
  debería meter `SoftwareApplication` — pendiente).
- **`src/components/Nav.astro`** — un solo modo. Prop `hideCta`. Logo = icono
  (`/assets/endonautas-logo.png`) + "Endonautas". Links: El libro (`/`) · Para terapeutas ·
  Blog · Contacto. `nav-r`: slot + ThemeToggle + (si `!hideCta`) Ingresar + Empezar con
  Practicante + hamburguesa. Menú móvil replica los links + (si `!hideCta`) los CTAs.
- **`src/components/Footer.astro`** — links: El libro · Para terapeutas · Hacer el test · Blog ·
  Equipo · Contacto · Privacidad · Términos · Ingresar. Redes al tope.
- **`.btn`** (global.css): base `11px 24px`. `.btn-sm` (CTAs de nav) `8px 15px`. `.btn-lg` `15px 34px`.
  Se redujeron el 08-30 — los de nav estaban demasiado grandes.

---

## Test de heridas de infancia — lead magnet SEO (2026-08-04, `757c046`)

Captación por búsqueda. Google Autocomplete (geo CL): `test heridas de la infancia online gratis`,
`test 5 heridas de la infancia`, etc.

- El test se juega en la web, sin registro. El bot de Telegram es retención, no puerta.
- Contenido de las 5 heridas estático en el HTML (lo que Google indexa). El H1 lleva la keyword.
- **Los 5 botones de opción se renderizan en el template**, no con `createElement` — Astro scopea
  el CSS por elemento (`data-astro-cid-*`), un botón creado en runtime sale sin estilo.
- **`src/data/heridas.ts` es la fuente única** del contenido, compartida con el hub y el bot. Al
  script del cliente solo van 4 campos (`HERIDAS_MIN`).
- Schema `FAQPage` (+ `BreadcrumbList` en `/heridas/`).
- `/heridas` sin slug → 301 al hub.
- **Los CTAs de resultado apuntan a `/?herida=<slug>`** (era `/ebook/?herida=`).

**Trampa de verificación headless:** capturar con `--window-size` muy alto MIENTE — las unidades
`vh` se inflan y aparecen huecos que no existen. Capturar con viewport realista y navegar por
anclas.

---

## Cloudflare Pages Functions

### `functions/api/subscribe.js` — proxy POST a Listmonk (evita CORS)
Acepta `{ "email": "...", "list": "lanzamiento" }`. Routing:

| `list` | Lista Listmonk | UUID |
|---|---|---|
| `lanzamiento` (default) | Lanzamiento (8) | `431ebe70-b897-416b-9016-daea6acc030c` |
| `practicante` | Practicantes (5) | `574f7450-0663-4848-95e5-8ebe4765a33a` |
| `taller1-terapeutas` | Taller 1 (espera) | `af786bb5-cada-49a8-92fb-cb4ca441f689` |

Llamado desde el `#newsletter` de `/para-terapeutas/` (manda `list:'practicante'`).
`LISTMONK_URL` = `https://mail.146.181.39.4.sslip.io/api/public/subscription` (el dominio
`mail.endonautas.cl` está caído desde jun-2026).

### `functions/api/contact.js` — inserta en D1 (`mensajes`). Llamado desde `/contacto/`.
### `functions/admin/mensajes.js` — panel gated por `?key=` vs `env.ADMIN_KEY`. HTML propio aislado.

### Flywheel social — ARCHIVADO (2026-07-03, `4affd5f`)
Las 6 Functions del pipeline social, `review-social.astro` y los scripts `scripts/social/*` ya
no existen — migrados a Oracle FastAPI y después archivados ("superseded por ACME Agents").
Código viejo en `_archivo_ecosistema/endonautas-web/`. Sistema vigente: MCP `acmeagents-endonautas`.
`pending/*.json` (5 archivos, esquema viejo) son basura huérfana, nadie los lee.

---

## Listmonk — listas
| Lista | ID | UUID |
|---|---|---|
| Usuarios App | 4 | — |
| Practicantes | 5 | `574f7450-0663-4848-95e5-8ebe4765a33a` |
| Leads App | 7 | — |
| Lanzamiento | 8 | `431ebe70-b897-416b-9016-daea6acc030c` |
| Taller 1 (espera) | — | `af786bb5-cada-49a8-92fb-cb4ca441f689` |

Admin: `https://mail.146.181.39.4.sslip.io` · `admin` · pass en README del repo `app`.
**Los 4 emails del funnel del ebook** (carrito abandonado + día 3/7) están escritos en
`~/Proyectos/endonautas/endonautas-rework/emails-funnel.md`, sin cargar (esperan Brevo autenticado).

---

## Blog
- `src/content/config.ts` — `image: z.string().optional()` (URL Pexels landscape).
- `src/pages/blog/[...slug].astro` — hero image si el campo existe. `.post-wrap` max 960px,
  `.prose` max 780px.
- Pipeline: `scripts/seo/writer.py` (Pexels automático) + `scripts/seo/run_ci.py`.
- **Voseo → neutro pendiente** en los 33 `.md` (`feedback_espanol_neutro`).

## Redes (Footer.astro)
Instagram `/endonautas/` · TikTok `@endonautas` · YouTube `channel/UC9hqN2eNx1X-U-2ev9GUsCg` ·
LinkedIn `company/endonautas`.

## Analytics (Umami)
Script en `Layout.astro`, id `e03fa69e-9931-411c-9838-7f6ffea90426`, src
`https://analytics.146.181.39.4.sslip.io/script.js` (el `.cl` está caído).

---

## Regla de cambios de copy (precios/planes) — sincronizar 4 touchpoints
1. `src/pages/` — `/` (garantía 7 días del libro) y `/para-terapeutas/` (`#precios`, garantía 30 días)
2. `templates/payments/_planes_body.html` (app Django)
3. `templates/legal/terminos.html` (app Django)
4. `payments/constants.py` (app Django) — **fuente real de los números**

Precio Navegante unificado: `$9.990 CLP · $9,99 USD / mes`. Practicante: `$39.990 CLP · $39,99 USD`.

## CTAs canónicos (1 etiqueta por acción — ver `endonautas-rework/MAPA-Y-COPY.md`)
- Comprar el libro: **"Comprarlo ahora — $17"** → `#comprar`
- Hacer el test: **"Hacer el test — 5 preguntas"** → `/test-heridas-de-infancia/`
- Registro terapeuta: **"Empezar con Practicante"** → `app…/registro/?plan=practicante`
- Registro usuario final: **"Empezar con Navegante"** → `app…/registro/?plan=navegante`
- Cuenta existente: **"Ingresar"** → `app…/login/`
> `para-terapeutas.astro` todavía tiene algún "Evolucionar mi consulta" viejo en secciones
> internas (nav y hero ya migrados). Ir limpiando.

## Sitemap
`astro.config.mjs` — filtra `/draft/`, `/fractones/`, `/review-social` (los 2 últimos ya no
existen, el filtro no molesta).

## Deploy
`git push origin main` → Cloudflare webhook → build → deploy estático.
