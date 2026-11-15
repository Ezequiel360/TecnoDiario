import React, { useState } from 'react';
import { Copy, Check, FileCode, Shield } from 'lucide-react';
import {
  ARCHIVOS_FASE_1,
  ARCHIVOS_FASE_2,
  ARCHIVOS_FASE_3,
  ARCHIVOS_FASE_4,
} from '../data/phase1DjangoCode';
import { obtenerMatrizGruposRbac } from '../utils/editorialLogic';

export const DjangoPhase1Explorer: React.FC = () => {
  const [faseSeleccionada, setFaseSeleccionada] = useState<
    'fase4' | 'fase3' | 'fase2' | 'fase1'
  >('fase4');

  const listaArchivos =
    faseSeleccionada === 'fase4'
      ? ARCHIVOS_FASE_4
      : faseSeleccionada === 'fase3'
      ? ARCHIVOS_FASE_3
      : faseSeleccionada === 'fase2'
      ? ARCHIVOS_FASE_2
      : ARCHIVOS_FASE_1;

  const [archivoActivoId, setArchivoActivoId] = useState<string>(
    ARCHIVOS_FASE_4[0].id
  );
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const archivoActivo =
    listaArchivos.find((a) => a.id === archivoActivoId) || listaArchivos[0];

  const matrizRbac = obtenerMatrizGruposRbac();

  const handleCambiarFase = (
    nuevaFase: 'fase4' | 'fase3' | 'fase2' | 'fase1'
  ) => {
    setFaseSeleccionada(nuevaFase);
    setArchivoActivoId(
      nuevaFase === 'fase4'
        ? ARCHIVOS_FASE_4[0].id
        : nuevaFase === 'fase3'
        ? ARCHIVOS_FASE_3[0].id
        : nuevaFase === 'fase2'
        ? ARCHIVOS_FASE_2[0].id
        : ARCHIVOS_FASE_1[0].id
    );
  };

  const handleCopiar = (id: string, texto: string) => {
    navigator.clipboard?.writeText(texto);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#D6CEBE]">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#9A3412] font-semibold mb-1">
            Proyecto Completo Finalizado · Arquitectura Django 5.1 + MySQL 8.0
          </div>
          <h1 className="text-3xl font-editorial font-semibold text-[#1C1917] mb-2">
            Explorador de Código de Producción: Fases 1, 2, 3 y 4
          </h1>
          <p className="text-sm text-[#57534E] max-w-3xl">
            Inspecciona el código completo de las 4 fases: <strong>Fase 4</strong> (Templates DTL con HTML5, TailwindCSS y OpenGraph dinámico), <strong>Fase 3</strong> (<code>views.py</code>, <code>urls.py</code>, <code>sitemaps.py</code>), <strong>Fase 2</strong> (<code>admin.py</code>, RBAC y Backups) y <strong>Fase 1</strong> (<code>settings.py</code> y <code>models.py</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleCambiarFase('fase4')}
            className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
              faseSeleccionada === 'fase4'
                ? 'bg-[#1C1917] text-[#FBF9F5]'
                : 'bg-[#F7F4EE] text-[#57534E] border border-[#D6CEBE]'
            }`}
          >
            Entregables Fase 4 (Templates)
          </button>
          <button
            type="button"
            onClick={() => handleCambiarFase('fase3')}
            className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
              faseSeleccionada === 'fase3'
                ? 'bg-[#1C1917] text-[#FBF9F5]'
                : 'bg-[#F7F4EE] text-[#57534E] border border-[#D6CEBE]'
            }`}
          >
            Entregables Fase 3
          </button>
          <button
            type="button"
            onClick={() => handleCambiarFase('fase2')}
            className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
              faseSeleccionada === 'fase2'
                ? 'bg-[#1C1917] text-[#FBF9F5]'
                : 'bg-[#F7F4EE] text-[#57534E] border border-[#D6CEBE]'
            }`}
          >
            Entregables Fase 2
          </button>
          <button
            type="button"
            onClick={() => handleCambiarFase('fase1')}
            className={`px-4 py-2 text-xs font-medium rounded transition-colors ${
              faseSeleccionada === 'fase1'
                ? 'bg-[#1C1917] text-[#FBF9F5]'
                : 'bg-[#F7F4EE] text-[#57534E] border border-[#D6CEBE]'
            }`}
          >
            Entregables Fase 1
          </button>
        </div>
      </div>

      {/* Matriz de Grupos y Permisos RBAC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {matrizRbac.map((item) => (
          <div
            key={item.grupo}
            className="p-5 bg-[#F7F4EE] border border-[#EBE6DF] rounded flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#1C1917] mb-2">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#9A3412]" />
                  <span>Grupo: {item.grupo}</span>
                </span>
                <span className="font-mono text-[#9A3412]">
                  {item.totalPermisos} permisos
                </span>
              </div>
              <p className="text-xs text-[#57534E] leading-relaxed mb-3">
                {item.aislamientoQueryset}
              </p>
            </div>
            <div className="pt-3 border-t border-[#EBE6DF] text-[11px] font-mono text-[#737373]">
              Permisos: {item.permisosClave.slice(0, 4).join(' · ')}
            </div>
          </div>
        ))}
      </div>

      {/* Selector de Archivos de la Fase Activa */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {listaArchivos.map((arch) => (
          <button
            key={arch.id}
            type="button"
            onClick={() => setArchivoActivoId(arch.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded transition-colors ${
              archivoActivo.id === arch.id
                ? 'bg-[#1C1917] text-[#FBF9F5]'
                : 'bg-[#F7F4EE] text-[#57534E] hover:text-[#1C1917] border border-[#D6CEBE]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{arch.titulo}</span>
          </button>
        ))}
      </div>

      {/* Visor de Código Fuente */}
      <div className="bg-[#1C1917] text-[#FBF9F5] rounded border border-[#292524] overflow-hidden">
        <div className="px-5 py-3.5 bg-[#292524] border-b border-[#3F3A36] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#D6CEBE] font-semibold">
              {archivoActivo.ruta}
            </div>
            <div className="text-xs text-[#A8A29E] mt-0.5">
              {archivoActivo.resumen}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopiar(archivoActivo.id, archivoActivo.contenido)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#1C1917] text-[#FBF9F5] border border-[#57534E] rounded hover:border-[#D6CEBE] transition-colors"
          >
            {copiadoId === archivoActivo.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Código copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar archivo</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-6 text-xs font-mono text-[#EBE6DF] overflow-x-auto leading-relaxed max-h-[640px]">
          {archivoActivo.contenido}
        </pre>
      </div>
    </div>
  );
};
