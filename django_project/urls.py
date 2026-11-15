"""
Configuración Completa de Enrutamiento URL (`urls.py` del Proyecto Raíz y Aplicaciones).
Incluye:
1. config/urls.py (Enrutador principal, Sitemap XML, Robots.txt, CKEditor 5 y Media).
2. apps/noticias/urls.py (Portada, Detalle por Slug, Categoría, Etiqueta, Autor y Buscador).
3. apps/newsletter/urls.py (Alta de suscriptor y baja segura por UUID).
4. apps/publicidad/urls.py (Tracking de clics y redirección).
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path
from django.views.decorators.cache import cache_page

from apps.core.sitemaps import SITEMAPS_DIARIO
from apps.core.views import RobotsTxtView
from apps.newsletter.views import (
    CancelarSuscripcionNewsletterView,
    SuscribirNewsletterView,
)
from apps.noticias.views import (
    BuscarNoticiasView,
    NoticiaDetalleView,
    NoticiaPorAutorView,
    NoticiaPorCategoriaView,
    NoticiaPorEtiquetaView,
    PortadaView,
)
from apps.publicidad.views import RegistrarClicAnuncioView

# ==============================================================================
# A. URLS DE LA APP: NOTICIAS (`apps/noticias/urls.py` -> namespace="noticias")
# ==============================================================================
noticias_urlpatterns = (
    [
        # Portada principal (cacheada según settings.CACHE_TTL_HOME)
        path(
            "",
            cache_page(getattr(settings, "CACHE_TTL_HOME", 180))(PortadaView.as_view()),
            name="portada",
        ),
        # Buscador Full-Text en título, bajada, contenido y etiquetas
        path(
            "buscar/",
            BuscarNoticiasView.as_view(),
            name="buscar",
        ),
        # Vista filtrada por Categoría (Hardware, IA, Ciberseguridad, Desarrollo, etc.)
        path(
            "categoria/<slug:slug>/",
            cache_page(getattr(settings, "CACHE_TTL_CATEGORIA", 300))(
                NoticiaPorCategoriaView.as_view()
            ),
            name="por_categoria",
        ),
        # Vista filtrada por Etiqueta (Tag)
        path(
            "etiqueta/<slug:slug>/",
            NoticiaPorEtiquetaView.as_view(),
            name="por_etiqueta",
        ),
        # Vista filtrada por Perfil de Autor
        path(
            "autor/<slug:slug>/",
            NoticiaPorAutorView.as_view(),
            name="por_autor",
        ),
        # Página individual de Noticia mediante Slug amigable
        path(
            "noticia/<slug:slug>/",
            NoticiaDetalleView.as_view(),
            name="detalle",
        ),
    ],
    "noticias",
)

# ==============================================================================
# B. URLS DE LA APP: NEWSLETTER (`apps/newsletter/urls.py` -> namespace="newsletter")
# ==============================================================================
newsletter_urlpatterns = (
    [
        path(
            "suscribir/",
            SuscribirNewsletterView.as_view(),
            name="suscribir",
        ),
        path(
            "baja/<uuid:token_baja>/",
            CancelarSuscripcionNewsletterView.as_view(),
            name="cancelar_suscripcion",
        ),
    ],
    "newsletter",
)

# ==============================================================================
# C. URLS DE LA APP: PUBLICIDAD (`apps/publicidad/urls.py` -> namespace="publicidad")
# ==============================================================================
publicidad_urlpatterns = (
    [
        path(
            "clic/<int:pk>/",
            RegistrarClicAnuncioView.as_view(),
            name="registrar_clic",
        ),
    ],
    "publicidad",
)

# ==============================================================================
# D. URLS DE LA APP: USUARIOS (`apps/usuarios/urls.py` -> namespace="usuarios")
# ==============================================================================
usuarios_urlpatterns = (
    [
        path(
            "login/",
            auth_views.LoginView.as_view(template_name="usuarios/login.html"),
            name="login",
        ),
        path(
            "logout/",
            auth_views.LogoutView.as_view(),
            name="logout",
        ),
    ],
    "usuarios",
)

# ==============================================================================
# E. ENRUTADOR RAÍZ DEL PROYECTO (`config/urls.py`)
# ==============================================================================
urlpatterns = [
    # Panel de Administración Editorial (Django Admin)
    path("admin/", admin.site.urls),
    # Uploader de imágenes inline para el editor Rich Text CKEditor 5
    path("ckeditor5/", include("django_ckeditor_5.urls")),
    # SEO Técnico: Sitemap XML dinámico y Robots.txt
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
    # Módulos de negocio del Diario Digital Tecnológico
    path("newsletter/", include(newsletter_urlpatterns, namespace="newsletter")),
    path("publicidad/", include(publicidad_urlpatterns, namespace="publicidad")),
    path("usuarios/", include(usuarios_urlpatterns, namespace="usuarios")),
    path("", include(noticias_urlpatterns, namespace="noticias")),
]

# Servir archivos multimedia (imágenes WebP) en entorno de desarrollo local
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
