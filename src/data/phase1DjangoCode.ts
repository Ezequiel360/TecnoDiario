export interface ArchivoFase1 {
  id: string;
  titulo: string;
  ruta: string;
  lenguaje: string;
  resumen: string;
  contenido: string;
}

export const ARBOL_DIRECTORIOS_DJANGO = `diario_digital_tecnologico/
├── .env                                    # Variables de entorno secretas (No versionado en Git)
├── .env.example                            # Plantilla documentada de variables de entorno
├── .gitignore                              # Exclusiones de Git (.env, __pycache__, media/, backups/)
├── manage.py                               # CLI administrativo de Django 5.1
├── requirements.txt                        # Dependencias exactas de producción (MySQL, Pillow, CKEditor 5)
│
├── config/                                 # Paquete de configuración principal del proyecto
│   ├── __init__.py
│   ├── asgi.py                             # Punto de entrada ASGI para servidores asíncronos
│   ├── settings.py                         # Configuración integral (MySQL 8, Seguridad, Caché, SEO)
│   ├── urls.py                             # Enrutador raíz + Sitemap XML + Robots.txt + Media
│   └── wsgi.py                             # Punto de entrada WSGI para Gunicorn en producción
│
├── apps/                                   # Directorio modular de aplicaciones de negocio
│   ├── __init__.py
│   │
│   ├── core/                               # App Transversal: Auditoría base, SEO global y Backups
│   │   ├── __init__.py
│   │   ├── admin.py                        # Administración de ConfiguracionSitio
│   │   ├── apps.py                         # CoreConfig (name = "apps.core")
│   │   ├── context_processors.py           # Inyección global de metadatos SEO y configuración
│   │   ├── models.py                       # ModeloBaseAuditable (abstracto) y ConfiguracionSitio
│   │   ├── sitemaps.py                     # Clases Sitemap dinámicas para Noticias y Categorías
│   │   ├── views.py                        # Vistas de robots.txt, healthcheck y páginas de error
│   │   └── management/
│   │       └── commands/
│   │           └── backup_diario.py        # Comando automatizado mysqldump + tar.gz de /media
│   │
│   ├── usuarios/                           # App de Identidad, Roles RBAC y Perfiles de Autor
│   │   ├── __init__.py
│   │   ├── admin.py                        # UserAdmin personalizado con grupos y SimpleHistoryAdmin
│   │   ├── apps.py                         # UsuariosConfig (name = "apps.usuarios")
│   │   ├── models.py                       # Usuario (Roles: Admin, Editor, Redactor) y avatar WebP
│   │   ├── signals.py                      # Asignación automática de permisos de grupo según rol
│   │   ├── urls.py                         # Rutas de perfil de autor e inicio de sesión editorial
│   │   └── views.py                        # Vista pública de artículos por Autor (con select_related)
│   │
│   ├── noticias/                           # App Núcleo Editorial: Noticias, Categorías, Tags y Buscador
│   │   ├── __init__.py
│   │   ├── admin.py                        # Panel editorial avanzado, filtros, acciones de publicación
│   │   ├── apps.py                         # NoticiasConfig (name = "apps.noticias")
│   │   ├── context_processors.py           # Menú de categorías activas cacheado
│   │   ├── forms.py                        # Formularios editoriales y sanitización HTML
│   │   ├── models.py                       # Categoria, Etiqueta, Noticia (con Pillow WebP e índices MySQL)
│   │   ├── urls.py                         # Slugs amigables: portada, categoría, tag, búsqueda y detalle
│   │   └── views.py                        # CBVs optimizadas con select_related y prefetch_related
│   │
│   ├── publicidad/                         # App de Gestión de Espacios Publicitarios y Banners
│   │   ├── __init__.py
│   │   ├── admin.py                        # Gestión de campañas, métricas CTR y vigencia por fechas
│   │   ├── apps.py                         # PublicidadConfig (name = "apps.publicidad")
│   │   ├── context_processors.py           # Renderizado de banners vigentes por slot sin N+1
│   │   ├── models.py                       # EspacioPublicitario y Anuncio (programado por vigencia)
│   │   ├── urls.py                         # Endpoint de redirección y conteo atómico de clics
│   │   └── views.py                        # Vista de tracking de clics e impresiones con F() expressions
│   │
│   └── newsletter/                         # App de Captura de Suscriptores e Integración API/Webhook
│       ├── __init__.py
│       ├── admin.py                        # Administración de suscriptores y bitácora de sincronización
│       ├── apps.py                         # NewsletterConfig (name = "apps.newsletter")
│       ├── forms.py                        # Formulario con validación anti-spam y categorías de interés
│       ├── models.py                       # Suscriptor y LogSincronizacionNewsletter
│       ├── services.py                     # Servicio desacoplado HTTP hacia Brevo / Mailchimp / Webhook
│       ├── urls.py                         # Endpoints de suscripción y baja segura por token UUID
│       └── views.py                        # Controladores de alta/baja de boletín
│
├── templates/                              # Plantillas Django (DTL) con HTML5 Semántico y TailwindCSS
│   ├── base.html                           # Layout maestro con OpenGraph/Twitter Cards dinámicos en <head>
│   ├── includes/
│   │   ├── navbar.html                     # Cabecera responsive con buscador y categorías
│   │   ├── footer.html                     # Pie de página con formulario de Newsletter integrado
│   │   └── banner_slot.html                # Componente reutilizable para espacios publicitarios
│   └── noticias/
│       ├── portada.html                    # Home: Hero principal + Grilla secundaria + Últimas noticias
│       ├── detalle_noticia.html            # Artículo Rich Text, autor, tags, compartir y relacionadas
│       ├── lista_categoria.html            # Vista filtrada por sección con paginación SEO
│       ├── lista_etiqueta.html             # Vista filtrada por etiqueta (tag)
│       ├── lista_autor.html                # Perfil público del periodista y su archivo de notas
│       └── resultados_busqueda.html        # Buscador full-text con resaltado de resultados
│
├── static/                                 # Activos estáticos de origen (CSS, JS editorial, iconos)
├── media/                                  # Imágenes subidas y convertidas automáticamente a WebP
└── backups/                                # Almacén local/rotativo de dumps SQL y paquetes media`;

export const ARCHIVOS_FASE_1: ArchivoFase1[] = [
  {
    id: 'estructura',
    titulo: '1. Estructura del Proyecto',
    ruta: 'Árbol de Directorios (Django 5.1)',
    lenguaje: 'text',
    resumen:
      'Arquitectura modular separada en 5 aplicaciones desacopladas (core, usuarios, noticias, publicidad, newsletter) bajo el directorio apps/.',
    contenido: ARBOL_DIRECTORIOS_DJANGO,
  },
  {
    id: 'requirements',
    titulo: '2. requirements.txt',
    ruta: 'requirements.txt',
    lenguaje: 'ini',
    resumen:
      'Dependencias bloqueadas por versión exacta para producción con MySQL 8.0, Pillow 11 (WebP), CKEditor 5, django-simple-history y Redis.',
    contenido: `# ==============================================================================
# DIARIO DIGITAL TECNOLÓGICO - DEPENDENCIAS DE PRODUCCIÓN (DJANGO 5.x + MYSQL 8.0)
# ==============================================================================

# Core Framework
Django==5.1.3
asgiref==3.8.1
sqlparse==0.5.2
tzdata==2024.2

# Base de Datos Relacional MySQL 8.0 (C-extension driver de alto rendimiento)
mysqlclient==2.2.6

# Procesamiento y Optimización de Imágenes (Conversión automática a WebP)
Pillow==11.0.0

# Editor Rich Text Avanzado (Soporte de bloques, código, tablas y embeds)
django-ckeditor-5==0.2.15

# Auditoría Histórica de Modelos (Control de cambios por usuario, IP y fecha)
django-simple-history==3.7.0

# Gestión de Variables de Entorno y Configuración 12-Factor App
python-dotenv==1.0.1

# Caché de Alto Rendimiento y Sesiones (Redis Backend compatible con Django 5)
django-redis==5.4.0
redis==5.2.0

# Sanitización HTML contra XSS en campos Rich Text e integraciones HTTP
bleach==6.2.0
requests==2.32.3

# Servidor WSGI de Producción y Archivos Estáticos Comprimidos
gunicorn==23.0.0
whitenoise==6.8.2`,
  },
  {
    id: 'settings',
    titulo: '3. config/settings.py',
    ruta: 'config/settings.py',
    lenguaje: 'python',
    resumen:
      'Configuración lista para producción con conexión persistente a MySQL 8.0 (utf8mb4 + STRICT_TRANS_TABLES), caché Redis/LocMem, CKEditor 5, Simple History y cabeceras de seguridad HSTS/CSRF/XSS.',
    contenido: `"""
Configuración de producción y desarrollo para Diario Digital Tecnológico.
Arquitectura: Django 5.1.x + MySQL 8.0 + Redis Cache + CKEditor 5 + Simple History.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def get_bool_env(var_name: str, default: bool = False) -> bool:
    val = os.getenv(var_name, str(default)).strip().lower()
    return val in ("true", "1", "yes", "on")


def get_list_env(var_name: str, default: str = "") -> list[str]:
    raw = os.getenv(var_name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-me-in-production-9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c",
)
DEBUG = get_bool_env("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = get_list_env("DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1,.diariotech.com")
CSRF_TRUSTED_ORIGINS = get_list_env(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    default="http://localhost:8000,https://diariotech.com,https://www.diariotech.com",
)

SITE_URL = os.getenv("SITE_URL", "https://www.diariotech.com")
SITE_NAME = os.getenv("SITE_NAME", "Diario Digital Tecnológico")

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",
    "django.contrib.humanize",
]

THIRD_PARTY_APPS = [
    "django_ckeditor_5",
    "simple_history",
]

LOCAL_APPS = [
    "apps.core.apps.CoreConfig",
    "apps.usuarios.apps.UsuariosConfig",
    "apps.noticias.apps.NoticiasConfig",
    "apps.publicidad.apps.PublicidadConfig",
    "apps.newsletter.apps.NewsletterConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS
AUTH_USER_MODEL = "usuarios.Usuario"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("MYSQL_DATABASE", "diario_tech_db"),
        "USER": os.getenv("MYSQL_USER", "diario_tech_user"),
        "PASSWORD": os.getenv("MYSQL_PASSWORD", ""),
        "HOST": os.getenv("MYSQL_HOST", "127.0.0.1"),
        "PORT": os.getenv("MYSQL_PORT", "3306"),
        "CONN_MAX_AGE": int(os.getenv("MYSQL_CONN_MAX_AGE", "60")),
        "CONN_HEALTH_CHECKS": True,
        "OPTIONS": {
            "charset": "utf8mb4",
            "use_unicode": True,
            "init_command": (
                "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,"
                "NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION', "
                "innodb_strict_mode=1, "
                "default_storage_engine=INNODB"
            ),
            "connect_timeout": 10,
        },
    }
}

# Configuración de Seguridad HTTP (Hardening)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True`,
  },
  {
    id: 'models',
    titulo: '4. models.py (Completo)',
    ruta: 'apps/{core,usuarios,noticias,publicidad,newsletter}/models.py',
    lenguaje: 'python',
    resumen:
      'Modelos relacionales con índices compuestos para MySQL 8.0, conversión automática de imágenes a WebP con Pillow en save(), flujo editorial (Borrador/Programado/Publicado), roles RBAC y auditoría HistoricalRecords.',
    contenido: `def optimizar_imagen_a_webp(
    imagen_field,
    max_width: int = 1600,
    max_height: int = 900,
    quality: int = 82,
) -> ContentFile | None:
    """
    Convierte automáticamente cualquier imagen subida (JPG/PNG) a formato WebP
    redimensionando proporcionalmente con filtro LANCZOS mediante Pillow.
    """
    if not imagen_field:
        return None
    imagen_field.open()
    img = Image.open(imagen_field)
    img = ImageOps.exif_transpose(img)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    if img.width > max_width or img.height > max_height:
        img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    img.save(buffer, format="WEBP", quality=quality, optimize=True)
    buffer.seek(0)
    nombre_base = Path(imagen_field.name).stem
    nuevo_nombre = f"{slugify(nombre_base)}-{uuid.uuid4().hex[:8]}.webp"
    return ContentFile(buffer.read(), name=nuevo_nombre)


class NoticiaQuerySet(models.QuerySet):
    def con_relaciones_optimizadas(self):
        # Evita consultas N+1 en MySQL 8.0
        return self.select_related("categoria", "autor", "editor_revisor").prefetch_related("etiquetas")

    def visibles_en_sitio(self):
        ahora = timezone.now()
        return (
            self.con_relaciones_optimizadas()
            .filter(
                Q(estado=Noticia.EstadoPublicacion.PUBLICADO)
                | Q(estado=Noticia.EstadoPublicacion.PROGRAMADO, fecha_publicacion__lte=ahora),
                categoria__activa=True,
                fecha_publicacion__lte=ahora,
            )
            .order_by("-fecha_publicacion")
        )`,
  },
];

export const ARCHIVOS_FASE_2: ArchivoFase1[] = [
  {
    id: 'admin_py',
    titulo: '1. admin.py (Panel Editorial)',
    ruta: 'apps/{core,usuarios,noticias,publicidad,newsletter}/admin.py',
    lenguaje: 'python',
    resumen:
      'Configuración avanzada con SimpleHistoryAdmin, miniaturas WebP (format_html), select_related/prefetch_related, aislamiento por rol RBAC en get_queryset() y acciones masivas de publicación.',
    contenido: `@admin.register(Noticia)
class NoticiaAdmin(SimpleHistoryAdmin):
    list_display = (
        "miniatura_portada",
        "titulo",
        "categoria",
        "autor",
        "badge_estado",
        "nivel_destacado",
        "fecha_publicacion",
        "tiempo_lectura_minutos",
        "vistas_totales",
    )
    list_filter = (
        "estado",
        "nivel_destacado",
        "categoria",
        "permitir_comentarios",
        ("fecha_publicacion", admin.DateFieldListFilter),
    )
    search_fields = (
        "titulo",
        "slug",
        "bajada",
        "contenido",
        "autor__first_name",
        "autor__last_name",
        "etiquetas__nombre",
    )
    prepopulated_fields = {"slug": ("titulo",)}
    autocomplete_fields = ("categoria", "etiquetas", "autor", "editor_revisor")
    date_hierarchy = "fecha_publicacion"
    actions = ["publicar_noticias_seleccionadas", "pasar_a_borrador"]

    def get_queryset(self, request: HttpRequest):
        qs = (
            super()
            .get_queryset(request)
            .select_related("categoria", "autor", "editor_revisor")
            .prefetch_related("etiquetas")
        )
        user: Usuario = request.user
        if user.is_superuser or getattr(user, "puede_publicar_directamente", False):
            return qs
        return qs.filter(autor=user)`,
  },
  {
    id: 'inicializar_roles_py',
    titulo: '2. inicializar_roles.py (RBAC)',
    ruta: 'apps/usuarios/management/commands/inicializar_roles.py',
    lenguaje: 'python',
    resumen:
      'Management command transaccional e idempotente que crea los grupos Administrador, Editor y Redactor en MySQL con sus permisos exactos de ContentType y sincroniza usuarios.',
    contenido: `class Command(BaseCommand):
    help = "Inicializa los Grupos de Roles (Administrador, Editor, Redactor) con sus permisos exactos."

    @transaction.atomic
    def handle(self, *args, **options):
        for nombre_grupo, reglas_modelos in MATRIZ_PERMISOS_POR_GRUPO.items():
            grupo, _ = Group.objects.get_or_create(name=nombre_grupo)
            permisos_a_asignar = []
            for modelo_cls, codenames in reglas_modelos:
                ct = ContentType.objects.get_for_model(modelo_cls)
                permisos_a_asignar.extend(
                    Permission.objects.filter(content_type=ct, codename__in=codenames)
                )
            grupo.permissions.set(permisos_a_asignar)`,
  },
  {
    id: 'backup_diario_py',
    titulo: '3. backup_diario.py (MySQL + Media)',
    ruta: 'apps/core/management/commands/backup_diario.py',
    lenguaje: 'python',
    resumen:
      'Management command para backups automatizados de MySQL 8.0 (--single-transaction | gzip) y carpeta media/ (.tar.gz) con manifiesto SHA-256 y purga por retención.',
    contenido: `comando_dump = [
    mysqldump_bin,
    f"--host={db_host}",
    f"--port={db_port}",
    f"--user={db_user}",
    "--single-transaction",
    "--quick",
    "--routines",
    "--triggers",
    "--events",
    "--default-character-set=utf8mb4",
    "--set-gtid-purged=OFF",
    db_name,
]
# MYSQL_PWD se pasa por entorno de subproceso sin exponerse en ps aux
with gzip.open(archivo_sql_gz, "wb", compresslevel=6) as gz_out:
    proceso = subprocess.Popen(comando_dump, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env_subproceso)
    shutil.copyfileobj(proceso.stdout, gz_out)`,
  },
];

export const ARCHIVOS_FASE_3: ArchivoFase1[] = [
  {
    id: 'views_py',
    titulo: '1. views.py + services.py',
    ruta: 'apps/{noticias,newsletter,publicidad,core}/views.py',
    lenguaje: 'python',
    resumen:
      'CBVs optimizadas (PortadaView, NoticiaDetalleView, Categoría, Etiqueta, Autor, Buscador) con paginación, incremento atómico F() en MySQL y SincronizadorNewsletterService.',
    contenido: `class PortadaView(TemplateView):
    template_name = "noticias/portada.html"
    noticias_por_pagina = 10

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        qs_visibles = Noticia.publicadas.all()

        noticia_hero = (
            qs_visibles.filter(nivel_destacado=Noticia.NivelDestacado.HERO).first()
            or qs_visibles.first()
        )
        ids_excluidos = [noticia_hero.pk] if noticia_hero else []
        noticias_secundarias = list(
            qs_visibles.exclude(pk__in=ids_excluidos).filter(
                nivel_destacado=Noticia.NivelDestacado.SECUNDARIA
            )[:3]
        )
        ids_excluidos.extend([n.pk for n in noticias_secundarias])

        qs_ultimas = qs_visibles.exclude(pk__in=ids_excluidos)
        paginator = Paginator(qs_ultimas, self.noticias_por_pagina)
        page_obj = paginator.get_page(self.request.GET.get("page", 1))

        context.update({
            "noticia_hero": noticia_hero,
            "noticias_secundarias": noticias_secundarias,
            "ultimas_noticias": page_obj.object_list,
            "page_obj": page_obj,
            "is_paginated": page_obj.has_other_pages(),
        })
        return context`,
  },
  {
    id: 'urls_py',
    titulo: '2. urls.py (Proyecto y Apps)',
    ruta: 'config/urls.py & apps/{noticias,newsletter,publicidad}/urls.py',
    lenguaje: 'python',
    resumen:
      'Enrutamiento amigable mediante SlugField único (/noticia/<slug:slug>/, /categoria/<slug:slug>/, /etiqueta/<slug:slug>/, /autor/<slug:slug>/), caché en vistas y Sitemap/Robots.',
    contenido: `urlpatterns = [
    path("admin/", admin.site.urls),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    path(
        "sitemap.xml",
        cache_page(3600)(sitemap),
        {"sitemaps": SITEMAPS_DIARIO},
        name="django.contrib.sitemaps.views.sitemap",
    ),
    path(
        "robots.txt",
        cache_page(3600)(RobotsTxtView.as_view()),
        name="robots_txt",
    ),
    path("newsletter/", include(newsletter_urlpatterns, namespace="newsletter")),
    path("publicidad/", include(publicidad_urlpatterns, namespace="publicidad")),
    path("usuarios/", include(usuarios_urlpatterns, namespace="usuarios")),
    path("", include(noticias_urlpatterns, namespace="noticias")),
]`,
  },
  {
    id: 'sitemaps_robots_py',
    titulo: '3. sitemaps.py & robots.txt',
    ruta: 'apps/core/sitemaps.py & apps/core/views.py',
    lenguaje: 'python',
    resumen:
      'Generación dinámica de /sitemap.xml (NoticiaSitemap, CategoriaSitemap, EtiquetaSitemap, AutorSitemap) y vista /robots.txt.',
    contenido: `class NoticiaSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.9
    protocol = "https"
    limit = 2000

    def items(self):
        return Noticia.publicadas.only("slug", "actualizado_en", "fecha_publicacion")

    def lastmod(self, obj: Noticia):
        return obj.actualizado_en or obj.fecha_publicacion


class RobotsTxtView(View):
    def get(self, request: HttpRequest) -> HttpResponse:
        sitemap_url = request.build_absolute_uri(reverse("django.contrib.sitemaps.views.sitemap"))
        lineas = [
            "User-agent: *",
            "Allow: /",
            "Disallow: /admin/",
            "Disallow: /usuarios/login/",
            "Disallow: /newsletter/baja/",
            "Disallow: /buscar/?q=*",
            "",
            f"Sitemap: {sitemap_url}",
        ]
        return HttpResponse("\\n".join(lineas) + "\\n", content_type="text/plain; charset=utf-8")`,
  },
];

export const ARCHIVOS_FASE_4: ArchivoFase1[] = [
  {
    id: 'base_html',
    titulo: '1. templates/base.html',
    ruta: 'templates/base.html & templates/includes/banner_slot.html',
    lenguaje: 'html',
    resumen:
      'Layout maestro con HTML5 semántico, TailwindCSS, bloques dinámicos de OpenGraph / Twitter Cards en <head>, navegación por categorías, buscador, slots de banners (HEADER_TOP y FOOTER_LEADERBOARD) y formulario de Newsletter con CSRF.',
    contenido: `{% load static humanize %}
<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{% block meta_title %}{{ seo_global.site_name|default:"Diario Digital Tecnológico" }}{% endblock %}</title>
  <meta name="description" content="{% block meta_description %}{{ seo_global.meta_description_default }}{% endblock %}" />
  <link rel="canonical" href="{% block canonical_url %}{{ seo_global.canonical_url|default:request.build_absolute_uri }}{% endblock %}" />

  <!-- Open Graph Dinámico -->
  <meta property="og:locale" content="es_ES" />
  <meta property="og:site_name" content="{{ seo_global.site_name|default:'Diario Digital Tecnológico' }}" />
  <meta property="og:type" content="{% block og_type %}website{% endblock %}" />
  <meta property="og:title" content="{% block og_title %}{{ seo_global.site_name }}{% endblock %}" />
  <meta property="og:description" content="{% block og_description %}{{ seo_global.meta_description_default }}{% endblock %}" />
  <meta property="og:url" content="{% block og_url %}{{ request.build_absolute_uri }}{% endblock %}" />
  <meta property="og:image" content="{% block og_image %}{{ seo_global.og_image_default }}{% endblock %}" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@{{ seo_global.twitter_site|default:'DiarioTech' }}" />
  <meta name="twitter:title" content="{% block twitter_title %}{{ seo_global.site_name }}{% endblock %}" />
  <meta name="twitter:description" content="{% block twitter_description %}{{ seo_global.meta_description_default }}{% endblock %}" />
  <meta name="twitter:image" content="{% block twitter_image %}{{ seo_global.og_image_default }}{% endblock %}" />
  {% block extra_head %}{% endblock %}
</head>`,
  },
  {
    id: 'home_html',
    titulo: '2. templates/noticias/home.html',
    ruta: 'templates/noticias/home.html (Portada Principal)',
    lenguaje: 'html',
    resumen:
      'Portada con 3 niveles de jerarquía visual: Noticia Hero principal (7+5 col), grilla de 3 noticias secundarias destacadas, espacio publicitario HOME_MID, feed cronológico paginado y sidebar con Más Leídas de la Semana.',
    contenido: `{% extends "base.html" %}
{% load humanize %}

{% block content %}
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
  {% if noticia_hero %}
    <section aria-label="Noticia principal de portada" class="pb-10 mb-10 border-b border-papel-borde">
      <article class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-7 flex flex-col justify-between">
          <h1 class="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold text-tinta-primaria">
            <a href="{{ noticia_hero.get_absolute_url }}">{{ noticia_hero.titulo }}</a>
          </h1>
          <p class="text-base sm:text-lg text-tinta-secundaria">{{ noticia_hero.bajada }}</p>
        </div>
        <figure class="lg:col-span-5">
          <img src="{{ noticia_hero.imagen_principal.url }}" alt="{{ noticia_hero.imagen_alt }}" fetchpriority="high" />
        </figure>
      </article>
    </section>
  {% endif %}
</div>
{% endblock %}`,
  },
  {
    id: 'detalle_noticia_html',
    titulo: '3. templates/noticias/detalle_noticia.html',
    ruta: 'templates/noticias/detalle_noticia.html',
    lenguaje: 'html',
    resumen:
      'Página individual de noticia con JSON-LD Schema.org NewsArticle, OpenGraph de artículo, figura WebP optimizada, cuerpo Rich Text sanitizado ({{ noticia.contenido|safe }}), tags, biografía del autor, banner SIDEBAR_STICKY y 3 noticias relacionadas.',
    contenido: `{% extends "base.html" %}
{% load humanize %}

{% block meta_title %}{{ meta_title }} | {{ seo_global.site_name }}{% endblock %}
{% block meta_description %}{{ meta_description }}{% endblock %}
{% block og_type %}article{% endblock %}
{% block og_title %}{{ meta_title }}{% endblock %}
{% block og_description %}{{ meta_description }}{% endblock %}
{% block og_image %}{% if og_image %}{{ og_image }}{% endif %}{% endblock %}

{% block content %}
<article class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
  <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold">{{ noticia.titulo }}</h1>
  <div class="prose prose-stone prose-lg max-w-none">
    {{ noticia.contenido|safe }}
  </div>
</article>
{% endblock %}`,
  },
  {
    id: 'categoria_busqueda_html',
    titulo: '4. categoria_list.html & resultados_busqueda.html',
    ruta: 'templates/noticias/{categoria_list,resultados_busqueda}.html',
    lenguaje: 'html',
    resumen:
      'Plantillas responsive para listados filtrados por Categoría, Etiqueta y Autor con paginación SEO, más vista del buscador full-text preservando el parámetro ?q= en cada página.',
    contenido: `{% extends "base.html" %}
{% block meta_robots %}noindex, follow{% endblock %}

{% block content %}
<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
  <form action="{% url 'noticias:buscar' %}" method="get" role="search">
    <input type="search" name="q" value="{{ termino_busqueda|default:'' }}" />
    <button type="submit">Buscar artículos</button>
  </form>
  {% if is_paginated and page_obj.has_next %}
    <a href="?q={{ termino_busqueda|urlencode }}&amp;page={{ page_obj.next_page_number }}">Siguiente →</a>
  {% endif %}
</div>
{% endblock %}`,
  },
];



