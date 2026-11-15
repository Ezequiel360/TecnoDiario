import React, { useState } from 'react';
import {
  Plus,
  Check,
  History,
  Image as ImageIcon,
  ShieldCheck,
  Megaphone,
  Mail,
  Globe,
  Trash2,
  Edit3,
} from 'lucide-react';
import {
  AutorEditorial,
  EstadoPublicacion,
  NivelDestacado,
  NoticiaItem,
  RegistroAuditoria,
  RolEditorial,
  calcularTiempoLectura,
  generarSitemapXml,
  generarSlugUnico,
  simularOptimizacionPillowWebp,
  verificarPermisoEditorial,
} from '../utils/editorialLogic';
import {
  BannerPublicitario,
  CategoriaEditorial,
  SuscriptorItem,
} from '../data/seedArticles';

interface AdminEditorialViewProps {
  noticias: NoticiaItem[];
  categorias: CategoriaEditorial[];
  autores: AutorEditorial[];
  auditoria: RegistroAuditoria[];
  banners: BannerPublicitario[];
  suscriptores: SuscriptorItem[];
  onGuardarNoticia: (noticia: NoticiaItem, esNueva: boolean, usuarioActivo: AutorEditorial) => void;
  onEliminarNoticia: (id: string, usuarioActivo: AutorEditorial) => void;
  onToggleBanner: (id: string) => void;
}

export const AdminEditorialView: React.FC<AdminEditorialViewProps> = ({
  noticias,
  categorias,
  autores,
  auditoria,
  banners,
  suscriptores,
  onGuardarNoticia,
  onEliminarNoticia,
  onToggleBanner,
}) => {
  const [subTab, setSubTab] = useState<
    'noticias' | 'auditoria' | 'publicidad' | 'newsletter' | 'seo'
  >('noticias');

  // Selector de Usuario/Rol Activo para demostrar el Sistema RBAC multi-autor
  const [usuarioActivoId, setUsuarioActivoId] = useState<string>(autores[0].id);
  const usuarioActivo =
    autores.find((a) => a.id === usuarioActivoId) || autores[0];

  // Estado del Editor CRUD de Noticias
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [bajada, setBajada] = useState('');
  const [contenido, setContenido] = useState(
    '<p>Análisis en profundidad sobre la nueva arquitectura de sistemas y su impacto en cargas transaccionales sobre MySQL 8.0.</p><h2>Resultados de laboratorio</h2><p>Las pruebas con conexiones persistentes demuestran una reducción del 40% en latencia p99.</p>'
  );
  const [categoriaSlug, setCategoriaSlug] = useState(categorias[0].slug);
  const [etiquetasInput, setEtiquetasInput] = useState('Django 5, MySQL 8.0, Arquitectura');
  const [estado, setEstado] = useState<EstadoPublicacion>('PUBLICADO');
  const [nivelDestacado, setNivelDestacado] = useState<NivelDestacado>('SECUNDARIA');
  const [fechaPublicacion, setFechaPublicacion] = useState('2026-11-14T06:00');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');

  // Simulador interactivo de Pillow -> WebP en save()
  const [imgAnchoOrig, setImgAnchoOrig] = useState(3840);
  const [imgAltoOrig, setImgAltoOrig] = useState(2160);
  const [imgPesoOrigKb, setImgPesoOrigKb] = useState(3120);
  const [imgCalidadWebp, setImgCalidadWebp] = useState(82);

  const optimizacionWebp = simularOptimizacionPillowWebp(
    imgAnchoOrig,
    imgAltoOrig,
    imgPesoOrigKb,
    1600,
    900,
    imgCalidadWebp
  );

  const slugsExistentes = noticias.map((n) => n.slug);
  const noticiaEnEdicion = noticias.find((n) => n.id === editandoId);
  const slugGenerado = generarSlugUnico(
    titulo || 'nueva-noticia-tecnologica',
    slugsExistentes,
    noticiaEnEdicion?.slug
  );

  const iniciarEdicion = (item: NoticiaItem) => {
    setEditandoId(item.id);
    setTitulo(item.titulo);
    setBajada(item.bajada);
    setContenido(item.contenido);
    setCategoriaSlug(item.categoriaSlug);
    setEtiquetasInput(item.etiquetas.join(', '));
    setEstado(item.estado);
    setNivelDestacado(item.nivelDestacado);
    setFechaPublicacion(item.fechaPublicacion.slice(0, 16));
    setMetaTitle(item.metaTitle);
    setMetaDescription(item.metaDescription);
    setErrorFormulario('');
    setMensajeGuardado('');
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setTitulo('');
    setBajada('');
    setContenido(
      '<p>Escribe el cuerpo de la noticia con formato Rich Text (CKEditor 5)...</p>'
    );
    setCategoriaSlug(categorias[0].slug);
    setEtiquetasInput('Hardware, IA, Semiconductores');
    setEstado(usuarioActivo.rol === 'REDACTOR' ? 'BORRADOR' : 'PUBLICADO');
    setNivelDestacado('NORMAL');
    setFechaPublicacion('2026-11-14T06:00');
    setMetaTitle('');
    setMetaDescription('');
    setErrorFormulario('');
  };

  const insertarEtiquetaRichText = (tagHtml: string) => {
    setContenido((prev) => `${prev}\n${tagHtml}`);
  };

  const handleSubmitNoticia = (e: React.FormEvent) => {
    e.preventDefault();
    if (titulo.trim().length < 12) {
      setErrorFormulario(
        'Validación MinLengthValidator(12): El título debe tener al menos 12 caracteres.'
      );
      return;
    }
    if (!bajada.trim()) {
      setErrorFormulario('La bajada o resumen periodístico es obligatoria.');
      return;
    }

    // Verificar permisos RBAC si intenta publicar directamente siendo REDACTOR
    const estadoFinal: EstadoPublicacion =
      usuarioActivo.rol === 'REDACTOR' && estado === 'PUBLICADO'
        ? 'BORRADOR'
        : estado;

    const catObj =
      categorias.find((c) => c.slug === categoriaSlug) || categorias[0];

    const etiquetasLimpias = etiquetasInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const nuevaNoticia: NoticiaItem = {
      id: editandoId || `not-${Date.now()}`,
      titulo: titulo.trim(),
      slug: slugGenerado,
      bajada: bajada.trim(),
      contenido,
      categoriaSlug: catObj.slug,
      categoriaNombre: catObj.nombre,
      etiquetas: etiquetasLimpias.length ? etiquetasLimpias : ['Tecnología'],
      autor: noticiaEnEdicion ? noticiaEnEdicion.autor : usuarioActivo,
      imagenUrl:
        noticiaEnEdicion?.imagenUrl ||
        '/src/assets/images/article_software_architecture_1794665548644.jpg',
      imagenAlt: titulo.trim(),
      epigrafe: `Fotografía procesada automáticamente por Pillow a WebP (${optimizacionWebp.anchoFinal}x${optimizacionWebp.altoFinal}px).`,
      estado: estadoFinal,
      nivelDestacado,
      fechaPublicacion: new Date(fechaPublicacion).toISOString(),
      tiempoLecturaMinutos: calcularTiempoLectura(contenido),
      vistas: noticiaEnEdicion?.vistas || 1,
      metaTitle: (metaTitle.trim() || titulo.trim()).slice(0, 70),
      metaDescription: (metaDescription.trim() || bajada.trim()).slice(0, 160),
      webpPesoOriginalKb: imgPesoOrigKb,
      webpPesoOptimizadoKb: optimizacionWebp.pesoWebpKb,
      dimensionesWebp: `${optimizacionWebp.anchoFinal}x${optimizacionWebp.altoFinal}`,
    };

    onGuardarNoticia(nuevaNoticia, !editandoId, usuarioActivo);
    setErrorFormulario('');
    setMensajeGuardado(
      `Noticia "${nuevaNoticia.titulo.slice(0, 42)}..." guardada en estado ${nuevaNoticia.estado} y auditada en HistoricalRecords.`
    );
    if (!editandoId) {
      limpiarFormulario();
    }
  };

  const sitemapXmlPreview = generarSitemapXml(
    'https://www.diariotech.com',
    noticias.filter((n) => n.estado === 'PUBLICADO'),
    categorias.map((c) => c.slug)
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Cabecera del Panel Editorial + Selector de Rol RBAC */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 mb-8 border-b border-[#D6CEBE]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#9A3412] font-semibold mb-1">
            Panel de Administración Editorial · Django Admin Personalizado
          </div>
          <h1 className="text-3xl font-editorial font-semibold text-[#1C1917]">
            Gestión de Contenidos, Auditoría y Publicidad
          </h1>
        </div>

        {/* Selector de Sesión de Usuario para probar RBAC (Administrador vs Editor vs Redactor) */}
        <div className="p-3.5 bg-[#F7F4EE] border border-[#D6CEBE] rounded flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
            <ShieldCheck className="w-4 h-4 text-[#9A3412]" />
            <span>Simulador RBAC (AUTH_USER_MODEL):</span>
          </div>
          <label htmlFor="selector-rbac" className="sr-only">
            Seleccionar usuario y rol activo
          </label>
          <select
            id="selector-rbac"
            value={usuarioActivoId}
            onChange={(e) => setUsuarioActivoId(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
          >
            {autores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre} — Rol: {a.rol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sub-navegación del Panel Editorial */}
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-[#EBE6DF] pb-4">
        <button
          type="button"
          onClick={() => setSubTab('noticias')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
            subTab === 'noticias'
              ? 'bg-[#1C1917] text-[#FBF9F5]'
              : 'bg-[#F7F4EE] text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>CRUD Noticias, Rich Text &amp; Pillow WebP ({noticias.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('auditoria')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
            subTab === 'auditoria'
              ? 'bg-[#1C1917] text-[#FBF9F5]'
              : 'bg-[#F7F4EE] text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Auditoría django-simple-history ({auditoria.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('publicidad')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
            subTab === 'publicidad'
              ? 'bg-[#1C1917] text-[#FBF9F5]'
              : 'bg-[#F7F4EE] text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Banners Publicitarios ({banners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('newsletter')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
            subTab === 'newsletter'
              ? 'bg-[#1C1917] text-[#FBF9F5]'
              : 'bg-[#F7F4EE] text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Suscriptores &amp; Webhook API ({suscriptores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('seo')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
            subTab === 'seo'
              ? 'bg-[#1C1917] text-[#FBF9F5]'
              : 'bg-[#F7F4EE] text-[#57534E] hover:text-[#1C1917]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>SEO, Sitemap.xml &amp; Backup MySQL</span>
        </button>
      </div>

      {/* TAB 1: CRUD DE NOTICIAS + CKEDITOR 5 + OPTIMIZADOR PILLOW WEBP */}
      {subTab === 'noticias' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Formulario Editorial */}
          <form
            onSubmit={handleSubmitNoticia}
            className="lg:col-span-7 p-6 bg-[#F7F4EE] border border-[#D6CEBE] rounded space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D6CEBE]">
              <h2 className="text-xl font-editorial font-semibold text-[#1C1917]">
                {editandoId ? 'Editar Artículo Existente' : 'Redactar Nueva Noticia Tecnológica'}
              </h2>
              {editandoId && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="text-xs font-semibold text-[#9A3412] hover:underline"
                >
                  + Crear nueva nota
                </button>
              )}
            </div>

            {mensajeGuardado && (
              <div className="p-3 bg-white border border-[#14532D]/40 rounded text-xs text-[#14532D] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{mensajeGuardado}</span>
              </div>
            )}

            {errorFormulario && (
              <div className="p-3 bg-white border border-[#9A3412] rounded text-xs text-[#9A3412] font-medium">
                {errorFormulario}
              </div>
            )}

            <div>
              <label
                htmlFor="input-titulo-noticia"
                className="block text-xs font-semibold text-[#1C1917] mb-1"
              >
                Título de la Noticia (mínimo 12 caracteres) *
              </label>
              <input
                id="input-titulo-noticia"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Nueva Arquitectura de Memoria HBM4e con Interconexión Óptica"
                className="w-full px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
              />
              <div className="mt-1 text-[11px] font-mono text-[#737373]">
                SlugField único autogenerado: <span className="text-[#1C1917]">/noticia/{slugGenerado}/</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="select-categoria"
                  className="block text-xs font-semibold text-[#1C1917] mb-1"
                >
                  Categoría Principal
                </label>
                <select
                  id="select-categoria"
                  value={categoriaSlug}
                  onChange={(e) => setCategoriaSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
                >
                  {categorias.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="select-estado"
                  className="block text-xs font-semibold text-[#1C1917] mb-1"
                >
                  Estado de Publicación
                </label>
                <select
                  id="select-estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoPublicacion)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
                >
                  <option value="BORRADOR">Borrador (En Redacción)</option>
                  <option value="PROGRAMADO">Programado (Fecha/Hora)</option>
                  <option
                    value="PUBLICADO"
                    disabled={usuarioActivo.rol === 'REDACTOR'}
                  >
                    Publicado {usuarioActivo.rol === 'REDACTOR' ? '(Requiere Editor/Admin)' : ''}
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="select-jerarquia"
                  className="block text-xs font-semibold text-[#1C1917] mb-1"
                >
                  Jerarquía en Portada
                </label>
                <select
                  id="select-jerarquia"
                  value={nivelDestacado}
                  onChange={(e) => setNivelDestacado(e.target.value as NivelDestacado)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
                >
                  <option value="NORMAL">Noticia Estándar</option>
                  <option value="SECUNDARIA">Destacada Secundaria</option>
                  <option value="HERO">Principal de Portada (Hero)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="input-etiquetas"
                  className="block text-xs font-semibold text-[#1C1917] mb-1"
                >
                  Etiquetas (ManyToManyField separadas por coma)
                </label>
                <input
                  id="input-etiquetas"
                  type="text"
                  value={etiquetasInput}
                  onChange={(e) => setEtiquetasInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
                />
              </div>

              <div>
                <label
                  htmlFor="input-fecha-pub"
                  className="block text-xs font-semibold text-[#1C1917] mb-1"
                >
                  Fecha y Hora de Publicación
                </label>
                <input
                  id="input-fecha-pub"
                  type="datetime-local"
                  value={fechaPublicacion}
                  onChange={(e) => setFechaPublicacion(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="textarea-bajada"
                className="block text-xs font-semibold text-[#1C1917] mb-1"
              >
                Bajada / Resumen Periodístico (máx. 420 caracteres) *
              </label>
              <textarea
                id="textarea-bajada"
                rows={2}
                value={bajada}
                onChange={(e) => setBajada(e.target.value)}
                placeholder="Resumen ejecutivo que aparece debajo del titular y en las tarjetas de portada..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
              />
            </div>

            {/* Editor Rich Text (CKEditor 5 config="editorial_completo") */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="textarea-contenido"
                  className="text-xs font-semibold text-[#1C1917]"
                >
                  Contenido Rich Text (CKEditor5Field · Tiempo estimado: {calcularTiempoLectura(contenido)} min)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertarEtiquetaRichText('<h2>Subtítulo de Sección Técnica</h2>')}
                    className="px-2 py-1 text-[11px] font-mono bg-white border border-[#D6CEBE] rounded hover:bg-[#EBE6DF]"
                  >
                    + H2
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertarEtiquetaRichText(
                        '<blockquote>«Cita destacada del equipo de ingeniería.»</blockquote>'
                      )
                    }
                    className="px-2 py-1 text-[11px] font-mono bg-white border border-[#D6CEBE] rounded hover:bg-[#EBE6DF]"
                  >
                    + Cita
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertarEtiquetaRichText(
                        '<p><code>SELECT * FROM noticias_noticia USE INDEX (idx_noticia_estado_fecha);</code></p>'
                      )
                    }
                    className="px-2 py-1 text-[11px] font-mono bg-white border border-[#D6CEBE] rounded hover:bg-[#EBE6DF]"
                  >
                    + Código
                  </button>
                </div>
              </div>
              <textarea
                id="textarea-contenido"
                rows={5}
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#D6CEBE] rounded text-[#1C1917]"
              />
            </div>

            {/* Simulador de Optimización Pillow -> WebP en save() */}
            <div className="p-4 bg-white border border-[#D6CEBE] rounded space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#9A3412]" />
                  <span>Pipeline Pillow en Noticia.save(): Conversión Automática a WebP</span>
                </span>
                <span className="text-xs font-mono text-[#14532D] font-semibold">
                  Ahorro: -{optimizacionWebp.ahorroPorcentaje}% ({optimizacionWebp.pesoWebpKb} KB)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label htmlFor="img-w" className="block text-[11px] text-[#737373]">
                    Ancho orig. (px)
                  </label>
                  <input
                    id="img-w"
                    type="number"
                    value={imgAnchoOrig}
                    onChange={(e) => setImgAnchoOrig(Number(e.target.value) || 1600)}
                    className="w-full px-2 py-1 font-mono border border-[#D6CEBE] rounded"
                  />
                </div>
                <div>
                  <label htmlFor="img-h" className="block text-[11px] text-[#737373]">
                    Alto orig. (px)
                  </label>
                  <input
                    id="img-h"
                    type="number"
                    value={imgAltoOrig}
                    onChange={(e) => setImgAltoOrig(Number(e.target.value) || 900)}
                    className="w-full px-2 py-1 font-mono border border-[#D6CEBE] rounded"
                  />
                </div>
                <div>
                  <label htmlFor="img-kb" className="block text-[11px] text-[#737373]">
                    Peso orig. (KB)
                  </label>
                  <input
                    id="img-kb"
                    type="number"
                    value={imgPesoOrigKb}
                    onChange={(e) => setImgPesoOrigKb(Number(e.target.value) || 1000)}
                    className="w-full px-2 py-1 font-mono border border-[#D6CEBE] rounded"
                  />
                </div>
                <div>
                  <label htmlFor="img-q" className="block text-[11px] text-[#737373]">
                    Calidad WebP (%)
                  </label>
                  <input
                    id="img-q"
                    type="number"
                    min={50}
                    max={95}
                    value={imgCalidadWebp}
                    onChange={(e) => setImgCalidadWebp(Number(e.target.value) || 82)}
                    className="w-full px-2 py-1 font-mono border border-[#D6CEBE] rounded"
                  />
                </div>
              </div>
              <div className="text-[11px] font-mono text-[#57534E]">
                Salida Pillow LANCZOS: {optimizacionWebp.anchoFinal}x{optimizacionWebp.altoFinal}px · Formato WEBP · Archivo: {slugGenerado.slice(0, 28)}.webp
              </div>
            </div>

            {/* Campos SEO personalizados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="input-meta-title"
                  className="block text-xs font-semibold text-[#1C1917] mb-1"
                >
                  Meta Title SEO (máx. 70 chars)
                </label>
                <input
                  id="input-meta-title"
                  type="text"
                  maxLength={70}
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="Opcional: por defecto usa el título"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#D6CEBE] rounded"
                />
              </div>
              <div>
                <label
                  htmlFor="input-meta-desc"
                  className="block text-xs font-semibold text-[#1C1917] mb-1"
                >
                  Meta Description SEO (máx. 160 chars)
                </label>
                <input
                  id="input-meta-desc"
                  type="text"
                  maxLength={160}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Opcional: por defecto usa la bajada"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#D6CEBE] rounded"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-[#9A3412] rounded transition-colors inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>
                {editandoId
                  ? 'Guardar Cambios y Registrar en HistoricalRecords'
                  : 'Guardar Noticia y Ejecutar Optimización WebP'}
              </span>
            </button>
          </form>

          {/* Listado de Noticias en Base de Datos con Control RBAC */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C1917]">
              <h2 className="text-xl font-editorial font-semibold text-[#1C1917]">
                Artículos en MySQL ({noticias.length})
              </h2>
              <span className="text-xs font-mono text-[#737373]">
                Rol activo: {usuarioActivo.rol}
              </span>
            </div>

            <div className="divide-y divide-[#EBE6DF] border border-[#EBE6DF] rounded bg-white">
              {noticias.map((n) => {
                const puedeEditar = verificarPermisoEditorial(
                  usuarioActivo.rol,
                  usuarioActivo.id,
                  n.autor.id,
                  'editar'
                );
                const puedeEliminar = verificarPermisoEditorial(
                  usuarioActivo.rol,
                  usuarioActivo.id,
                  n.autor.id,
                  'eliminar'
                );

                return (
                  <div key={n.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#737373]">
                      <span>
                        <strong className="text-[#1C1917]">{n.estado}</strong> · {n.nivelDestacado} · {n.categoriaNombre}
                      </span>
                      <span className="font-mono">{n.webpPesoOptimizadoKb} KB WebP</span>
                    </div>

                    <h3 className="text-sm font-editorial font-semibold text-[#1C1917] leading-snug">
                      {n.titulo}
                    </h3>

                    <div className="flex items-center justify-between pt-2 text-xs">
                      <span className="text-[#57534E]">Autor: {n.autor.nombre}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!puedeEditar}
                          onClick={() => iniciarEdicion(n)}
                          className={`px-2.5 py-1 rounded border text-xs font-medium ${
                            puedeEditar
                              ? 'border-[#D6CEBE] text-[#1C1917] hover:bg-[#F7F4EE]'
                              : 'border-[#EBE6DF] text-[#737373] opacity-50 cursor-not-allowed'
                          }`}
                        >
                          Editar
                        </button>
                        {puedeEliminar && (
                          <button
                            type="button"
                            aria-label={`Eliminar ${n.titulo}`}
                            onClick={() => onEliminarNoticia(n.id, usuarioActivo)}
                            className="p-1 text-[#9A3412] hover:bg-[#9A3412]/10 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDITORÍA DE CAMBIOS (DJANGO-SIMPLE-HISTORY) */}
      {subTab === 'auditoria' && (
        <div className="bg-white border border-[#D6CEBE] rounded overflow-hidden">
          <div className="p-5 bg-[#F7F4EE] border-b border-[#D6CEBE] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-editorial font-semibold text-[#1C1917]">
                Bitácora de Auditoría Histórica (HistoricalRecords)
              </h2>
              <p className="text-xs text-[#57534E]">
                Trazabilidad automática generada por <code>simple_history.middleware.HistoryRequestMiddleware</code> en tablas <code>noticias_historicalnoticia</code>.
              </p>
            </div>
            <span className="text-xs font-mono text-[#737373]">
              Total eventos: {auditoria.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EBE6DF] bg-[#FBF9F5] text-[#737373] font-mono">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Modelo / Objeto</th>
                  <th className="py-3 px-4">Usuario / Rol</th>
                  <th className="py-3 px-4">Detalle de Auditoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DF]">
                {auditoria.map((reg) => (
                  <tr key={reg.id} className="hover:bg-[#F7F4EE]/50">
                    <td className="py-3 px-4 font-mono whitespace-nowrap">{reg.fecha}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {reg.tipoCambio === '+'
                        ? '+ CREATE'
                        : reg.tipoCambio === '~'
                        ? '~ UPDATE'
                        : '- DELETE'}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#1C1917]">
                      {reg.modelo}: {reg.objetoTitulo}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {reg.usuario} <span className="font-mono text-[#737373]">({reg.rolUsuario})</span>
                    </td>
                    <td className="py-3 px-4 text-[#57534E]">{reg.motivoCambio}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GESTIÓN DE ESPACIOS PUBLICITARIOS Y BANNERS */}
      {subTab === 'publicidad' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((ban) => {
              const ctr =
                ban.impresiones > 0
                  ? ((ban.clics / ban.impresiones) * 100).toFixed(2)
                  : '0.00';
              return (
                <div
                  key={ban.id}
                  className="p-6 bg-white border border-[#D6CEBE] rounded flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#737373] font-mono mb-2">
                      <span>Slot: {ban.ubicacion} ({ban.dimensiones})</span>
                      <span>Estado: {ban.activo ? 'ACTIVO' : 'PAUSADO'}</span>
                    </div>
                    <h3 className="text-xl font-editorial font-semibold text-[#1C1917] mb-1">
                      {ban.tituloCampana}
                    </h3>
                    <p className="text-xs text-[#57534E]">
                      Anunciante: <strong>{ban.anunciante}</strong> · Vigencia: {ban.fechaInicio} al {ban.fechaFin}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-3 border-y border-[#EBE6DF] font-mono text-xs">
                    <div>
                      <div className="text-[#737373] text-[11px]">Impresiones</div>
                      <div className="font-semibold text-[#1C1917]">
                        {ban.impresiones.toLocaleString('es-ES')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#737373] text-[11px]">Clics (F() atomic)</div>
                      <div className="font-semibold text-[#1C1917]">
                        {ban.clics.toLocaleString('es-ES')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#737373] text-[11px]">CTR %</div>
                      <div className="font-semibold text-[#9A3412]">{ctr}%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-[#737373] truncate max-w-[260px]">
                      {ban.urlDestino}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleBanner(ban.id)}
                      className="px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] rounded hover:bg-[#F7F4EE]"
                    >
                      {ban.activo ? 'Pausar Banner' : 'Activar Banner'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: SUSCRIPTORES NEWSLETTER Y LOG DE WEBHOOK */}
      {subTab === 'newsletter' && (
        <div className="bg-white border border-[#D6CEBE] rounded overflow-hidden">
          <div className="p-5 bg-[#F7F4EE] border-b border-[#D6CEBE]">
            <h2 className="text-xl font-editorial font-semibold text-[#1C1917]">
              Suscriptores Capturados y Estado de Sincronización API Externa
            </h2>
            <p className="text-xs text-[#57534E]">
              Modelo <code>newsletter.Suscriptor</code> + bitácora <code>LogSincronizacionNewsletter</code> (Brevo / Mailchimp Webhook).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#EBE6DF] bg-[#FBF9F5] text-[#737373] font-mono">
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-4">Intereses</th>
                  <th className="py-3 px-4">Estado Sync API</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Fecha Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6DF]">
                {suscriptores.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-mono font-medium text-[#1C1917]">{s.email}</td>
                    <td className="py-3 px-4">{s.nombre || '—'}</td>
                    <td className="py-3 px-4">{s.categoriasInteres.join(' · ')}</td>
                    <td className="py-3 px-4 font-mono text-[#14532D]">{s.estadoSincronizacion}</td>
                    <td className="py-3 px-4 font-mono">{s.proveedor}</td>
                    <td className="py-3 px-4 font-mono text-[#737373]">{s.creadoEn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SITEMAP.XML, ROBOTS.TXT Y COMANDO DE BACKUP MYSQL */}
      {subTab === 'seo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-5 bg-[#1C1917] text-[#FBF9F5] rounded border border-[#292524]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono font-semibold text-[#D6CEBE]">
                Vista Dinámica: /sitemap.xml (django.contrib.sitemaps)
              </h3>
              <span className="text-xs font-mono text-[#737373]">XML 0.9</span>
            </div>
            <pre className="text-xs font-mono text-[#EBE6DF] overflow-x-auto max-h-80 leading-relaxed">
              {sitemapXmlPreview}
            </pre>
          </div>

          <div className="p-5 bg-[#1C1917] text-[#FBF9F5] rounded border border-[#292524] space-y-6">
            <div>
              <h3 className="text-sm font-mono font-semibold text-[#D6CEBE] mb-2">
                Vista Dinámica: /robots.txt
              </h3>
              <pre className="text-xs font-mono text-[#EBE6DF] overflow-x-auto leading-relaxed">
{`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /usuarios/login/
Disallow: /busqueda/?q=*

Sitemap: https://www.diariotech.com/sitemap.xml`}
              </pre>
            </div>

            <div className="pt-4 border-t border-[#292524]">
              <h3 className="text-sm font-mono font-semibold text-[#D6CEBE] mb-2">
                Management Command: python manage.py backup_diario
              </h3>
              <pre className="text-xs font-mono text-[#EBE6DF] overflow-x-auto leading-relaxed">
{`$ python manage.py backup_diario --retencion=14
[OK] Dump MySQL 8.0 (--single-transaction --routines):
     backups/db_diario_tech_20261114_0600.sql.gz (14.2 MB)
[OK] Empaquetado carpeta media/ (imágenes WebP):
     backups/media_diario_tech_20261114_0600.tar.gz (86.4 MB)
[OK] Purga de backups antiguos (>14 días): 2 archivos eliminados.`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
