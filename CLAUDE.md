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

## Deploy

Push a `main` → Cloudflare Pages detecta vía webhook → build Astro → deploy estático.

```bash
git add .
git commit -m "fix: ..."
git push origin main
```
