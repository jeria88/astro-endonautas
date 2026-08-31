# Landing Endonautas

Sitio estático de marketing para [endonautas.cl](https://endonautas.cl), construido con Astro 4.
Contexto técnico detallado para trabajar el código: **`CLAUDE.md`**.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 4.x (SSG puro) |
| Visual | Sistema "Vidrio ámbar" (glass) — tokens en `src/styles/tokens.css`, dark default + toggle claro/oscuro. Bricolage Grotesque + Hanken Grotesk. Rework 2026-08-30 (cosmos Three.js apagado). |
| Deploy | Cloudflare Pages — auto-deploy al hacer push a `main` (~1-2 min) |
| Analytics | Umami — `https://analytics.146.181.39.4.sslip.io` |
| Functions | Cloudflare Pages Functions (`functions/`) — subscribe, contact, admin/mensajes |

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # verificar antes de push
```

## Páginas

| URL | Qué es |
|-----|--------|
| `/` | **Landing del libro *Endonautica*** ($17). Era `/ebook`; se movió el 2026-08-30. Mantiene el funnel completo (checkout MP/PayPal, personalización `?herida=`, eventos Umami). |
| `/para-terapeutas/` | Landing del SaaS — fusión de las viejas `/software` + `/profesionales` |
| `/circulo/` | El Círculo Endonauta — lista de espera por WhatsApp |
| `/test-heridas-de-infancia/` + `/heridas/<slug>/` | Lead magnet SEO + 5 páginas long-tail (una por herida) |
| `/blog/` + `/blog/<slug>/` | Blog (generado por `scripts/seo/`) |
| `/equipo` `/contacto` `/privacidad` `/terminos` `/404` | Legales / contacto / equipo |

**Redirects 301** (`public/_redirects`): `/ebook*` → `/` (preserva `?herida=`), `/software` ·
`/profesionales` · `/taller-terapeutas` → `/para-terapeutas/`, más www→apex, `/login` `/registro`
`/app/*` → `app.endonautas.cl`, `/fractones` → `/planes/`.

## CTAs

| Acción | Etiqueta | Destino |
|---|---|---|
| Comprar el libro | "Comprarlo ahora — $17" | `#comprar` (en `/`) |
| Hacer el test | "Hacer el test — 5 preguntas" | `/test-heridas-de-infancia/` |
| Registro terapeuta | "Empezar con Practicante" | `app…/registro/?plan=practicante` |
| Registro usuario final | "Empezar con Navegante" | `app…/registro/?plan=navegante` |
| Cuenta existente | "Ingresar" | `app…/login/` |

La landing del libro (`/`) NO muestra "Ingresar" ni "Empezar con Practicante" en el nav
(`<Layout navHideCta>`) — su único CTA es comprar. El resto de las páginas sí.

## Cloudflare Pages Functions

| Ruta | Archivo | Qué hace |
|---|---|---|
| `POST /api/subscribe` | `functions/api/subscribe.js` | Proxy a Listmonk (evita CORS). `{ email, list }`. Listas: `lanzamiento` (default), `practicante`, `taller1-terapeutas`. `LISTMONK_URL` = `https://mail.146.181.39.4.sslip.io/api/public/subscription`. |
| `POST /api/contact` | `functions/api/contact.js` | Inserta en D1 (`mensajes`). Llamado desde `/contacto/`. |
| `GET /admin/mensajes` | `functions/admin/mensajes.js` | Panel gated por `?key=` vs `env.ADMIN_KEY`. |

> El **flywheel social** (Functions `list-pending` / `approve-copy` / `health`, `review-social.astro`,
> `scripts/social/`) fue **archivado** el 2026-07-03 (`4affd5f`) — reemplazado por ACME Agents
> (MCP `acmeagents-endonautas`). Código viejo en `_archivo_ecosistema/endonautas-web/`.

## Blog

- Artículos en `src/content/blog/*.md`. Schema: `src/content/config.ts` (`image` Pexels, `category`, `cta`).
- Pipeline: `scripts/seo/run_ci.py` (DeepSeek + Pexels), cron GitHub Actions (`.github/workflows/seo.yml`).
- El CTA de cada post apunta a `/`. **Voseo → español neutro pendiente** en los 33 posts.

## Listmonk — listas

| Lista | ID | UUID |
|-------|----|------|
| Usuarios App | 4 | — |
| Practicantes | 5 | `574f7450-0663-4848-95e5-8ebe4765a33a` |
| Leads App | 7 | — |
| Lanzamiento | 8 | `431ebe70-b897-416b-9016-daea6acc030c` |
| Taller 1 (espera) | — | `af786bb5-cada-49a8-92fb-cb4ca441f689` |

Admin: `https://mail.146.181.39.4.sslip.io` · `admin` · pass en el README del repo `app`.
SMTP: Brevo `smtp-relay.brevo.com:587`. **El dominio `endonautas.cl` no está autenticado en Brevo
(SPF sin Brevo, DKIM ausente)** — bloqueante para el lanzamiento del ebook.
Los 4 emails del funnel (carrito abandonado + día 3/7) están escritos en
`../endonautas-rework/emails-funnel.md`, sin cargar.

## Servicios (Oracle Cloud — mismo servidor que la app)

Todo migró de `*.endonautas.cl` (503) a IP-sslip en jun-2026:
Umami `analytics.146.181.39.4.sslip.io` · Listmonk `mail.146.181.39.4.sslip.io` ·
Uptime Kuma `status.146.181.39.4.sslip.io` · SerpBear `seo.146.181.39.4.sslip.io`.

## Redes (Footer.astro)

Instagram `/endonautas/` · TikTok `@endonautas` · YouTube `channel/UC9hqN2eNx1X-U-2ev9GUsCg` ·
LinkedIn `company/endonautas`.

## Deploy

```bash
git push origin main    # → Cloudflare Pages webhook → build → deploy estático
```
