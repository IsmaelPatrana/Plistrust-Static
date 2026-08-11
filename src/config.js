export const CONFIG = {
  // Clave v3 de TMDB (permisos "read"): https://www.themoviedb.org/settings/api
  TMDB_KEY: '782daf3d8661435897d6185fa46a0a2a',

  // Hash SHA-256 de la contraseña de acceso. Para generar el tuyo:
  //   node -e "const{createHash}=require('crypto');console.log(createHash('sha256').update('tu-contrasena').digest('hex'))"
  // Contraseña por defecto (¡CÁMBIALA!): plistrust
  PASSWORD_HASH: '30d4045698fe478df20d74e88df22c621781afb9d675a8025bb97400ef5635cd',

  // Días que dura la sesión sin volver a pedir contraseña
  SESSION_DAYS: 7,

  // Proveedores de reproducción. {id} se sustituye por el id de TMDB.
  // AJUSTA la URL al formato real de cada proveedor (consulta su web).
  PROVIDERS: [
    { id: 'vimeus', nombre: 'Vimeus', url: (id) => `https://vimeus.net/ver/${id}` },
    { id: 'unlimplay', nombre: 'UnlimPlay', url: (id) => `https://unlimplay.com/ver/${id}` },
  ],
}
