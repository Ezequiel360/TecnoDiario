import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizarSlug,
  generarSlugUnico,
  calcularTiempoLectura,
  esNoticiaVisible,
  filtrarNoticias,
  simularOptimizacionPillowWebp,
  verificarPermisoEditorial,
  generarSitemapXml,
  obtenerMatrizGruposRbac,
  filtrarQuerysetAdminPorRol,
  simularEjecucionBackupMySql,
  paginarResultados,
  generarRobotsTxt,
  construirPayloadNewsletterBrevo,
  generarMetaTagsOpenGraph,
  NoticiaItem,
} from './editorialLogic';

test('normalizarSlug y generarSlugUnico resuelven acentos y colisiones como en MySQL', () => {
  assert.equal(
    normalizarSlug('¿El Futuro de la IA Cuántica en 2026?'),
    'el-futuro-de-la-ia-cuantica-en-2026'
  );
  const existentes = ['arquitectura-risc-v', 'arquitectura-risc-v-2'];
  assert.equal(
    generarSlugUnico('Arquitectura RISC-V', existentes),
    'arquitectura-risc-v-3'
  );
});

test('calcularTiempoLectura limpia etiquetas HTML y calcula minutos a 220 ppm', () => {
  const palabras440 = Array.from({ length: 440 }, () => 'semiconductor').join(' ');
  const html = `<p><strong>${palabras440}</strong></p>`;
  assert.equal(calcularTiempoLectura(html), 2);
});

test('esNoticiaVisible respeta estados BORRADOR, PROGRAMADO y PUBLICADO', () => {
  const ahora = '2026-11-14T12:00:00Z';
  assert.equal(
    esNoticiaVisible({ estado: 'BORRADOR', fechaPublicacion: '2026-11-10T10:00:00Z' }, ahora),
    false
  );
  assert.equal(
    esNoticiaVisible({ estado: 'PROGRAMADO', fechaPublicacion: '2026-11-15T10:00:00Z' }, ahora),
    false
  );
  assert.equal(
    esNoticiaVisible({ estado: 'PROGRAMADO', fechaPublicacion: '2026-11-14T11:00:00Z' }, ahora),
    true
  );
  assert.equal(
    esNoticiaVisible({ estado: 'PUBLICADO', fechaPublicacion: '2026-11-14T08:00:00Z' }, ahora),
    true
  );
});

test('simularOptimizacionPillowWebp redimensiona con filtro LANCZOS y reduce peso en WebP', () => {
  const resultado = simularOptimizacionPillowWebp(3200, 1800, 2400, 1600, 900, 82);
  assert.equal(resultado.anchoFinal, 1600);
  assert.equal(resultado.altoFinal, 900);
  assert.ok(resultado.pesoWebpKb < 500);
  assert.ok(resultado.ahorroPorcentaje > 75);
});

test('verificarPermisoEditorial aplica reglas RBAC de Administrador, Editor y Redactor', () => {
  assert.equal(verificarPermisoEditorial('ADMIN', 'u1', 'u2', 'eliminar'), true);
  assert.equal(verificarPermisoEditorial('EDITOR', 'u1', 'u2', 'publicar'), true);
  assert.equal(verificarPermisoEditorial('EDITOR', 'u1', 'u2', 'eliminar'), false);
  assert.equal(verificarPermisoEditorial('REDACTOR', 'u1', 'u1', 'editar'), true);
  assert.equal(verificarPermisoEditorial('REDACTOR', 'u1', 'u2', 'editar'), false);
  assert.equal(verificarPermisoEditorial('REDACTOR', 'u1', 'u1', 'publicar'), false);
});

test('filtrarNoticias y generarSitemapXml procesan búsquedas y URLs amigables', () => {
  const sample: NoticiaItem[] = [
    {
      id: '1',
      titulo: 'Silicio Fotónico de 1.4nm',
      slug: 'silicio-fotonico-1-4nm',
      bajada: 'Avance en litografía óptica',
      contenido: '<p>Procesadores NPU de última generación</p>',
      categoriaSlug: 'hardware',
      categoriaNombre: 'Hardware',
      etiquetas: ['Semiconductores', 'Fotónica'],
      autor: {
        id: 'a1',
        nombre: 'Elena Rostova',
        slug: 'elena-rostova',
        email: 'elena@diariotech.com',
        rol: 'EDITOR',
        especialidad: 'Física de Semiconductores',
        biografiaCorta: 'Editora de Hardware',
        xHandle: 'elenarostova',
      },
      imagenUrl: '/img.jpg',
      imagenAlt: 'Oblea de silicio',
      epigrafe: 'Laboratorio',
      estado: 'PUBLICADO',
      nivelDestacado: 'HERO',
      fechaPublicacion: '2026-11-14T08:00:00Z',
      tiempoLecturaMinutos: 5,
      vistas: 1200,
      metaTitle: 'Silicio Fotónico',
      metaDescription: 'Avance en litografía',
      webpPesoOriginalKb: 1840,
      webpPesoOptimizadoKb: 192,
      dimensionesWebp: '1600x900',
    },
  ];

  const filtradas = filtrarNoticias(sample, {
    busqueda: 'fotónica',
    ahoraIso: '2026-11-14T12:00:00Z',
  });
  assert.equal(filtradas.length, 1);

  const xml = generarSitemapXml('https://www.diariotech.com', filtradas, ['hardware']);
  assert.ok(xml.includes('<loc>https://www.diariotech.com/noticia/silicio-fotonico-1-4nm/</loc>'));
});

test('Fase 2: Matriz RBAC, get_queryset de NoticiaAdmin y backup_diario MySQL', () => {
  const matriz = obtenerMatrizGruposRbac();
  assert.equal(matriz.length, 3);
  assert.ok(matriz[0].permisosClave.includes('can_publish_noticia'));
  assert.ok(!matriz[2].permisosClave.includes('can_publish_noticia'));

  const mockNoticias = [
    { id: 'n1', autor: { id: 'u1' } } as NoticiaItem,
    { id: 'n2', autor: { id: 'u2' } } as NoticiaItem,
  ];
  assert.equal(filtrarQuerysetAdminPorRol(mockNoticias, { id: 'u1', rol: 'REDACTOR' }).length, 1);
  assert.equal(filtrarQuerysetAdminPorRol(mockNoticias, { id: 'u1', rol: 'EDITOR' }).length, 2);

  const backup = simularEjecucionBackupMySql(10, 14, false);
  assert.ok(backup.archivoSqlGz.endsWith('.sql.gz'));
  assert.ok(backup.archivoMediaTarGz?.endsWith('.tar.gz'));
  assert.ok(backup.comandoMysqldump.includes('--single-transaction'));
});

test('Fase 3: Paginación de vistas, vista robots.txt y payload de servicio Newsletter', () => {
  const pag = paginarResultados([1, 2, 3, 4, 5, 6, 7], 2, 3);
  assert.deepEqual(pag.resultados, [4, 5, 6]);
  assert.equal(pag.totalPaginas, 3);
  assert.equal(pag.tieneSiguiente, true);
  assert.equal(pag.tieneAnterior, true);

  const robots = generarRobotsTxt('https://www.diariotech.com', 'Disallow: /borradores/');
  assert.ok(robots.includes('Sitemap: https://www.diariotech.com/sitemap.xml'));
  assert.ok(robots.includes('Disallow: /borradores/'));

  const payload = construirPayloadNewsletterBrevo('Dev@DiarioTech.com ', 'Martín', ['Hardware', 'IA'], 4);
  assert.equal(payload.email, 'dev@diariotech.com');
  assert.equal(payload.attributes.INTERESES, 'Hardware, IA');
  assert.deepEqual(payload.listIds, [4]);
});

test('Fase 4: Generación dinámica de metadatos OpenGraph y Twitter Cards para templates DTL', () => {
  const meta = generarMetaTagsOpenGraph(
    {
      titulo: 'El Futuro del Silicio Fotónico: Arquitecturas NPU de 1.4nm',
      bajada: 'Nuevos interconectores ópticos integrados en el sustrato.',
      slug: 'silicio-fotonico-npu-1-4nm',
      imagenUrl: '/media/noticias/2026/11/silicio-fotonico.webp',
      metaTitle: 'Silicio Fotónico NPU 1.4nm | Diario Digital Tecnológico',
      metaDescription: 'Los interconectores ópticos reducen la disipación térmica en un 68%.',
      categoriaNombre: 'Hardware',
      fechaPublicacion: '2026-11-14T10:00:00Z',
    },
    'https://www.diariotech.com'
  );

  assert.equal(meta.ogType, 'article');
  assert.equal(meta.twitterCard, 'summary_large_image');
  assert.equal(meta.canonicalUrl, 'https://www.diariotech.com/noticia/silicio-fotonico-npu-1-4nm/');
  assert.equal(meta.ogImage, 'https://www.diariotech.com/media/noticias/2026/11/silicio-fotonico.webp');
});



