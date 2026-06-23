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
