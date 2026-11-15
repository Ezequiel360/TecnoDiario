import React, { useState } from 'react';
import {
  AUTORES_INICIALES,
  AUDITORIA_INICIAL,
  BANNERS_INICIALES,
  CATEGORIAS_INICIALES,
  NOTICIAS_INICIALES,
  SUSCRIPTORES_INICIALES,
  BannerPublicitario,
  SuscriptorItem,
} from './data/seedArticles';
import {
  AutorEditorial,
  NoticiaItem,
  RegistroAuditoria,
} from './utils/editorialLogic';
import { PublicPortalView } from './components/PublicPortalView';
import { AdminEditorialView } from './components/AdminEditorialView';
import { DjangoPhase1Explorer } from './components/DjangoPhase1Explorer';

export default function App() {
  const [vistaActiva, setVistaActiva] = useState<'public' | 'admin' | 'fase1'>(
    'public'
  );
  const [noticias, setNoticias] = useState<NoticiaItem[]>(NOTICIAS_INICIALES);
  const [banners, setBanners] = useState<BannerPublicitario[]>(BANNERS_INICIALES);
  const [suscriptores, setSuscriptores] = useState<SuscriptorItem[]>(
    SUSCRIPTORES_INICIALES
  );
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>(
    AUDITORIA_INICIAL
  );

  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas');
  const [noticiaDetalle, setNoticiaDetalle] = useState<NoticiaItem | null>(null);

  const handleNavegarSeccion = (slug: string) => {
    setVistaActiva('public');
    setCategoriaActiva(slug);
    setNoticiaDetalle(null);
  };

  const handleSelectNoticia = (noticia: NoticiaItem | null) => {
    if (noticia) {
      setNoticias((prev) =>
        prev.map((n) =>
          n.id === noticia.id ? { ...n, vistas: n.vistas + 1 } : n
        )
      );
      setNoticiaDetalle({ ...noticia, vistas: noticia.vistas + 1 });
    } else {
      setNoticiaDetalle(null);
    }
  };

  const handleGuardarNoticia = (
    noticiaGuardada: NoticiaItem,
    esNueva: boolean,
    usuarioActivo: AutorEditorial
  ) => {
    setNoticias((prev) => {
      let listaActualizada = esNueva
        ? [noticiaGuardada, ...prev]
        : prev.map((n) => (n.id === noticiaGuardada.id ? noticiaGuardada : n));

      // Si se marca como HERO y PUBLICADO, las demás HERO pasan a SECUNDARIA
      if (
        noticiaGuardada.nivelDestacado === 'HERO' &&
        noticiaGuardada.estado === 'PUBLICADO'
      ) {
        listaActualizada = listaActualizada.map((n) =>
          n.id !== noticiaGuardada.id && n.nivelDestacado === 'HERO'
            ? { ...n, nivelDestacado: 'SECUNDARIA' }
            : n
        );
      }
      return listaActualizada;
    });

    const nuevoAudit: RegistroAuditoria = {
      id: `aud-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
      modelo: 'Noticia',
      objetoId: noticiaGuardada.id,
      objetoTitulo: `${noticiaGuardada.titulo.slice(0, 52)}...`,
      tipoCambio: esNueva ? '+' : '~',
      usuario: usuarioActivo.nombre,
      rolUsuario: usuarioActivo.rol,
      motivoCambio: `${
        esNueva ? 'Creación' : 'Edición'
      } en estado ${noticiaGuardada.estado} · Imagen optimizada a WebP (${
        noticiaGuardada.webpPesoOptimizadoKb
      } KB).`,
    };
    setAuditoria((prev) => [nuevoAudit, ...prev]);
  };

  const handleEliminarNoticia = (id: string, usuarioActivo: AutorEditorial) => {
    const objetivo = noticias.find((n) => n.id === id);
    if (!objetivo) return;
    setNoticias((prev) => prev.filter((n) => n.id !== id));
    const nuevoAudit: RegistroAuditoria = {
      id: `aud-${Date.now()}`,
      fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
      modelo: 'Noticia',
      objetoId: id,
      objetoTitulo: objetivo.titulo.slice(0, 52),
      tipoCambio: '-',
      usuario: usuarioActivo.nombre,
      rolUsuario: usuarioActivo.rol,
      motivoCambio: 'Eliminación física ejecutada por Administrador.',
    };
    setAuditoria((prev) => [nuevoAudit, ...prev]);
  };

  const handleSuscribirNewsletter = (
    email: string,
    nombre: string,
    categoriasInteres: string[]
  ) => {
    const nuevoSuscriptor: SuscriptorItem = {
      id: `sus-${Date.now()}`,
      email,
      nombre,
      categoriasInteres,
      estado: 'ACTIVO',
      estadoSincronizacion: 'SINCRONIZADO',
      proveedor: 'Brevo API v3',
      creadoEn: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setSuscriptores((prev) => [nuevoSuscriptor, ...prev]);
    setAuditoria((prev) => [
      {
        id: `aud-${Date.now()}`,
        fecha: nuevoSuscriptor.creadoEn,
        modelo: 'Suscriptor',
        objetoId: nuevoSuscriptor.id,
        objetoTitulo: email,
        tipoCambio: '+',
        usuario: 'Sistema Público (Webhook)',
        rolUsuario: 'ADMIN',
        motivoCambio: 'Alta de suscriptor y sincronización HTTP 201 con Brevo API v3.',
      },
      ...prev,
    ]);
  };

  const handleRegistrarClicBanner = (bannerId: string) => {
    setBanners((prev) =>
      prev.map((b) =>
        b.id === bannerId ? { ...b, clics: b.clics + 1 } : b
      )
    );
  };

  const handleToggleBanner = (bannerId: string) => {
    setBanners((prev) =>
      prev.map((b) =>
        b.id === bannerId ? { ...b, activo: !b.activo } : b
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* TOP BAR CONTRACT: 1 Fila, 3 Zonas estrictas separadas por gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-[#D6CEBE] bg-[#FBF9F5] max-w-[1200px] w-full mx-auto">
        {/* Zona 1: Marca (1 solo elemento de texto) */}
        <a
          href="#portada"
          onClick={(e) => {
            e.preventDefault();
            handleNavegarSeccion('todas');
          }}
          className="text-xl font-editorial font-bold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0"
        >
          Diario Digital Tecnológico
        </a>

        {/* Zona 2: 5 enlaces de navegación concisos en una sola línea */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-[#57534E]"
        >
          <a
            href="#portada"
            onClick={(e) => {
              e.preventDefault();
              handleNavegarSeccion('todas');
            }}
            className={`hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              vistaActiva === 'public' && categoriaActiva === 'todas'
                ? 'text-[#1C1917] underline'
                : ''
            }`}
          >
            Portada
          </a>
          <a
            href="#hardware"
            onClick={(e) => {
              e.preventDefault();
              handleNavegarSeccion('hardware');
            }}
            className={`hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              vistaActiva === 'public' && categoriaActiva === 'hardware'
                ? 'text-[#1C1917] underline'
                : ''
            }`}
          >
            Hardware
          </a>
          <a
            href="#ia"
            onClick={(e) => {
              e.preventDefault();
              handleNavegarSeccion('ia');
            }}
            className={`hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              vistaActiva === 'public' && categoriaActiva === 'ia'
                ? 'text-[#1C1917] underline'
                : ''
            }`}
          >
            Inteligencia Artificial
          </a>
          <a
            href="#ciberseguridad"
            onClick={(e) => {
              e.preventDefault();
              handleNavegarSeccion('ciberseguridad');
            }}
            className={`hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              vistaActiva === 'public' && categoriaActiva === 'ciberseguridad'
                ? 'text-[#1C1917] underline'
                : ''
            }`}
          >
            Ciberseguridad
          </a>
          <a
            href="#arquitectura-fase-1"
            onClick={(e) => {
              e.preventDefault();
              setVistaActiva('fase1');
            }}
            className={`hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              vistaActiva === 'fase1' ? 'text-[#9A3412] font-semibold underline' : ''
            }`}
          >
            Código Fase 1
          </a>
        </nav>

        {/* Zona 3: 1 Acción Primaria */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() =>
              setVistaActiva((prev) => (prev === 'admin' ? 'public' : 'admin'))
            }
            className="px-4 py-2 text-xs font-medium text-[#FBF9F5] bg-[#1C1917] rounded hover:bg-[#9A3412] transition-colors whitespace-nowrap shrink-0"
          >
            {vistaActiva === 'admin' ? 'Volver al Diario' : 'Panel Editorial'}
          </button>
        </div>
      </header>

      {/* Selector de vista rápido en pantallas móviles */}
      <div className="md:hidden flex items-center justify-between gap-2 px-6 py-2.5 bg-[#F7F4EE] border-b border-[#EBE6DF] text-xs">
        <button
          type="button"
          onClick={() => handleNavegarSeccion('todas')}
          className={`font-medium ${
            vistaActiva === 'public' ? 'text-[#9A3412] underline' : 'text-[#57534E]'
          }`}
        >
          Portada Pública
        </button>
        <button
          type="button"
          onClick={() => setVistaActiva('fase1')}
          className={`font-medium ${
            vistaActiva === 'fase1' ? 'text-[#9A3412] underline' : 'text-[#57534E]'
          }`}
        >
          Código Django (Fase 1)
        </button>
        <button
          type="button"
          onClick={() => setVistaActiva('admin')}
          className={`font-medium ${
            vistaActiva === 'admin' ? 'text-[#9A3412] underline' : 'text-[#57534E]'
          }`}
        >
          Admin Editorial
        </button>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1">
        {vistaActiva === 'public' && (
          <PublicPortalView
            noticias={noticias}
            categorias={CATEGORIAS_INICIALES}
            banners={banners}
            categoriaActiva={categoriaActiva}
            onSelectCategoria={(slug) => {
              setCategoriaActiva(slug);
              setNoticiaDetalle(null);
            }}
            noticiaDetalle={noticiaDetalle}
            onSelectNoticia={handleSelectNoticia}
            onSuscribirNewsletter={handleSuscribirNewsletter}
            onRegistrarClicBanner={handleRegistrarClicBanner}
          />
        )}

        {vistaActiva === 'admin' && (
          <AdminEditorialView
            noticias={noticias}
            categorias={CATEGORIAS_INICIALES}
            autores={AUTORES_INICIALES}
            auditoria={auditoria}
            banners={banners}
            suscriptores={suscriptores}
            onGuardarNoticia={handleGuardarNoticia}
            onEliminarNoticia={handleEliminarNoticia}
            onToggleBanner={handleToggleBanner}
          />
        )}

        {vistaActiva === 'fase1' && <DjangoPhase1Explorer />}
      </main>

      {/* PIE DE PÁGINA EDITORIAL */}
      <footer className="mt-16 border-t border-[#D6CEBE] bg-[#F7F4EE]">
        <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-[#57534E]">
          <div>
            <div className="font-editorial font-bold text-base text-[#1C1917] mb-1">
              Diario Digital Tecnológico
            </div>
            <p>
              Edición de Ingeniería, Ciencia de Datos, Semiconductores y Ciberseguridad · Arquitectura Django 5.1 &amp; MySQL 8.0.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavegarSeccion('todas')}
              className="hover:text-[#1C1917] underline decoration-[#D6CEBE]"
            >
              Edición de Portada
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('admin')}
              className="hover:text-[#1C1917] underline decoration-[#D6CEBE]"
            >
              Acceso Redacción (CMS)
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('fase1')}
              className="hover:text-[#1C1917] underline decoration-[#D6CEBE]"
            >
              Entregables Fase 1 (Django + MySQL)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
