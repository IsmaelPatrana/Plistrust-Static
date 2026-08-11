# Plistrust — Plan de desarrollo

Plataforma de películas en GitHub Pages: catálogo desde TMDB, reproducción con Vimeus y UnlimPlay, protegida con una contraseña única. Interfaz sencilla, modesta y funcional.

---

## 1. Arquitectura

GitHub Pages **solo sirve estático**: no hay servidor, todo corre en el navegador.

```
┌─ Navegador (GitHub Pages) ─────────────┐
│  SPA estática: HTML + CSS + JS          │
│  ├─ Gate de contraseña (hash SHA-256)   │
│  ├─ Catálogo (TMDB API, client-side)    │
│  └─ Reproductor (embeds Vimeus/Unlim)   │
└─────────────────────────────────────────┘
```

Consecuencias de no tener backend:
- La contraseña se valida en el cliente → protección débil por diseño (ver §5).
- Las claves de API viven en el código → usar solo APIs que lo permitan (TMDB sí; Vimeus/UnlimPlay verificar).

## 2. Tecnologías

| Área | Elección | Por qué |
|------|----------|---------|
| Build | **Vite + vanilla JS** | Sin framework. HTML/CSS/JS simples, build rápido, deploy directo a Pages |
| Estilos | **CSS propio + CSS variables** | Interfaz modesta sin dependencias |
| Catálogo | **TMDB API v3** (fetch nativo) | Categorías, trending, portadas |
| Reproductor | **Iframes Vimeus / UnlimPlay** | Embeds directos, sin player propio |
| Contraseña | **SHA-256 (Web Crypto API)** | Native del navegador, sin librerías |
| Estado | `localStorage` | Sesión, favoritos, progreso — cero librerías |
| Deploy | **GitHub Actions** | Build + push automático a `gh-pages` |
| Iconos | **SVG inline / emoji** | Sin bibliotecas de iconos |

Sin React, sin Vue, sin bundlers pesados, sin librerías de UI. Pocas dependencias = menos superficie de fallo.

## 3. Fases de desarrollo

### Fase 0 — Cimiento (setup + deploy)
- [ ] Inicializar repo git + estructura Vite (`index.html`, `src/`, `dist/`)
- [ ] Crear workflow GitHub Actions que haga `npm run build` y publique `dist/` en `gh-pages`
- [ ] Activar GitHub Pages (branch `gh-pages`)
- [ ] **Checkpoint:** desplegar "Hola mundo" y verlo en `https://<user>.github.io/<repo>/`

**Criterio de éxito:** push a `main` → sitio público en 2 minutos.

### Fase 1 — Contraseña única (gate de acceso)
- [ ] Pantalla de login con input de contraseña
- [ ] Hash SHA-256 con Web Crypto API contra un hash fijo (nunca la contraseña en claro)
- [ ] Sesión persistida en `localStorage` (día de expiración configurable en un `config.js`)
- [ ] Cerrar sesión (botón en cabecera)
- [ ] **Checkpoint:** sin contraseña no se ve nada del catálogo

**Criterio de éxito:** recargar la página no desloguea; contraseña errónea deniega acceso.

### Fase 2 — Catálogo TMDB
- [ ] `config.js` central con: clave TMDB, IDs/URLs de Vimeus y UnlimPlay, hash de contraseña
- [ ] Capa API (`api.js`): fetch a `/3/movie/popular`, `/3/movie/now_playing`, `/3/movie/top_rated`
- [ ] Capa de datos: mapear respuesta TMDB → objeto `{ id, titulo, portada, año, sinopsis, categorias[] }`
- [ ] Manejo de errores de red y límite de requests (TMDB da ~40 req/10s; cachear en `localStorage`)
- [ ] **Checkpoint:** consola muestra 20 películas de TMDB

**Criterio de éxito:** datos reales de TMDB fluyendo con caché.

### Fase 3 — Interfaz categorizada
- [ ] Cabecera: logo, búsqueda, cerrar sesión
- [ ] Secciones horizontales por categoría: *Populares, En cines, Mejor valoradas, Novedades*
- [ ] Grid de tarjetas: portada, título, año, puntuación
- [ ] Categorías adicionales por género (acción, comedia, terror…) con `/3/genre/movie/list`
- [ ] Skeleton loading mientras cargan las imágenes (evita layout shift)
- [ ] **Checkpoint:** página completa y navegable en desktop y móvil

**Criterio de éxito:** 3+ secciones pobladas con portadas de TMDB.

### Fase 4 — Reproductor (Vimeus + UnlimPlay)
- [ ] Página de detalle: portada grande, sinopsis, año, géneros, puntuación
- [ ] Selector de proveedor: botones *Ver en Vimeus* / *Ver en UnlimPlay*
- [ ] Modal reproductor con iframe embebido (construir URL del provider con el ID de TMDB)
- [ ] Recordar último proveedor usado en `localStorage`
- [ ] **Checkpoint:** un título real reproduce en al menos un proveedor

**Criterio de éxito:** click en película → detalle → reproducción sin salir de la página.

### Fase 5 — Pulido y extras mínimos
- [ ] Favoritos (corazón en tarjeta + sección *Mis favoritos*)
- [ ] "Continuar viendo" (último título abierto)
- [ ] Vista de detalle con video en background si es posible
- [ ] PWA-lite: favicon, meta tags, título por página
- [ ] **Checkpoint:** uso normal de 3 días sin errores

**Criterio de éxito:** la plataforma se usa sin fricción.

### Fase 6 — Lanzamiento
- [ ] Revisión de respeto a ToS de TMDB y proveedores (atribución obligatoria a TMDB)
- [ ] `README.md` con cómo cambiar contraseña y claves
- [ ] Test manual: navegador incógnito, móvil, 3 navegadores
- [ ] Push final + verificación del sitio público

**Criterio de éxito:** link público compartible.

## 4. Estructura de archivos objetivo

```
/
├─ .github/workflows/deploy.yml     # build + publish a gh-pages
├─ index.html
├─ src/
│  ├─ config.js                    # contraseña, claves API, URLs (ÚNICO lugar a tocar)
│  ├─ api.js                       # fetch TMDB + caché
│  ├─ auth.js                      # hash SHA-256 + sesión
│  ├─ player.js                    # iframes Vimeus/UnlimPlay
│  ├─ main.js                      # renderizado de la interfaz
│  └─ style.css
└─ package.json                    # vite como única dependencia
```

## 5. Seguridad — lectura honesta

- **Contraseña en cliente = cerrojo de cartón.** Sirve para disuadir curiosos, no para proteger de verdad. Quien quiera entrar puede leer el hash del código. Si se quiere seguridad real → migrar a un backend + login (fuera del alcance de GitHub Pages).
- **Claves de API expuestas** en el JS (obligatorio en Pages). TMDB lo permite para client-side; **verificar los términos de Vimeus y UnlimPlay** antes de publicar.
- Nunca loguear ni mostrar claves en pantalla.

## 6. Fuera de alcance (por ahora)

- Perfiles de usuario múltiples, multiusuario
- Backend propio, pagos, DRM
- Apps nativas; la plataforma es web-only
- Streaming propio (solo embeds)

---

*Documento vivo: actualizar al cambiar decisiones de arquitectura.*
