export const CONFIG = {
  // Clave v3 de TMDB (permisos "read"): https://www.themoviedb.org/settings/api
  TMDB_KEY: '782daf3d8661435897d6185fa46a0a2a',

  // Hash SHA-256 de la contraseña de acceso. Para generar el tuyo:
  //   node -e "const{createHash}=require('crypto');console.log(createHash('sha256').update('tu-contrasena').digest('hex'))"
  // Contraseña por defecto (¡CÁMBIALA!): plistrust
  PASSWORD_HASH: '30d4045698fe478df20d74e88df22c621781afb9d675a8025bb97400ef5635cd',

  // Días que dura la sesión sin volver a pedir contraseña
  SESSION_DAYS: 7,

  // Proveedores de reproducción (patrones reales de embeds).
  // url(type, id, season, episode); season/episode solo aplican a series.
  PROVIDERS: [
    {
      id: 'unlimplay',
      nombre: 'UnlimPlay',
      url: (type, id, se = 1, ep = 1) =>
        type === 'tv'
          ? `https://unlimplay.com/f/embed/tv/${id}/${se}/${ep}`
          : `https://unlimplay.com/f/embed/movie/${id}`,
    },
    {
      id: 'vimeus',
      nombre: 'Vimeus',
      // Vimeus responde CORS con status real: pre-check para evitar pantalla negra
      // cuando el título no está en su catálogo (ej. 404).
      precheck: true,
      url: (type, id, se = 1, ep = 1) => {
        const params = new URLSearchParams({ tmdb: String(id), view_key: VIMEUS_VIEW_KEY })
        if (type === 'tv') {
          params.set('se', String(se))
          params.set('ep', String(ep))
        }
        return type === 'tv' ? `https://vimeus.com/e/serie?${params}` : `https://vimeus.com/e/movie?${params}`
      },
    },
  ],
}

// View key de Vimeus para los embeds
const VIMEUS_VIEW_KEY = 'tCqVYbkM75fGmmulXyEYvMFCpE8J3BXl3SaXY3bWErE'
