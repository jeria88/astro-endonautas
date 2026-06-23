# Landing Endonautas

Sitio estático de marketing para [endonautas.cl](https://endonautas.cl) construido con Astro 4.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Astro 4.x (SSG) |
| Tipografía | Syne (headings) + Inter (body) vía Google Fonts |
| Deploy | Coolify v4.1.2 en Oracle Cloud ARM64 |
| Analytics | Umami — `analytics.endonautas.cl` |

## Infraestructura de producción

**Servidor:** Oracle Cloud Free Tier ARM64 · IP `146.181.39.4`  
**Coolify:** proyecto `Endonautas` · auto-deploy al hacer push a `main`  
**Dominio:** `https://endonautas.cl` (Traefik + Let's Encrypt automático)  
**Repo:** `github.com/jeria88/astro-endonautas`

## Desarrollo local

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # verificar build antes de push
```

## Páginas

| URL | Descripción |
|-----|-------------|
| `/` | Landing principal con hero, comparativa, instrumentos, precios, FAQ |
| `/profesionales` | Landing B2B — Plan Practicante para terapeutas y coaches |
| `/ebook` | Página del libro *Endonautica* |
| `/privacidad` | Política de privacidad |
| `/terminos` | Términos de uso |
| `/contacto` | Formulario de contacto |

## CTAs principales

| CTA | Destino |
|-----|---------|
| "Ver mi Mapa de Patrones" (hero) | `https://app.endonautas.cl/tests/mapa-patrones/` |
| "Empezar gratis" | `https://app.endonautas.cl/registro/` |
| "Activar Navegante" | `https://app.endonautas.cl/registro/?plan=navegante` |
| "Activar Practicante" | `https://app.endonautas.cl/registro/?plan=practicante` |

## Servicios del servidor relacionados

### Stack de herramientas (Oracle Cloud — mismo servidor)

| Servicio | URL | Función |
|---------|-----|---------|
| Umami | `https://analytics.endonautas.cl` | Analytics (open source) |
| Uptime Kuma | `https://status.endonautas.cl` | Monitoreo de uptime |
| Listmonk | `https://mail.endonautas.cl` | Email marketing |
| SerpBear | `https://seo.endonautas.cl` | Tracking keywords SEO |
| n8n | (interno) | Automatización de marketing |

### Listmonk — estado actual

Configurado con Brevo SMTP relay:
- Host: `smtp-relay.brevo.com` · Puerto `587` · STARTTLS
- Login: `aaccf1001@smtp-brevo.com`
- From: `hola@endonautas.cl`

Listas activas:
- `Endonautas — Usuarios App` (ID 1)
- `Endonautas — Interesados` (ID 2)
- `Endonautas — Newsletter` (ID 3)

### SerpBear — estado actual

Dominio `endonautas.cl` configurado. Keywords basadas en estrategia SEO de 3 capas:
- Capa 1 — autoconocimiento (términos base)
- Capa 2 — viaje interior (términos de proceso)
- Capa 3 — nivel de conciencia (términos de profundidad)

### Uptime Kuma — monitores

6 monitores activos:
1. App — `https://app.endonautas.cl`
2. Landing — `https://endonautas.cl`
3. Umami — `https://analytics.endonautas.cl`
4. Listmonk — `https://mail.endonautas.cl`
5. SerpBear — `https://seo.endonautas.cl`
6. Coolify — `http://146.181.39.4:8000`

## Analytics (Umami)

Script integrado en `src/layouts/Layout.astro`:
```html
<script defer data-website-id="e03fa69e-9931-411c-9838-7f6ffea90426"
        src="https://analytics.endonautas.cl/script.js"></script>
```

Website ID landing: `e03fa69e-9931-411c-9838-7f6ffea90426`

## GitHub

```bash
git push origin main    # activa auto-deploy en Coolify
```
