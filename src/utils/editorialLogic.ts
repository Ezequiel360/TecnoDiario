export type RolEditorial = 'ADMIN' | 'EDITOR' | 'REDACTOR';
export type EstadoPublicacion = 'BORRADOR' | 'PROGRAMADO' | 'PUBLICADO';
export type NivelDestacado = 'HERO' | 'SECUNDARIA' | 'NORMAL';

export interface AutorEditorial {
  id: string;
  nombre: string;
  slug: string;
  email: string;
  rol: RolEditorial;
  especialidad: string;
  biografiaCorta: string;
  xHandle: string;
}

export interface NoticiaItem {
  id: string;
  titulo: string;
  slug: string;
  bajada: string;
  contenido: string;
  categoriaSlug: string;
  categoriaNombre: string;
  etiquetas: string[];
  autor: AutorEditorial;
  imagenUrl: string;
  imagenAlt: string;
  epigrafe: string;
  estado: EstadoPublicacion;
  nivelDestacado: NivelDestacado;
  fechaPublicacion: string; // ISO string
  tiempoLecturaMinutos: number;
  vistas: number;
  metaTitle: string;
  metaDescription: string;
  webpPesoOriginalKb: number;
  webpPesoOptimizadoKb: number;
  dimensionesWebp: string;
}

export interface RegistroAuditoria {
  id: string;
  fecha: string;
  modelo: 'Noticia' | 'Categoria' | 'Anuncio' | 'Suscriptor';
  objetoId: string;
  objetoTitulo: string;
  tipoCambio: '+' | '~' | '-';
  usuario: string;
  rolUsuario: RolEditorial;
  motivoCambio: string;
}

export function normalizarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);
}

export function generarSlugUnico(
  titulo: string,
  slugsExistentes: string[],
  slugActual?: string
): string {
  const base = normalizarSlug(titulo) || 'noticia-tecnologica';
  const setExistentes = new Set(
    slugsExistentes.filter((s) => s !== slugActual)
  );
  if (!setExistentes.has(base)) {
    return base;
  }
  let contador = 2;
  while (setExistentes.has(`${base}-${contador}`)) {
    contador += 1;
  }
  return `${base}-${contador}`;
}

export function calcularTiempoLectura(contenidoHtml: string): number {
  const textoPlano = (contenidoHtml || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!textoPlano) return 1;
  const palabras = textoPlano.split(' ').length;
  return Math.max(1, Math.round(palabras / 220));
}

export function esNoticiaVisible(
  noticia: Pick<NoticiaItem, 'estado' | 'fechaPublicacion'>,
  ahoraIso: string = new Date().toISOString()
): boolean {
  const ahoraMs = new Date(ahoraIso).getTime();
  const pubMs = new Date(noticia.fechaPublicacion).getTime();
  if (noticia.estado === 'PUBLICADO') {
    return pubMs <= ahoraMs;
  }
  if (noticia.estado === 'PROGRAMADO') {
    return pubMs <= ahoraMs;
  }
  return false;
}

export interface FiltroNoticiasParams {
  categoriaSlug?: string;
  etiqueta?: string;
  autorSlug?: string;
  busqueda?: string;
  ahoraIso?: string;
  incluirNoPublicadas?: boolean;
}

export function filtrarNoticias(
  noticias: NoticiaItem[],
  params: FiltroNoticiasParams
): NoticiaItem[] {
  const {
    categoriaSlug,
    etiqueta,
    autorSlug,
    busqueda,
    ahoraIso = new Date().toISOString(),
    incluirNoPublicadas = false,
  } = params;

  const query = (busqueda || '').trim().toLowerCase();

  return noticias
    .filter((item) => {
      if (!incluirNoPublicadas && !esNoticiaVisible(item, ahoraIso)) {
        return false;
      }
      if (categoriaSlug && categoriaSlug !== 'todas' && item.categoriaSlug !== categoriaSlug) {
        return false;
      }
      if (etiqueta && !item.etiquetas.some((t) => t.toLowerCase() === etiqueta.toLowerCase())) {
        return false;
      }
      if (autorSlug && item.autor.slug !== autorSlug) {
        return false;
      }
      if (query) {
        const enTitulo = item.titulo.toLowerCase().includes(query);
        const enBajada = item.bajada.toLowerCase().includes(query);
        const enContenido = item.contenido.toLowerCase().includes(query);
        const enTags = item.etiquetas.some((t) => t.toLowerCase().includes(query));
        const enAutor = item.autor.nombre.toLowerCase().includes(query);
        return enTitulo || enBajada || enContenido || enTags || enAutor;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.fechaPublicacion).getTime() -
        new Date(a.fechaPublicacion).getTime()
    );
}

export function simularOptimizacionPillowWebp(
  anchoOriginal: number,
  altoOriginal: number,
  pesoOriginalKb: number,
  maxWidth: number = 1600,
  maxHeight: number = 900,
  quality: number = 82
): {
  anchoFinal: number;
  altoFinal: number;
  pesoWebpKb: number;
  ahorroPorcentaje: number;
} {
  let ratio = 1;
  if (anchoOriginal > maxWidth || altoOriginal > maxHeight) {
    ratio = Math.min(maxWidth / anchoOriginal, maxHeight / altoOriginal);
  }
  const anchoFinal = Math.max(1, Math.round(anchoOriginal * ratio));
  const altoFinal = Math.max(1, Math.round(altoOriginal * ratio));

  const factorDimension = (anchoFinal * altoFinal) / Math.max(1, anchoOriginal * altoOriginal);
  const factorCalidadWebp = (quality / 100) * 0.42;
  const pesoWebpKb = Math.max(
    18,
    Math.round(pesoOriginalKb * factorDimension * factorCalidadWebp)
  );
  const ahorroPorcentaje = Math.max(
    5,
    Math.min(94, Math.round((1 - pesoWebpKb / Math.max(1, pesoOriginalKb)) * 100))
  );

  return {
    anchoFinal,
    altoFinal,
    pesoWebpKb,
    ahorroPorcentaje,
  };
}

export function verificarPermisoEditorial(
  rolUsuario: RolEditorial,
  idUsuario: string,
  idAutorNoticia: string,
  accion: 'editar' | 'publicar' | 'eliminar'
): boolean {
  if (rolUsuario === 'ADMIN') return true;
  if (rolUsuario === 'EDITOR') {
    return accion === 'editar' || accion === 'publicar';
  }
  if (rolUsuario === 'REDACTOR') {
    return accion === 'editar' && idUsuario === idAutorNoticia;
  }
  return false;
}

export function generarSitemapXml(
  siteUrl: string,
  noticiasPublicadas: Pick<NoticiaItem, 'slug' | 'fechaPublicacion'>[],
  categoriasSlugs: string[]
): string {
  const baseUrl = siteUrl.replace(/\/$/, '');
  const urlsCategorias = categoriasSlugs
    .map(
      (catSlug) => `  <url>
    <loc>${baseUrl}/categoria/${catSlug}/</loc>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join('\n');

  const urlsNoticias = noticiasPublicadas
    .map(
      (n) => `  <url>
    <loc>${baseUrl}/noticia/${n.slug}/</loc>
    <lastmod>${n.fechaPublicacion.slice(0, 10)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>
${urlsCategorias}
${urlsNoticias}
</urlset>`;
}

export interface ResumenGrupoRbac {
  grupo: 'Administrador' | 'Editor' | 'Redactor';
  rolCodigo: RolEditorial;
  totalPermisos: number;
  permisosClave: string[];
  aislamientoQueryset: string;
}

export function obtenerMatrizGruposRbac(): ResumenGrupoRbac[] {
  return [
    {
      grupo: 'Administrador',
      rolCodigo: 'ADMIN',
      totalPermisos: 32,
      permisosClave: [
        'add_noticia',
        'change_noticia',
        'delete_noticia',
        'can_publish_noticia',
        'can_feature_hero',
        'change_configuracionsitio',
        'add_anuncio',
        'delete_usuario',
      ],
      aislamientoQueryset: 'Acceso total a todas las notas y modelos del sistema',
    },
    {
      grupo: 'Editor',
      rolCodigo: 'EDITOR',
      totalPermisos: 15,
      permisosClave: [
        'add_noticia',
        'change_noticia',
        'view_noticia',
        'can_publish_noticia',
        'can_feature_hero',
        'add_categoria',
        'change_etiqueta',
      ],
      aislamientoQueryset: 'Acceso a todas las notas para revisión y publicación',
    },
    {
      grupo: 'Redactor',
      rolCodigo: 'REDACTOR',
      totalPermisos: 6,
      permisosClave: [
        'add_noticia',
        'change_noticia',
        'view_noticia',
        'view_categoria',
        'add_etiqueta',
      ],
      aislamientoQueryset: 'qs.filter(autor=request.user) — Solo sus propias notas en Borrador',
    },
  ];
}

export function filtrarQuerysetAdminPorRol(
  noticias: NoticiaItem[],
  usuario: Pick<AutorEditorial, 'id' | 'rol'>
): NoticiaItem[] {
  if (usuario.rol === 'ADMIN' || usuario.rol === 'EDITOR') {
    return noticias;
  }
  return noticias.filter((n) => n.autor.id === usuario.id);
}

export function simularEjecucionBackupMySql(
  totalNoticias: number,
  diasRetencion: number = 14,
  omitirMedia: boolean = false
): {
  archivoSqlGz: string;
  pesoSqlMb: number;
  archivoMediaTarGz: string | null;
  pesoMediaMb: number;
  archivosAntiguosPurgados: number;
  comandoMysqldump: string;
} {
  const fechaTag = '20261114_063000';
  const pesoSqlMb = Number((12.4 + totalNoticias * 0.25).toFixed(2));
  const pesoMediaMb = omitirMedia
    ? 0
    : Number((68.0 + totalNoticias * 1.8).toFixed(2));
  const archivosAntiguosPurgados = diasRetencion <= 7 ? 6 : diasRetencion <= 14 ? 3 : 1;

  return {
    archivoSqlGz: `db_diario_tech_db_${fechaTag}.sql.gz`,
    pesoSqlMb,
    archivoMediaTarGz: omitirMedia ? null : `media_diario_tech_db_${fechaTag}.tar.gz`,
    pesoMediaMb,
    archivosAntiguosPurgados,
    comandoMysqldump:
      'mysqldump --single-transaction --quick --routines --triggers --events --default-character-set=utf8mb4 diario_tech_db | gzip -6',
  };
}

export function paginarResultados<T>(
  items: T[],
  paginaActual: number = 1,
  porPagina: number = 10
): {
  resultados: T[];
  pagina: number;
  totalPaginas: number;
  totalItems: number;
  tieneSiguiente: boolean;
  tieneAnterior: boolean;
} {
  const totalItems = items.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / Math.max(1, porPagina)));
  const pagina = Math.min(Math.max(1, paginaActual), totalPaginas);
  const inicio = (pagina - 1) * porPagina;
  const resultados = items.slice(inicio, inicio + porPagina);

  return {
    resultados,
    pagina,
    totalPaginas,
    totalItems,
    tieneSiguiente: pagina < totalPaginas,
    tieneAnterior: pagina > 1,
  };
}

export function generarRobotsTxt(siteUrl: string, reglasExtra: string = ''): string {
  const base = siteUrl.replace(/\/$/, '');
  const lineas = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /usuarios/login/',
    'Disallow: /newsletter/baja/',
    'Disallow: /buscar/?q=*',
    '',
    `Sitemap: ${base}/sitemap.xml`,
  ];
  if (reglasExtra.trim()) {
    lineas.push('', '# Directivas adicionales configuradas en el Panel Editorial', reglasExtra.trim());
  }
  return `${lineas.join('\n')}\n`;
}

export function construirPayloadNewsletterBrevo(
  email: string,
  nombre: string,
  categorias: string[],
  listId: number = 4
): {
  email: string;
  attributes: { NOMBRE: string; INTERESES: string; ORIGEN: string };
  listIds: number[];
  updateEnabled: boolean;
} {
  return {
    email: email.trim().toLowerCase(),
    attributes: {
      NOMBRE: nombre.trim(),
      INTERESES: categorias.join(', '),
      ORIGEN: 'portada_footer',
    },
    listIds: [listId],
    updateEnabled: true,
  };
}

export function generarMetaTagsOpenGraph(
  noticia: Pick<
    NoticiaItem,
    'titulo' | 'bajada' | 'slug' | 'imagenUrl' | 'metaTitle' | 'metaDescription' | 'categoriaNombre' | 'fechaPublicacion'
  >,
  siteUrl: string = 'https://www.diariotech.com'
): {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: 'article';
  ogImage: string;
  twitterCard: 'summary_large_image';
} {
  const base = siteUrl.replace(/\/$/, '');
  const title = (noticia.metaTitle || noticia.titulo).slice(0, 70);
  const description = (noticia.metaDescription || noticia.bajada).slice(0, 160);
  const canonicalUrl = `${base}/noticia/${noticia.slug}/`;
  const ogImage = noticia.imagenUrl.startsWith('http')
    ? noticia.imagenUrl
    : `${base}${noticia.imagenUrl}`;

  return {
    title,
    description,
    canonicalUrl,
    ogType: 'article',
    ogImage,
    twitterCard: 'summary_large_image',
  };
}



