import {
  AutorEditorial,
  NoticiaItem,
  RegistroAuditoria,
} from '../utils/editorialLogic';

export interface CategoriaEditorial {
  nombre: string;
  slug: string;
  descripcion: string;
  ordenMenu: number;
}

export interface BannerPublicitario {
  id: string;
  tituloCampana: string;
  anunciante: string;
  ubicacion: 'HEADER_TOP' | 'HOME_MID' | 'SIDEBAR_STICKY' | 'IN_ARTICLE';
  ubicacionLabel: string;
  dimensiones: string;
  ctaTexto: string;
  urlDestino: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  impresiones: number;
  clics: number;
}

export interface SuscriptorItem {
  id: string;
  email: string;
  nombre: string;
  categoriasInteres: string[];
  estado: 'ACTIVO' | 'PENDIENTE' | 'BAJA';
  estadoSincronizacion: 'SINCRONIZADO' | 'PENDIENTE' | 'ERROR';
  proveedor: 'Brevo API v3' | 'Mailchimp Webhook';
  creadoEn: string;
}

export const CATEGORIAS_INICIALES: CategoriaEditorial[] = [
  {
    nombre: 'Hardware',
    slug: 'hardware',
    descripcion: 'Litografía extrema, arquitecturas RISC-V, silicio fotónico y centros de datos.',
    ordenMenu: 1,
  },
  {
    nombre: 'Inteligencia Artificial',
    slug: 'ia',
    descripcion: 'Modelos fundacionales, inferencia distribuida, agentes autónomos y alineamiento.',
    ordenMenu: 2,
  },
  {
    nombre: 'Ciberseguridad',
    slug: 'ciberseguridad',
    descripcion: 'Criptografía post-cuántica, arquitectura Zero-Trust, análisis forense y vulnerabilidades.',
    ordenMenu: 3,
  },
  {
    nombre: 'Desarrollo',
    slug: 'desarrollo',
    descripcion: 'Ingeniería de software, Python, Django 5.x, bases de datos relacionales y sistemas distribuidos.',
    ordenMenu: 4,
  },
  {
    nombre: 'Política Tech',
    slug: 'politica-tech',
    descripcion: 'Soberanía digital, regulación de IA, cadenas de suministro globales y derechos digitales.',
    ordenMenu: 5,
  },
  {
    nombre: 'Deportes / eSports',
    slug: 'esports',
    descripcion: 'Infraestructura competitiva de baja latencia, motores gráficos y ligas electrónicas.',
    ordenMenu: 6,
  },
];

export const AUTORES_INICIALES: AutorEditorial[] = [
  {
    id: 'aut-1',
    nombre: 'Dra. Elena Rostova',
    slug: 'elena-rostova',
    email: 'erostova@diariotech.com',
    rol: 'ADMIN',
    especialidad: 'Física de Semiconductores y Fotónica Integrada',
    biografiaCorta:
      'Doctora en Ingeniería Microelectrónica. Dirige la sección de Hardware y Silicio en Diario Digital Tecnológico.',
    xHandle: 'elena_silicon',
  },
  {
    id: 'aut-2',
    nombre: 'Martín Valdés',
    slug: 'martin-valdes',
    email: 'mvaldes@diariotech.com',
    rol: 'EDITOR',
    especialidad: 'Sistemas Distribuidos, Bases de Datos e IA en Producción',
    biografiaCorta:
      'Arquitecto de software y editor jefe de infraestructura. Especialista en motores relacionales y cómputo de alto rendimiento.',
    xHandle: 'mvaldes_arch',
  },
  {
    id: 'aut-3',
    nombre: 'Sofía Mendizábal',
    slug: 'sofia-mendizabal',
    email: 'smendizabal@diariotech.com',
    rol: 'REDACTOR',
    especialidad: 'Criptografía Post-Cuántica y Seguridad en Kernel Linux',
    biografiaCorta:
      'Investigadora en seguridad ofensiva y protocolos de red. Cubre vulnerabilidades críticas y soberanía tecnológica.',
    xHandle: 'sofia_sec_kernel',
  },
];

export const NOTICIAS_INICIALES: NoticiaItem[] = [
  {
    id: 'not-101',
    titulo: 'El Futuro del Silicio Fotónico: Arquitecturas NPU de 1.4nm que Reemplazan el Cobre por Guías de Onda Ópticas',
    slug: 'el-futuro-del-silicio-fotonico-arquitecturas-npu-1-4nm',
    bajada:
      'Los nuevos interconectores ópticos integrados directamente en el sustrato reducen la disipación térmica en un 68% y multiplican por cuatro el ancho de banda entre clústeres de memoria HBM4.',
    contenido: `<p>Durante la última década, el cuello de botella fundamental de la computación de alto rendimiento dejó de ser la densidad de transistores en la unidad aritmético-lógica para trasladarse al costo energético de mover electrones a través de milímetros de cobre. Con la llegada de los nodos litográficos de 1.4 nanómetros, la industria de semiconductores ha comenzado la transición hacia las interconexiones ópticas co-empaquetadas (CPO).</p>
<h2>Guías de onda de nitruro de silicio en el empaquetado 3D</h2>
<p>En lugar de serializar señales eléctricas que sufren atenuación severa a frecuencias superiores a 112 Gbps, los nuevos aceleradores integran moduladores de anillo de microrresonancia que convierten los pulsos lógicos en haces láser infrarrojos directamente sobre el interposer de silicio. Esto permite alcanzar velocidades de transferencia de hasta 4.8 Terabits por segundo por milímetro de borde de die.</p>
<blockquote>«El tránsito de datos entre la memoria HBM4 y los núcleos tensoriales consumía hasta el 45% del presupuesto energético total del rack; la fotónica integrada reduce esa penalización a menos del 12%», detallan los ingenieros del consorcio europeo de litografía óptica.</blockquote>
<h3>Impacto directo en bases de datos en memoria y motores de inferencia</h3>
<p>Para las arquitecturas de servidores empresariales y clústeres de bases de datos relacionales de misión crítica, esta topología habilita pools de memoria compartida coherente a través de múltiples chasis sin penalización de latencia NUMA.</p>`,
    categoriaSlug: 'hardware',
    categoriaNombre: 'Hardware',
    etiquetas: ['Fotónica', 'Semiconductores', 'HBM4', 'Litografía 1.4nm'],
    autor: AUTORES_INICIALES[0],
    imagenUrl: '/src/assets/images/hero_photonic_silicon_1794665544710.jpg',
    imagenAlt: 'Oblea de silicio fotónico bajo iluminación ámbar en sala limpia de litografía',
    epigrafe: 'Fig. 1 — Inspección interferométrica de guías de onda ópticas sobre oblea de 300mm.',
    estado: 'PUBLICADO',
    nivelDestacado: 'HERO',
    fechaPublicacion: '2026-11-14T05:30:00Z',
    tiempoLecturaMinutos: 6,
    vistas: 18420,
    metaTitle: 'Silicio Fotónico y NPU de 1.4nm: Revolución en Interconexión Óptica',
    metaDescription:
      'Análisis técnico de las nuevas arquitecturas de silicio fotónico de 1.4nm que reducen el consumo térmico un 68% en centros de datos.',
    webpPesoOriginalKb: 2480,
    webpPesoOptimizadoKb: 194,
    dimensionesWebp: '1600x900',
  },
  {
    id: 'not-102',
    titulo: 'Refrigeración Líquida Bifásica y Redes InfiniBand de 800G: Dentro de los Nuevos Centros de Datos de IA Soberana',
    slug: 'refrigeracion-liquida-bifasica-redes-infiniband-800g-ia',
    bajada:
      'Con gabinetes que superan los 120 kW por rack, la ingeniería térmica y el enrutamiento determinista se convierten en la pieza clave para entrenar modelos multimodales sin estrangulamiento.',
    contenido: `<p>El diseño de centros de datos ha experimentado una transformación más profunda en los últimos veinticuatro meses que en las dos décadas previas. Cuando cada nodo de cómputo alberga ocho aceleradores interconectados mediante buses de alta velocidad, la refrigeración por aire forzado alcanza su límite termodinámico.</p>
<h2>Placas frías de contacto directo y fluidos dieléctricos</h2>
<p>Las instalaciones de nueva generación adoptan circuitos primarios y secundarios con placas frías de microcanales de cobre que extraen el calor directamente del encapsulado del procesador y de los módulos ópticos transceptores. El fluido entra a 32 °C y retorna a intercambiadores secos exteriores sin consumo de agua por evaporación.</p>
<p>En el plano de red, las topologías Fat-Tree no bloqueantes de 800 GbE y NDR InfiniBand garantizan que las operaciones colectivas <code>AllReduce</code> completen la sincronización de gradientes en menos de 4 microsegundos entre miles de nodos.</p>`,
    categoriaSlug: 'ia',
    categoriaNombre: 'Inteligencia Artificial',
    etiquetas: ['Data Centers', 'InfiniBand', 'Infraestructura IA', 'Refrigeración Líquida'],
    autor: AUTORES_INICIALES[1],
    imagenUrl: '/src/assets/images/article_ai_agents_1794665546392.jpg',
    imagenAlt: 'Corredor de supercomputadora con refrigeración líquida y cableado de fibra óptica',
    epigrafe: 'Fig. 2 — Colectores verticales de refrigeración líquida directa al chip en pasillo de alta densidad.',
    estado: 'PUBLICADO',
    nivelDestacado: 'SECUNDARIA',
    fechaPublicacion: '2026-11-14T04:15:00Z',
    tiempoLecturaMinutos: 5,
    vistas: 11290,
    metaTitle: 'Refrigeración Líquida Bifásica y Redes 800G en Centros de Datos IA',
    metaDescription:
      'Cómo operan los nuevos centros de datos de 120 kW por rack con refrigeración directa al chip y redes de ultra baja latencia.',
    webpPesoOriginalKb: 1960,
    webpPesoOptimizadoKb: 168,
    dimensionesWebp: '1200x900',
  },
  {
    id: 'not-103',
    titulo: 'Migración a Criptografía Post-Cuántica ML-KEM en Módulos HSM y Túneles TLS 1.3 Bancarios',
    slug: 'migracion-criptografia-post-cuantica-ml-kem-hsm-tls',
    bajada:
      'Los equipos de seguridad financiera adoptan esquemas híbridos basados en retículos cristalinos (NIST FIPS 203) para neutralizar amenazas de captura hoy y desencriptación futura.',
    contenido: `<p>La estandarización definitiva de los algoritmos criptográficos resistentes a computadoras cuánticas por parte del NIST —encabezados por ML-KEM (anteriormente CRYSTALS-Kyber) para el encapsulamiento de claves y ML-DSA (Dilithium) para firmas digitales— ha acelerado el cronograma de actualización en infraestructuras críticas.</p>
<h2>Arquitectura Zero-Trust con atestación en hardware</h2>
<p>La transición no consiste únicamente en recompilar librerías como OpenSSL o BoringSSL. Los Módulos de Seguridad de Hardware (HSM) requieren actualizaciones de firmware firmadas y mayor capacidad de búfer debido a que las claves públicas y textos cifrados en esquemas de retículos superan los 1.184 bytes, frente a los 32 bytes de una curva elíptica X25519 tradicional.</p>
<p>Los arquitectos de red recomiendan implementar intercambios de clave híbridos (<code>X25519MLKEM768</code>) y ajustar las ventanas de congestión iniciales de TCP para evitar fragmentación adicional durante el handshake TLS.</p>`,
    categoriaSlug: 'ciberseguridad',
    categoriaNombre: 'Ciberseguridad',
    etiquetas: ['Post-Cuántica', 'Zero-Trust', 'HSM', 'TLS 1.3'],
    autor: AUTORES_INICIALES[2],
    imagenUrl: '/src/assets/images/article_cybersecurity_zerotrust_1794665547712.jpg',
    imagenAlt: 'Especialista auditando módulo criptográfico HSM en bóveda de seguridad de datos',
    epigrafe: 'Fig. 3 — Verificación física de módulos HSM con soporte nativo para algoritmos FIPS 203 y FIPS 204.',
    estado: 'PUBLICADO',
    nivelDestacado: 'SECUNDARIA',
    fechaPublicacion: '2026-11-13T21:40:00Z',
    tiempoLecturaMinutos: 7,
    vistas: 9540,
    metaTitle: 'Criptografía Post-Cuántica ML-KEM en HSM y Redes Zero-Trust',
    metaDescription:
      'Guía de ingeniería sobre la implementación de algoritmos NIST FIPS 203 (ML-KEM) en módulos HSM y túneles TLS 1.3.',
    webpPesoOriginalKb: 2150,
    webpPesoOptimizadoKb: 175,
    dimensionesWebp: '1200x900',
  },
  {
    id: 'not-104',
    titulo: 'Optimización de Django 5.1 sobre MySQL 8.0: Índices Compuestos, Eliminación de Consultas N+1 y Pooling Persistente',
    slug: 'optimizacion-django-5-1-mysql-8-0-indices-compuestos-n-mas-1',
    bajada:
      'Cómo estructurar modelos relacionales en portales de alto tráfico combinando select_related, prefetch_related, índices cubrientes InnoDB y caché granular con Redis.',
    contenido: `<p>En un diario digital que recibe picos de tráfico repentinos ante noticias de última hora, el rendimiento de la capa de persistencia define la estabilidad de toda la plataforma. Django 5.1 ofrece primitivas declarativas de primer nivel para aprovechar al máximo el optimizador de consultas de MySQL 8.0.</p>
<h2>Diseño de índices compuestos siguiendo la regla ESR (Equality, Sort, Range)</h2>
<p>Cuando la portada consulta las últimas noticias publicadas filtradas por estado y ordenadas descendentemente por fecha de publicación, un índice simple sobre una sola columna obliga a InnoDB a realizar un costoso <code>Using filesort</code> en disco temporal. Declarar un índice compuesto <code>models.Index(fields=['estado', '-fecha_publicacion'])</code> permite resolver la consulta leyendo directamente el árbol B+ en orden inverso.</p>
<h2>Erradicación sistemática del problema N+1</h2>
<p>Encapsular <code>select_related('categoria', 'autor')</code> para relaciones <code>ForeignKey</code> (que se traducen en un único <code>INNER JOIN</code> SQL) junto con <code>prefetch_related('etiquetas')</code> para relaciones <code>ManyToManyField</code> garantiza que renderizar 30 tarjetas en portada ejecute exactamente 2 consultas SQL constantes en lugar de 91.</p>`,
    categoriaSlug: 'desarrollo',
    categoriaNombre: 'Desarrollo',
    etiquetas: ['Django 5', 'MySQL 8.0', 'Python', 'Performance SQL'],
    autor: AUTORES_INICIALES[1],
    imagenUrl: '/src/assets/images/article_software_architecture_1794665548644.jpg',
    imagenAlt: 'Estación de trabajo de arquitectura de software con diagramas de sistemas y código',
    epigrafe: 'Fig. 4 — Diseño de esquemas relacionales e indexación B-Tree para portales editoriales de alta concurrencia.',
    estado: 'PUBLICADO',
    nivelDestacado: 'SECUNDARIA',
    fechaPublicacion: '2026-11-13T18:00:00Z',
    tiempoLecturaMinutos: 8,
    vistas: 14310,
    metaTitle: 'Optimización de Django 5.1 y MySQL 8.0 para Portales de Alto Tráfico',
    metaDescription:
      'Patrones de arquitectura en Django 5.1 y MySQL 8.0: índices compuestos InnoDB, select_related, prefetch_related y caché.',
    webpPesoOriginalKb: 1890,
    webpPesoOptimizadoKb: 159,
    dimensionesWebp: '1200x900',
  },
  {
    id: 'not-105',
    titulo: 'Regulación Europea de Modelos Fundacionales y Estándares de Trazabilidad Criptográfica en Contenidos Digitales',
    slug: 'regulacion-europea-modelos-fundacionales-trazabilidad-c2pa',
    bajada:
      'Los nuevos requisitos de transparencia exigen metadatos firmados mediante el estándar C2PA en cámaras fotográficas y pipelines de edición periodística.',
    contenido: `<p>La entrada en vigor de los protocolos de verificación de origen digital ha impulsado a las agencias de noticias y fabricantes de sensores ópticos a integrar certificados criptográficos desde el instante mismo de la captura del fotograma.</p>
<p>Mediante manifiestos C2PA encadenados por hash SHA-256, los medios digitales pueden demostrar que una fotografía fue recortada o convertida a formato WebP en el servidor sin alterar la integridad factual de la escena original.</p>`,
    categoriaSlug: 'politica-tech',
    categoriaNombre: 'Política Tech',
    etiquetas: ['Regulación IA', 'C2PA', 'Soberanía Digital', 'Periodismo'],
    autor: AUTORES_INICIALES[2],
    imagenUrl: '/src/assets/images/article_cybersecurity_zerotrust_1794665547712.jpg',
    imagenAlt: 'Infraestructura de verificación criptográfica y cumplimiento normativo',
    epigrafe: 'Fig. 5 — Infraestructura de firma digital y preservación de cadena de custodia.',
    estado: 'PUBLICADO',
    nivelDestacado: 'NORMAL',
    fechaPublicacion: '2026-11-13T11:20:00Z',
    tiempoLecturaMinutos: 4,
    vistas: 6280,
    metaTitle: 'Trazabilidad Criptográfica C2PA y Regulación de Modelos Fundacionales',
    metaDescription:
      'Impacto técnico de las normativas de transparencia y el estándar C2PA en los medios periodísticos tecnológicos.',
    webpPesoOriginalKb: 1720,
    webpPesoOptimizadoKb: 148,
    dimensionesWebp: '1200x900',
  },
  {
    id: 'not-106',
    titulo: 'Servidores Tickrate de 512 Hz y Telemetría en Tiempo Real para Torneos Internacionales de eSports',
    slug: 'servidores-tickrate-512-hz-telemetria-tiempo-real-esports',
    bajada:
      'El uso de sockets UDP con bypass de kernel mediante eBPF/XDP reduce el jitter de red por debajo de 0.3 milisegundos en arenas competitivas.',
    contenido: `<p>En las finales presenciales y ligas intercontinentales de deportes electrónicos, una variación de dos milisegundos en la entrega de paquetes puede alterar el registro de impactos. Los ingenieros de infraestructura de torneos han adoptado pilas de red basadas en XDP (eXpress Data Path) en el kernel de Linux para procesar datagramas UDP directamente en el controlador de la tarjeta de red antes de la asignación de estructuras <code>sk_buff</code>.</p>`,
    categoriaSlug: 'esports',
    categoriaNombre: 'Deportes / eSports',
    etiquetas: ['eSports', 'eBPF', 'Baja Latencia', 'Networking'],
    autor: AUTORES_INICIALES[1],
    imagenUrl: '/src/assets/images/article_ai_agents_1794665546392.jpg',
    imagenAlt: 'Bastidores de red de ultra baja latencia para torneos competitivos',
    epigrafe: 'Fig. 6 — Switches ópticos de baja latencia dedicados a servidores de simulación competitiva.',
    estado: 'PUBLICADO',
    nivelDestacado: 'NORMAL',
    fechaPublicacion: '2026-11-12T16:45:00Z',
    tiempoLecturaMinutos: 4,
    vistas: 7890,
    metaTitle: 'Servidores de 512 Hz con eBPF/XDP en Torneos de eSports',
    metaDescription:
      'Cómo el bypass de kernel con eBPF/XDP permite servidores de 512 Hz con menos de 0.3ms de jitter en eSports.',
    webpPesoOriginalKb: 1650,
    webpPesoOptimizadoKb: 142,
    dimensionesWebp: '1200x900',
  },
  {
    id: 'not-107',
    titulo: 'Benchmark Preliminar de Compiladores Python JIT y Ejecución Sin GIL (PEP 703) en Cargas Web',
    slug: 'benchmark-compiladores-python-jit-sin-gil-pep-703',
    bajada:
      'Informe en fase de revisión sobre el escalado multihilo real en workers ASGI y tareas intensivas de procesamiento de datos.',
    contenido: `<p>Borrador interno del equipo de ingeniería analizando las métricas de rendimiento de Python con soporte experimental Free-Threading en entornos de producción contenerizados.</p>`,
    categoriaSlug: 'desarrollo',
    categoriaNombre: 'Desarrollo',
    etiquetas: ['Python', 'PEP 703', 'JIT', 'ASGI'],
    autor: AUTORES_INICIALES[2],
    imagenUrl: '/src/assets/images/article_software_architecture_1794665548644.jpg',
    imagenAlt: 'Benchmark de compiladores Python en estación de ingeniería',
    epigrafe: 'Fig. 7 — Pruebas de concurrencia multihilo sin Global Interpreter Lock.',
    estado: 'BORRADOR',
    nivelDestacado: 'NORMAL',
    fechaPublicacion: '2026-11-14T09:00:00Z',
    tiempoLecturaMinutos: 5,
    vistas: 0,
    metaTitle: 'Benchmark Python Sin GIL (PEP 703) y JIT en Servidores Web',
    metaDescription: 'Análisis de rendimiento de Python Free-Threading y compilación JIT.',
    webpPesoOriginalKb: 1810,
    webpPesoOptimizadoKb: 154,
    dimensionesWebp: '1200x900',
  },
];

export const BANNERS_INICIALES: BannerPublicitario[] = [
  {
    id: 'ban-1',
    tituloCampana: 'Cloud Bare-Metal AMD EPYC & H200 Clusters',
    anunciante: 'AetherCompute Infrastructure',
    ubicacion: 'HOME_MID',
    ubicacionLabel: 'Portada Entre Secciones (HOME_MID)',
    dimensiones: '1200x160',
    ctaTexto: 'Desplegar Clúster Dedicado →',
    urlDestino: 'https://aethercompute.example.com/bare-metal?utm_source=diariotech',
    fechaInicio: '2026-11-01',
    fechaFin: '2026-12-31',
    activo: true,
    impresiones: 48920,
    clics: 1418,
  },
  {
    id: 'ban-2',
    tituloCampana: 'Maestría en Ingeniería de Sistemas Distribuidos y Ciberseguridad',
    anunciante: 'Instituto Tecnológico de Ingeniería Avanzada',
    ubicacion: 'SIDEBAR_STICKY',
    ubicacionLabel: 'Columna Derecha en Artículo (SIDEBAR_STICKY)',
    dimensiones: '300x600',
    ctaTexto: 'Solicitar Programa Académico 2027 →',
    urlDestino: 'https://itia.example.edu/posgrado-sistemas?utm_source=diariotech',
    fechaInicio: '2026-11-01',
    fechaFin: '2026-12-15',
    activo: true,
    impresiones: 31450,
    clics: 892,
  },
];

export const SUSCRIPTORES_INICIALES: SuscriptorItem[] = [
  {
    id: 'sus-1',
    email: 'arquitectura@fintechlatam.io',
    nombre: 'Carlos Mendoza',
    categoriasInteres: ['Hardware', 'Desarrollo'],
    estado: 'ACTIVO',
    estadoSincronizacion: 'SINCRONIZADO',
    proveedor: 'Brevo API v3',
    creadoEn: '2026-11-12 09:14:22',
  },
  {
    id: 'sus-2',
    email: 'lucia.herrera@ciberseguridad.org',
    nombre: 'Lucía Herrera',
    categoriasInteres: ['Ciberseguridad', 'Inteligencia Artificial'],
    estado: 'ACTIVO',
    estadoSincronizacion: 'SINCRONIZADO',
    proveedor: 'Brevo API v3',
    creadoEn: '2026-11-13 17:42:09',
  },
];

export const AUDITORIA_INICIAL: RegistroAuditoria[] = [
  {
    id: 'aud-1',
    fecha: '2026-11-14 05:30:12',
    modelo: 'Noticia',
    objetoId: 'not-101',
    objetoTitulo: 'El Futuro del Silicio Fotónico: Arquitecturas NPU de 1.4nm...',
    tipoCambio: '~',
    usuario: 'Dra. Elena Rostova',
    rolUsuario: 'ADMIN',
    motivoCambio: 'Promoción a estado PUBLICADO y nivel HERO; imagen convertida a WebP (194 KB).',
  },
  {
    id: 'aud-2',
    fecha: '2026-11-14 04:15:04',
    modelo: 'Noticia',
    objetoId: 'not-102',
    objetoTitulo: 'Refrigeración Líquida Bifásica y Redes InfiniBand de 800G...',
    tipoCambio: '+',
    usuario: 'Martín Valdés',
    rolUsuario: 'EDITOR',
    motivoCambio: 'Creación y publicación de artículo con validación de metadatos OpenGraph.',
  },
  {
    id: 'aud-3',
    fecha: '2026-11-14 03:50:19',
    modelo: 'Noticia',
    objetoId: 'not-107',
    objetoTitulo: 'Benchmark Preliminar de Compiladores Python JIT y Ejecución Sin GIL...',
    tipoCambio: '+',
    usuario: 'Sofía Mendizábal',
    rolUsuario: 'REDACTOR',
    motivoCambio: 'Guardado inicial en estado BORRADOR pendiente de revisión editorial.',
  },
];
