# Plistrust

Plataforma de películas estática para GitHub Pages: catálogo de TMDB, reproducción vía embeds de Vimeus y UnlimPlay, protegida con una contraseña única.

## Configuración (un solo archivo: `src/config.js`)

1. **TMDB_KEY** — clave v3 (permisos "read") desde https://www.themoviedb.org/settings/api
2. **PASSWORD_HASH** — hash SHA-256 de tu contraseña. Genera el tuyo:
   ```
   node -e "const{createHash}=require('crypto');console.log(createHash('sha256').update('tu-contrasena').digest('hex'))"
   ```
   ⚠️ La contraseña por defecto es `plistrust` (ver plan: protección client-side, cerrojo de cartón).
3. **PROVIDERS** — ajusta las URLs al formato real de Vimeus y UnlimPlay (la plantilla usa el id de TMDB).

## Desarrollo local

```
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

## Deploy

Push a `main` → GitHub Actions compila y publica en `gh-pages`.
Activa Pages en **Settings → Pages → Source: GitHub Actions** la primera vez.
