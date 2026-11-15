import React, { useState } from 'react';
import {
  Search,
  ArrowLeft,
  Share2,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Code2,
} from 'lucide-react';
import {
  NoticiaItem,
  filtrarNoticias,
} from '../utils/editorialLogic';
import {
  BannerPublicitario,
  CategoriaEditorial,
} from '../data/seedArticles';

interface PublicPortalViewProps {
  noticias: NoticiaItem[];
  categorias: CategoriaEditorial[];
  banners: BannerPublicitario[];
  categoriaActiva: string;
  onSelectCategoria: (slug: string) => void;
  noticiaDetalle: NoticiaItem | null;
  onSelectNoticia: (noticia: NoticiaItem | null) => void;
  onSuscribirNewsletter: (email: string, nombre: string, categorias: string[]) => void;
  onRegistrarClicBanner: (bannerId: string) => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  noticias,
  categorias,
  banners,
  categoriaActiva,
  onSelectCategoria,
  noticiaDetalle,
  onSelectNoticia,
  onSuscribirNewsletter,
  onRegistrarClicBanner,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [etiquetaFiltro, setEtiquetaFiltro] = useState<string | undefined>(undefined);
  const [autorFiltro, setAutorFiltro] = useState<string | undefined>(undefined);
  const [mostrarSeoHead, setMostrarSeoHead] = useState(false);
  const [copiadoEnlace, setCopiadoEnlace] = useState(false);

  // Estado formulario Newsletter
  const [newsEmail, setNewsEmail] = useState('');
  const [newsNombre, setNewsNombre] = useState('');
  const [newsExito, setNewsExito] = useState(false);
  const [newsError, setNewsError] = useState('');

  const noticiasVisibles = filtrarNoticias(noticias, {
    categoriaSlug: categoriaActiva,
    etiqueta: etiquetaFiltro,
    autorSlug: autorFiltro,
    busqueda,
  });

  const hayFiltrosActivos =
    categoriaActiva !== 'todas' ||
    Boolean(etiquetaFiltro) ||
    Boolean(autorFiltro) ||
    Boolean(busqueda.trim());

  const noticiaHero =
    noticiasVisibles.find((n) => n.nivelDestacado === 'HERO') ||
    noticiasVisibles[0];

  const noticiasSecundarias = noticiasVisibles
    .filter((n) => n.id !== noticiaHero?.id && n.nivelDestacado === 'SECUNDARIA')
    .slice(0, 3);

  const idsDestacados = new Set([
    noticiaHero?.id,
    ...noticiasSecundarias.map((s) => s.id),
  ]);

  const ultimasNoticias = hayFiltrosActivos
    ? noticiasVisibles.filter((n) => n.id !== noticiaHero?.id)
    : noticiasVisibles.filter((n) => !idsDestacados.has(n.id));

  const bannerIntermedio = banners.find(
    (b) => b.ubicacion === 'HOME_MID' && b.activo
  );
  const bannerSidebar = banners.find(
    (b) => b.ubicacion === 'SIDEBAR_STICKY' && b.activo
  );

  const handleLimpiarFiltros = () => {
    onSelectCategoria('todas');
    setEtiquetaFiltro(undefined);
    setAutorFiltro(undefined);
    setBusqueda('');
    onSelectNoticia(null);
  };

  const handleSubmitNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = newsEmail.trim();
    if (!limpio || !limpio.includes('@')) {
      setNewsError('Ingresa un correo electrónico corporativo o personal válido.');
      return;
    }
    setNewsError('');
    onSuscribirNewsletter(limpio, newsNombre.trim(), ['Hardware', 'IA']);
    setNewsEmail('');
    setNewsNombre('');
    setNewsExito(true);
  };

  const formatearFecha = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return iso.slice(0, 10);
    }
  };

  // ============================================================================
  // VISTA INDIVIDUAL DE NOTICIA (DETALLE EDITORIAL + SEO + RELACIONADAS)
  // ============================================================================
  if (noticiaDetalle) {
    const relacionadas = noticias
      .filter(
        (n) =>
          n.id !== noticiaDetalle.id &&
          n.estado === 'PUBLICADO' &&
          (n.categoriaSlug === noticiaDetalle.categoriaSlug ||
            n.etiquetas.some((t) => noticiaDetalle.etiquetas.includes(t)))
      )
      .slice(0, 3);

    return (
      <article className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Barra de retorno e inspección SEO OpenGraph */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[#EBE6DF]">
          <button
            type="button"
            onClick={() => onSelectNoticia(null)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#1C1917] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la edición de portada
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMostrarSeoHead((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] text-[#1C1917] hover:bg-[#EBE6DF]/60 rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5 text-[#9A3412]" />
              {mostrarSeoHead ? 'Ocultar Meta SEO / OpenGraph' : 'Inspeccionar <head> SEO'}
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(
                  `https://www.diariotech.com/noticia/${noticiaDetalle.slug}/`
                );
                setCopiadoEnlace(true);
                setTimeout(() => setCopiadoEnlace(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] text-[#1C1917] hover:bg-[#EBE6DF]/60 rounded transition-colors whitespace-nowrap shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiadoEnlace ? 'URL Slug copiada' : 'Compartir URL'}
            </button>
          </div>
        </div>

        {/* Inspector en vivo de etiquetas OpenGraph y Twitter Cards en <head> */}
        {mostrarSeoHead && (
          <div className="mb-8 p-5 bg-[#1C1917] text-[#FBF9F5] rounded border border-[#292524]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#D6CEBE]">
                Renderizado dinámico en templates/base.html (SEO &amp; OpenGraph)
              </span>
              <span className="text-xs font-mono text-[#D6CEBE]">
                Slug: /noticia/{noticiaDetalle.slug}/
              </span>
            </div>
            <pre className="text-xs font-mono text-[#EBE6DF] overflow-x-auto leading-relaxed">
{`<title>${noticiaDetalle.metaTitle || noticiaDetalle.titulo}</title>
<meta name="description" content="${noticiaDetalle.metaDescription || noticiaDetalle.bajada}" />
<link rel="canonical" href="https://www.diariotech.com/noticia/${noticiaDetalle.slug}/" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${noticiaDetalle.metaTitle || noticiaDetalle.titulo}" />
<meta property="og:description" content="${noticiaDetalle.metaDescription || noticiaDetalle.bajada}" />
<meta property="og:image" content="https://www.diariotech.com/media/noticias/portadas/${noticiaDetalle.slug}.webp" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:creator" content="@${noticiaDetalle.autor.xHandle}" />`}
            </pre>
          </div>
        )}

        {/* Encabezado Editorial de la Noticia */}
        <header className="max-w-3xl mb-8">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[#737373] mb-3">
            <button
              type="button"
              onClick={() => {
                onSelectCategoria(noticiaDetalle.categoriaSlug);
                onSelectNoticia(null);
              }}
              className="font-semibold text-[#9A3412] hover:underline"
            >
              {noticiaDetalle.categoriaNombre}
            </button>
            <span aria-hidden="true">·</span>
            <span>{formatearFecha(noticiaDetalle.fechaPublicacion)}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{noticiaDetalle.tiempoLecturaMinutos} min de lectura</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{noticiaDetalle.vistas.toLocaleString('es-ES')} lecturas</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-editorial font-semibold text-[#1C1917] leading-[1.15] mb-5">
            {noticiaDetalle.titulo}
          </h1>

          <p className="text-lg sm:text-xl text-[#292524] leading-relaxed mb-6">
            {noticiaDetalle.bajada}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#EBE6DF] text-xs text-[#57534E]">
            <div>
              Por{' '}
              <button
                type="button"
                onClick={() => {
                  setAutorFiltro(noticiaDetalle.autor.slug);
                  onSelectNoticia(null);
                }}
                className="font-semibold text-[#1C1917] hover:text-[#9A3412] underline decoration-[#D6CEBE]"
              >
                {noticiaDetalle.autor.nombre}
              </button>
              <span aria-hidden="true"> · </span>
              <span>{noticiaDetalle.autor.especialidad}</span>
            </div>
            <div className="font-mono text-[11px] text-[#737373]">
              Optimizado por Pillow: WebP {noticiaDetalle.dimensionesWebp} ({noticiaDetalle.webpPesoOptimizadoKb} KB vs {noticiaDetalle.webpPesoOriginalKb} KB orig.)
            </div>
          </div>
        </header>

        {/* Imagen Principal con Fallback Resiliente */}
        <figure className="mb-10">
          <div className="relative w-full aspect-16/9 bg-[#EBE6DF] overflow-hidden rounded border border-[#D6CEBE]">
            <img
              src={noticiaDetalle.imagenUrl}
              alt={noticiaDetalle.imagenAlt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <figcaption className="text-xs font-editorial italic text-[#57534E] mt-2.5">
            {noticiaDetalle.epigrafe}
          </figcaption>
        </figure>

        {/* Grilla Asimétrica 70% Lectura / 30% Columna Marginal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8">
            <div
              className="max-w-[68ch] text-[16px] text-[#1C1917] leading-[1.8] space-y-5 first-letter:text-5xl first-letter:font-editorial first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#9A3412] [&_h2]:text-2xl [&_h2]:font-editorial [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-editorial [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_blockquote]:my-6 [&_blockquote]:py-4 [&_blockquote]:border-y [&_blockquote]:border-[#D6CEBE] [&_blockquote]:font-editorial [&_blockquote]:italic [&_blockquote]:text-xl [&_blockquote]:text-[#292524] [&_code]:font-mono [&_code]:text-sm [&_code]:bg-[#EBE6DF] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
              dangerouslySetInnerHTML={{ __html: noticiaDetalle.contenido }}
            />

            {/* Etiquetas (Tags) sin cajas de píldora, siguiendo disciplina tipográfica */}
            <div className="mt-10 pt-6 border-t border-[#EBE6DF] flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
              <span className="uppercase tracking-widest font-semibold text-[#1C1917] mr-2">
                Etiquetas indexadas:
              </span>
              {noticiaDetalle.etiquetas.map((tag, idx) => (
                <React.Fragment key={tag}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <button
                    type="button"
                    onClick={() => {
                      setEtiquetaFiltro(tag);
                      onSelectNoticia(null);
                    }}
                    className="hover:text-[#9A3412] underline decoration-[#D6CEBE] transition-colors"
                  >
                    #{tag}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Perfil del Autor */}
            <section
              aria-label="Perfil del autor"
              className="mt-10 p-6 bg-[#F7F4EE] border border-[#EBE6DF] rounded"
            >
              <div className="text-xs uppercase tracking-widest text-[#737373] mb-1">
                Sobre la firma editorial · Rol: {noticiaDetalle.autor.rol}
              </div>
              <h3 className="text-xl font-editorial font-semibold text-[#1C1917] mb-2">
                {noticiaDetalle.autor.nombre}
              </h3>
              <p className="text-sm text-[#292524] leading-relaxed mb-4">
                {noticiaDetalle.autor.biografiaCorta}
              </p>
              <button
                type="button"
                onClick={() => {
                  setAutorFiltro(noticiaDetalle.autor.slug);
                  onSelectNoticia(null);
                }}
                className="text-xs font-semibold text-[#9A3412] hover:underline"
              >
                Ver todos los artículos de {noticiaDetalle.autor.nombre} →
              </button>
            </section>
          </div>

          {/* Barra lateral: Metadatos Técnicos MySQL y Espacio Publicitario Vigente */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="p-5 bg-[#F7F4EE] border border-[#EBE6DF] rounded">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1C1917] pb-3 mb-3 border-b border-[#EBE6DF]">
                Ficha Técnica en MySQL 8.0
              </h3>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#737373]">Slug Único:</dt>
                  <dd className="font-mono text-[#1C1917] truncate max-w-[180px]">
                    {noticiaDetalle.slug}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#737373]">Índice ejecutado:</dt>
                  <dd className="font-mono text-[#1C1917]">idx_noticia_estado_fecha</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#737373]">Optimización ORM:</dt>
                  <dd className="font-mono text-[#14532D]">select_related + prefetch</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#737373]">Formato Multimedia:</dt>
                  <dd className="font-mono text-[#1C1917]">
                    WebP ({noticiaDetalle.webpPesoOptimizadoKb} KB)
                  </dd>
                </div>
              </dl>
            </div>

            {bannerSidebar && (
              <div className="p-5 bg-[#F7F4EE] border border-[#D6CEBE] rounded">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-[#737373] mb-2">
                  <span>Espacio Patrocinado</span>
                  <span className="font-mono">{bannerSidebar.dimensiones}</span>
                </div>
                <h4 className="text-lg font-editorial font-semibold text-[#1C1917] mb-2">
                  {bannerSidebar.tituloCampana}
                </h4>
                <p className="text-xs text-[#57534E] mb-4">
                  Anunciante: {bannerSidebar.anunciante} · Vigencia verificada por AnuncioQuerySet.vigentes()
                </p>
                <button
                  type="button"
                  onClick={() => onRegistrarClicBanner(bannerSidebar.id)}
                  className="w-full py-2 px-4 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-[#292524] rounded transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <span>{bannerSidebar.ctaTexto}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </aside>
        </div>

        {/* Noticias Relacionadas */}
        {relacionadas.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#D6CEBE]">
            <h2 className="text-2xl font-editorial font-semibold text-[#1C1917] mb-6">
              Lecturas Relacionadas en la Misma Cobertura
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relacionadas.map((rel) => (
                <div
                  key={rel.id}
                  className="group flex flex-col justify-between border-b border-[#EBE6DF] pb-5"
                >
                  <div>
                    <div className="text-xs text-[#737373] mb-2">
                      <span className="text-[#9A3412] font-medium">{rel.categoriaNombre}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{rel.tiempoLecturaMinutos} min lectura</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectNoticia(rel)}
                      className="text-left text-lg font-editorial font-semibold text-[#1C1917] group-hover:text-[#9A3412] transition-colors leading-snug"
                    >
                      {rel.titulo}
                    </button>
                  </div>
                  <div className="text-xs text-[#737373] mt-3">
                    Por {rel.autor.nombre}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    );
  }

  // ============================================================================
  // VISTA PRINCIPAL DE PORTADA (HOME / SECCIONES / BUSCADOR)
  // ============================================================================
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Cinta Operativa de Edición, Secciones y Buscador Full-Text MySQL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#D6CEBE]">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
              categoriaActiva === 'todas' && !etiquetaFiltro && !autorFiltro
                ? 'bg-[#1C1917] text-[#FBF9F5]'
                : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE6DF]/60'
            }`}
          >
            Portada General
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                onSelectCategoria(cat.slug);
                setEtiquetaFiltro(undefined);
                setAutorFiltro(undefined);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                categoriaActiva === cat.slug
                  ? 'bg-[#1C1917] text-[#FBF9F5]'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#EBE6DF]/60'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Buscador Full-Text en Título, Bajada, Contenido y Etiquetas */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative w-full lg:w-72 shrink-0"
          role="search"
        >
          <label htmlFor="buscador-editorial" className="sr-only">
            Buscar en título, resumen y contenido
          </label>
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="buscador-editorial"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar en noticias (ej. Fotónica, HSM, SQL)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917] placeholder:text-[#737373] focus:outline-none focus:border-[#9A3412]"
          />
        </form>
      </div>

      {/* Indicador de filtro activo (Categoría, Etiqueta, Autor o Búsqueda) */}
      {hayFiltrosActivos && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-[#F7F4EE] border border-[#EBE6DF] rounded">
          <div className="text-xs text-[#292524]">
            <span className="font-semibold">Filtro editorial activo: </span>
            {categoriaActiva !== 'todas' && (
              <span>Sección «{categorias.find((c) => c.slug === categoriaActiva)?.nombre}» </span>
            )}
            {etiquetaFiltro && <span>Etiqueta #{etiquetaFiltro} </span>}
            {autorFiltro && <span>Autor @{autorFiltro} </span>}
            {busqueda.trim() && <span>Búsqueda «{busqueda.trim()}» </span>}
            <span className="font-mono text-[#737373]">
              ({noticiasVisibles.length} resultados encontrados)
            </span>
          </div>
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="text-xs font-semibold text-[#9A3412] hover:underline"
          >
            Restablecer portada completa
          </button>
        </div>
      )}

      {/* Estado vacío si la búsqueda no arroja coincidencias */}
      {noticiasVisibles.length === 0 ? (
        <div className="py-16 text-center border border-[#EBE6DF] rounded bg-[#F7F4EE]">
          <h2 className="text-2xl font-editorial font-semibold text-[#1C1917] mb-2">
            No se encontraron artículos para tu consulta
          </h2>
          <p className="text-sm text-[#57534E] mb-6">
            Intenta con otros términos técnicos o explora todas las secciones del diario.
          </p>
          <button
            type="button"
            onClick={handleLimpiarFiltros}
            className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] rounded hover:bg-[#292524]"
          >
            Ver todas las noticias publicadas
          </button>
        </div>
      ) : (
        <>
          {/* TIER 1: NOTICIA PRINCIPAL DESTACADA (HERO) */}
          {noticiaHero && (
            <section
              aria-label="Noticia principal de portada"
              className="pb-12 mb-12 border-b border-[#D6CEBE]"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373] mb-3">
                      <span className="uppercase tracking-widest font-semibold text-[#9A3412]">
                        Tema de Portada · {noticiaHero.categoriaNombre}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{formatearFecha(noticiaHero.fechaPublicacion)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{noticiaHero.tiempoLecturaMinutos} min lectura</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-editorial font-semibold text-[#1C1917] leading-[1.15] mb-4">
                      <button
                        type="button"
                        onClick={() => onSelectNoticia(noticiaHero)}
                        className="text-left hover:text-[#9A3412] transition-colors"
                      >
                        {noticiaHero.titulo}
                      </button>
                    </h1>

                    <p className="text-base sm:text-lg text-[#292524] leading-relaxed mb-6">
                      {noticiaHero.bajada}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#EBE6DF] flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-[#57534E]">
                      Por{' '}
                      <button
                        type="button"
                        onClick={() => setAutorFiltro(noticiaHero.autor.slug)}
                        className="font-semibold text-[#1C1917] hover:text-[#9A3412] underline decoration-[#D6CEBE]"
                      >
                        {noticiaHero.autor.nombre}
                      </button>
                      <span aria-hidden="true"> · </span>
                      <span>{noticiaHero.autor.especialidad}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectNoticia(noticiaHero)}
                      className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] rounded hover:bg-[#9A3412] transition-colors whitespace-nowrap shrink-0"
                    >
                      Leer reportaje completo →
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <figure className="h-full flex flex-col">
                    <button
                      type="button"
                      aria-label={`Abrir reportaje principal: ${noticiaHero.titulo}`}
                      onClick={() => onSelectNoticia(noticiaHero)}
                      className="relative w-full aspect-16/9 lg:aspect-auto lg:h-full min-h-[260px] bg-[#EBE6DF] rounded overflow-hidden border border-[#D6CEBE] group text-left"
                    >
                      <img
                        src={noticiaHero.imagenUrl}
                        alt={noticiaHero.imagenAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      />
                    </button>
                    <figcaption className="text-xs font-editorial italic text-[#57534E] mt-2">
                      {noticiaHero.epigrafe}
                    </figcaption>
                  </figure>
                </div>
              </div>
            </section>
          )}

          {/* TIER 2: GRILLA DE NOTICIAS SECUNDARIAS DESTACADAS */}
          {!hayFiltrosActivos && noticiasSecundarias.length > 0 && (
            <section
              aria-label="Noticias secundarias destacadas"
              className="pb-12 mb-12 border-b border-[#D6CEBE]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-editorial font-semibold text-[#1C1917]">
                  Análisis e Investigaciones Destacadas
                </h2>
                <span className="text-xs text-[#737373]">
                  Edición curada por el consejo editorial
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {noticiasSecundarias.map((sec) => (
                  <article
                    key={sec.id}
                    className="flex flex-col justify-between group"
                  >
                    <div>
                      <button
                        type="button"
                        aria-label={`Ver artículo destacado: ${sec.titulo}`}
                        onClick={() => onSelectNoticia(sec)}
                        className="w-full aspect-4/3 bg-[#EBE6DF] rounded overflow-hidden border border-[#D6CEBE] mb-4 block"
                      >
                        <img
                          src={sec.imagenUrl}
                          alt={sec.imagenAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      </button>

                      {/* Metadata sin píldoras */}
                      <div className="flex items-center gap-2 text-xs text-[#737373] mb-2">
                        <button
                          type="button"
                          onClick={() => onSelectCategoria(sec.categoriaSlug)}
                          className="font-semibold text-[#9A3412] hover:underline"
                        >
                          {sec.categoriaNombre}
                        </button>
                        <span aria-hidden="true">·</span>
                        <span>{formatearFecha(sec.fechaPublicacion)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{sec.tiempoLecturaMinutos} min</span>
                      </div>

                      <h3 className="text-xl font-editorial font-semibold text-[#1C1917] leading-snug mb-2.5">
                        <button
                          type="button"
                          onClick={() => onSelectNoticia(sec)}
                          className="text-left group-hover:text-[#9A3412] transition-colors"
                        >
                          {sec.titulo}
                        </button>
                      </h3>

                      <p className="text-sm text-[#57534E] leading-relaxed mb-4 line-clamp-3">
                        {sec.bajada}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#EBE6DF] flex items-center justify-between text-xs text-[#737373]">
                      <button
                        type="button"
                        onClick={() => setAutorFiltro(sec.autor.slug)}
                        className="hover:text-[#1C1917] underline decoration-[#D6CEBE]"
                      >
                        {sec.autor.nombre}
                      </button>
                      <div className="flex items-center gap-1.5">
                        {sec.etiquetas.slice(0, 2).map((tag, i) => (
                          <React.Fragment key={tag}>
                            {i > 0 && <span aria-hidden="true">·</span>}
                            <button
                              type="button"
                              onClick={() => setEtiquetaFiltro(tag)}
                              className="hover:text-[#9A3412]"
                            >
                              #{tag}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ESPACIO PUBLICITARIO INTERMEDIO PROGRAMADO */}
          {bannerIntermedio && (
            <section
              aria-label="Espacio publicitario patrocinado"
              className="mb-12 p-6 bg-[#F7F4EE] border border-[#D6CEBE] rounded flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#737373] mb-1">
                  <span>Espacio Publicitario Programado ({bannerIntermedio.ubicacion})</span>
                  <span aria-hidden="true">·</span>
                  <span>Patrocinado por {bannerIntermedio.anunciante}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">
                    Vigencia: {bannerIntermedio.fechaInicio} a {bannerIntermedio.fechaFin}
                  </span>
                </div>
                <h3 className="text-xl font-editorial font-semibold text-[#1C1917]">
                  {bannerIntermedio.tituloCampana}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onRegistrarClicBanner(bannerIntermedio.id)}
                className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] rounded hover:bg-[#9A3412] transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2"
              >
                <span>{bannerIntermedio.ctaTexto}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </section>
          )}

          {/* TIER 3: ÚLTIMAS NOTICIAS PUBLICADAS + CAPTURA DE NEWSLETTER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <section
              aria-label="Últimas noticias publicadas"
              className="lg:col-span-8 space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#1C1917]">
                <h2 className="text-xl font-editorial font-semibold text-[#1C1917]">
                  {hayFiltrosActivos
                    ? 'Artículos en esta Selección'
                    : 'Últimas Noticias Publicadas'}
                </h2>
                <span className="text-xs font-mono text-[#737373]">
                  Orden: -fecha_publicacion
                </span>
              </div>

              {ultimasNoticias.length === 0 ? (
                <p className="text-sm text-[#57534E] py-4">
                  Has visualizado el artículo principal de esta selección.
                </p>
              ) : (
                <div className="divide-y divide-[#EBE6DF]">
                  {ultimasNoticias.map((item) => (
                    <article
                      key={item.id}
                      className="py-5 first:pt-2 flex flex-col sm:flex-row justify-between gap-6 group"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373]">
                          <button
                            type="button"
                            onClick={() => onSelectCategoria(item.categoriaSlug)}
                            className="font-semibold text-[#9A3412] hover:underline"
                          >
                            {item.categoriaNombre}
                          </button>
                          <span aria-hidden="true">·</span>
                          <span>{formatearFecha(item.fechaPublicacion)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{item.tiempoLecturaMinutos} min lectura</span>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => setAutorFiltro(item.autor.slug)}
                            className="hover:text-[#1C1917] underline decoration-[#D6CEBE]"
                          >
                            {item.autor.nombre}
                          </button>
                        </div>

                        <h3 className="text-xl font-editorial font-semibold text-[#1C1917] leading-snug">
                          <button
                            type="button"
                            onClick={() => onSelectNoticia(item)}
                            className="text-left group-hover:text-[#9A3412] transition-colors"
                          >
                            {item.titulo}
                          </button>
                        </h3>

                        <p className="text-sm text-[#57534E] leading-relaxed">
                          {item.bajada}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#737373] pt-1">
                          {item.etiquetas.map((tag, idx) => (
                            <React.Fragment key={tag}>
                              {idx > 0 && <span aria-hidden="true">·</span>}
                              <button
                                type="button"
                                onClick={() => setEtiquetaFiltro(tag)}
                                className="hover:text-[#9A3412]"
                              >
                                #{tag}
                              </button>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={`Leer nota: ${item.titulo}`}
                        onClick={() => onSelectNoticia(item)}
                        className="w-full sm:w-44 aspect-4/3 bg-[#EBE6DF] rounded overflow-hidden border border-[#D6CEBE] shrink-0 self-start"
                      >
                        <img
                          src={item.imagenUrl}
                          alt={item.imagenAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                        />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Columna Derecha: Captura de Suscriptores Newsletter + Exploración por Tags */}
            <aside className="lg:col-span-4 space-y-8">
              <div className="p-6 bg-[#F7F4EE] border border-[#D6CEBE] rounded">
                <div className="text-xs uppercase tracking-widest text-[#9A3412] font-semibold mb-1">
                  Boletín de Ingeniería · Newsletter
                </div>
                <h3 className="text-2xl font-editorial font-semibold text-[#1C1917] mb-2">
                  Resumen Semanal de Arquitectura y Silicio
                </h3>
                <p className="text-xs text-[#57534E] leading-relaxed mb-4">
                  Recibe cada viernes nuestros análisis de profundidad técnica. Sincronización automática vía Webhook desacoplado con Brevo / Mailchimp.
                </p>

                {newsExito ? (
                  <div className="p-4 bg-white border border-[#14532D]/30 rounded text-xs text-[#14532D] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Suscripción registrada y sincronizada</span>
                    </div>
                    <p className="text-[#292524]">
                      El registro fue persistido en <code>newsletter_suscriptor</code> y enviado al servicio Webhook con estado HTTP 201.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitNewsletter} className="space-y-3" noValidate>
                    <div>
                      <label
                        htmlFor="newsletter-nombre"
                        className="block text-xs font-medium text-[#1C1917] mb-1"
                      >
                        Nombre completo (opcional)
                      </label>
                      <input
                        id="newsletter-nombre"
                        type="text"
                        value={newsNombre}
                        onChange={(e) => setNewsNombre(e.target.value)}
                        placeholder="Ej. Ing. Valeria Quiroga"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="newsletter-email"
                        className="block text-xs font-medium text-[#1C1917] mb-1"
                      >
                        Correo electrónico *
                      </label>
                      <input
                        id="newsletter-email"
                        type="email"
                        required
                        value={newsEmail}
                        onChange={(e) => setNewsEmail(e.target.value)}
                        placeholder="nombre@empresa.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
                      />
                    </div>
                    {newsError && (
                      <p className="text-xs text-[#9A3412] font-medium">{newsError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-[#9A3412] rounded transition-colors"
                    >
                      Suscribirme al Boletín Técnico
                    </button>
                  </form>
                )}
              </div>

              {/* Índice de Etiquetas (Tags) y Autores */}
              <div className="p-6 bg-[#F7F4EE] border border-[#EBE6DF] rounded space-y-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#1C1917] pb-2 mb-3 border-b border-[#EBE6DF]">
                    Explorar por Etiquetas (Tags)
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-[#57534E]">
                    {[
                      'Fotónica',
                      'Semiconductores',
                      'Django 5',
                      'MySQL 8.0',
                      'Post-Cuántica',
                      'Zero-Trust',
                      'InfiniBand',
                      'eBPF',
                    ].map((tag, idx) => (
                      <React.Fragment key={tag}>
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <button
                          type="button"
                          onClick={() => setEtiquetaFiltro(tag)}
                          className={`hover:text-[#9A3412] underline decoration-[#D6CEBE] ${
                            etiquetaFiltro === tag ? 'font-bold text-[#9A3412]' : ''
                          }`}
                        >
                          #{tag}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-[#1C1917] pb-2 mb-3 border-b border-[#EBE6DF]">
                    Mesa de Redacción y Autores
                  </h3>
                  <ul className="space-y-2.5 text-xs">
                    {Array.from(new Map(noticias.map((n) => [n.autor.slug, n.autor])).values()).map(
                      (aut) => (
                        <li key={aut.id} className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setAutorFiltro(aut.slug)}
                            className="font-medium text-[#1C1917] hover:text-[#9A3412] underline decoration-[#D6CEBE]"
                          >
                            {aut.nombre}
                          </button>
                          <span className="text-[#737373] font-mono text-[11px]">{aut.rol}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
