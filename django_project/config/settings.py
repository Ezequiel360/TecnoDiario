"""
Configuración de producción y desarrollo para Diario Digital Tecnológico.
Arquitectura: Django 5.1.x + MySQL 8.0 + Redis Cache + CKEditor 5 + Simple History.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from django.utils.translation import gettext_lazy as _

# ==============================================================================
# 1. RUTAS BASE Y CARGA DE VARIABLES DE ENTORNO (.env)
# ==============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def get_bool_env(var_name: str, default: bool = False) -> bool:
    """Convierte variables de entorno en valores booleanos seguros."""
    val = os.getenv(var_name, str(default)).strip().lower()
    return val in ("true", "1", "yes", "on")


def get_list_env(var_name: str, default: str = "") -> list[str]:
    """Convierte una cadena separada por comas en una lista limpia."""
    raw = os.getenv(var_name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


# ==============================================================================
# 2. SEGURIDAD NÚCLEO Y ENTORNO DE EJECUCIÓN
# ==============================================================================
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-change-me-in-production-9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c",
)

DEBUG = get_bool_env("DJANGO_DEBUG", default=False)

ALLOWED_HOSTS = get_list_env(
    "DJANGO_ALLOWED_HOSTS",
    default="localhost,127.0.0.1,.diariotech.com",
)

CSRF_TRUSTED_ORIGINS = get_list_env(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    default="http://localhost:8000,https://diariotech.com,https://www.diariotech.com",
)

SITE_URL = os.getenv("SITE_URL", "https://www.diariotech.com")
SITE_NAME = os.getenv("SITE_NAME", "Diario Digital Tecnológico")

# ==============================================================================
# 3. DEFINICIÓN DE APLICACIONES (ARQUITECTURA MODULAR)
# ==============================================================================
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

# Modelo de Usuario Personalizado para Roles (Administrador, Editor, Redactor)
AUTH_USER_MODEL = "usuarios.Usuario"

# ==============================================================================
# 4. MIDDLEWARE (SEGURIDAD, WHITENOISE, CACHÉ Y AUDITORÍA HISTÓRICA)
# ==============================================================================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Registra automáticamente el request.user en cada cambio de modelo auditado
    "simple_history.middleware.HistoryRequestMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ==============================================================================
# 5. MOTOR DE PLANTILLAS (DJANGO TEMPLATE LANGUAGE - DTL)
# ==============================================================================
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                # Context processors propios para navegación global, categorías y anuncios
                "apps.core.context_processors.configuracion_sitio_context",
                "apps.noticias.context_processors.categorias_menu_context",
                "apps.publicidad.context_processors.banners_activos_context",
            ],
        },
    },
]

# ==============================================================================
# 6. BASE DE DATOS RELACIONAL: MYSQL 8.0 (OPTIMIZADA PARA PRODUCCIÓN)
# ==============================================================================
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("MYSQL_DATABASE", "diario_tech_db"),
        "USER": os.getenv("MYSQL_USER", "diario_tech_user"),
        "PASSWORD": os.getenv("MYSQL_PASSWORD", ""),
        "HOST": os.getenv("MYSQL_HOST", "127.0.0.1"),
        "PORT": os.getenv("MYSQL_PORT", "3306"),
        # Persistencia de conexiones para reducir latencia TCP/Handshake en MySQL
        "CONN_MAX_AGE": int(os.getenv("MYSQL_CONN_MAX_AGE", "60")),
        "CONN_HEALTH_CHECKS": True,
        "OPTIONS": {
            "charset": "utf8mb4",
            "use_unicode": True,
            "init_command": (
                "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,"
                "NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION', "
                "innodb_strict_mode=1, "
                " default_storage_engine=INNODB"
            ),
            "connect_timeout": 10,
            "read_timeout": 30,
            "write_timeout": 30,
        },
        "TEST": {
            "CHARSET": "utf8mb4",
            "COLLATION": "utf8mb4_unicode_ci",
        },
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==============================================================================
# 7. CACHÉ Y PERFORMANCE (REDIS EN PRODUCCIÓN / LOCMEM EN DESARROLLO)
# ==============================================================================
REDIS_URL = os.getenv("REDIS_URL", "")

if REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django_redis.cache.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "CLIENT_CLASS": "django_redis.client.DefaultClient",
                "IGNORE_EXCEPTIONS": True,
                "SOCKET_CONNECT_TIMEOUT": 5,
                "SOCKET_TIMEOUT": 5,
            },
            "KEY_PREFIX": "diariotech_v1",
            "TIMEOUT": int(os.getenv("CACHE_DEFAULT_TIMEOUT", "300")),
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "diario-tech-local-cache",
            "TIMEOUT": 300,
        }
    }

# Tiempos de caché granulares para vistas públicas
CACHE_TTL_HOME = int(os.getenv("CACHE_TTL_HOME", "180"))
CACHE_TTL_CATEGORIA = int(os.getenv("CACHE_TTL_CATEGORIA", "300"))
CACHE_TTL_NOTICIA_DETALLE = int(os.getenv("CACHE_TTL_NOTICIA_DETALLE", "600"))

# ==============================================================================
# 8. VALIDACIÓN DE CONTRASEÑAS Y AUTENTICACIÓN
# ==============================================================================
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 10},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LOGIN_URL = "usuarios:login"
LOGIN_REDIRECT_URL = "noticias:portada"
LOGOUT_REDIRECT_URL = "noticias:portada"

# ==============================================================================
# 9. INTERNACIONALIZACIÓN Y ZONA HORARIA
# ==============================================================================
LANGUAGE_CODE = "es-ar"
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "America/Argentina/Buenos_Aires")
USE_I18N = True
USE_TZ = True

# ==============================================================================
# 10. ARCHIVOS ESTÁTICOS (CSS/JS) Y MULTIMEDIA (IMÁGENES OPTIMIZADAS WEBP)
# ==============================================================================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Límites de subida de imágenes (10 MB máximo por archivo)
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024

# Parámetros globales de optimización Pillow -> WebP
IMAGE_MAX_WIDTH_HERO = 1600
IMAGE_MAX_HEIGHT_HERO = 900
IMAGE_WEBP_QUALITY = 82

# ==============================================================================
# 11. CONFIGURACIÓN DE CKEDITOR 5 (EDITOR RICH TEXT EDITORIAL)
# ==============================================================================
customColorPalette = [
    {"color": "hsl(15, 78%, 34%)", "label": "Terracotta Editorial"},
    {"color": "hsl(224, 64%, 33%)", "label": "Deep Lapis Tech"},
    {"color": "hsl(24, 10%, 10%)", "label": "Charcoal Ink"},
    {"color": "hsl(144, 61%, 20%)", "label": "Forest Cyber"},
]

CKEDITOR_5_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
CKEDITOR_5_UPLOAD_PATH = "noticias/contenido_inline/"

CKEDITOR_5_CONFIGS = {
    "default": {
        "toolbar": [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "codeBlock",
        ],
    },
    "editorial_completo": {
        "blockToolbar": [
            "paragraph",
            "heading1",
            "heading2",
            "heading3",
            "|",
            "bulletedList",
            "numberedList",
            "|",
            "blockQuote",
        ],
        "toolbar": [
            "heading",
            "|",
            "outdent",
            "indent",
            "|",
            "bold",
            "italic",
            "link",
            "underline",
            "strikethrough",
            "code",
            "subscript",
            "superscript",
            "highlight",
            "|",
            "codeBlock",
            "sourceEditing",
            "insertImage",
            "bulletedList",
            "numberedList",
            "todoList",
            "|",
            "blockQuote",
            "imageUpload",
            "|",
            "fontSize",
            "fontFamily",
            "fontColor",
            "fontBackgroundColor",
            "mediaEmbed",
            "removeFormat",
            "insertTable",
        ],
        "image": {
            "toolbar": [
                "imageTextAlternative",
                "|",
                "imageStyle:alignLeft",
                "imageStyle:alignRight",
                "imageStyle:alignCenter",
                "imageStyle:side",
            ],
            "styles": [
                "full",
                "side",
                "alignLeft",
                "alignRight",
                "alignCenter",
            ],
        },
        "table": {
            "contentToolbar": [
                "tableColumn",
                "tableRow",
                "mergeTableCells",
                "tableProperties",
                "tableCellProperties",
            ],
            "tableProperties": {
                "borderColors": customColorPalette,
                "backgroundColors": customColorPalette,
            },
            "tableCellProperties": {
                "borderColors": customColorPalette,
                "backgroundColors": customColorPalette,
            },
        },
        "heading": {
            "options": [
                {
                    "model": "paragraph",
                    "title": "Párrafo",
                    "class": "ck-heading_paragraph",
                },
                {
                    "model": "heading2",
                    "view": "h2",
                    "title": "Subtítulo H2",
                    "class": "ck-heading_heading2",
                },
                {
                    "model": "heading3",
                    "view": "h3",
                    "title": "Sección H3",
                    "class": "ck-heading_heading3",
                },
            ]
        },
        "mediaEmbed": {
            "previewsInData": True,
        },
    },
}

# ==============================================================================
# 12. INTEGRACIÓN DE NEWSLETTER (API / WEBHOOK DESACOPLADO)
# ==============================================================================
NEWSLETTER_PROVIDER = os.getenv("NEWSLETTER_PROVIDER", "brevo")  # brevo | mailchimp | webhook
NEWSLETTER_API_KEY = os.getenv("NEWSLETTER_API_KEY", "")
NEWSLETTER_WEBHOOK_URL = os.getenv(
    "NEWSLETTER_WEBHOOK_URL",
    "https://api.brevo.com/v3/contacts",
)
NEWSLETTER_LIST_ID = os.getenv("NEWSLETTER_LIST_ID", "4")
NEWSLETTER_TIMEOUT_SECONDS = int(os.getenv("NEWSLETTER_TIMEOUT_SECONDS", "8"))

# ==============================================================================
# 13. CONFIGURACIÓN DE BACKUPS AUTOMATIZADOS (MYSQL + MEDIA)
# ==============================================================================
BACKUP_ROOT = BASE_DIR / os.getenv("BACKUP_DIR_NAME", "backups")
BACKUP_RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "14"))
MYSQLDUMP_BINARY = os.getenv("MYSQLDUMP_BINARY", "mysqldump")

# ==============================================================================
# 14. SEGURIDAD Y HARDENING HTTP (PRODUCCIÓN)
# ==============================================================================
# Protección contra XSS, Clickjacking y Content-Type Sniffing
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Protección de Cookies de Sesión y CSRF
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 8  # 8 horas para sesiones editoriales

if not DEBUG:
    SECURE_SSL_REDIRECT = get_bool_env("DJANGO_SECURE_SSL_REDIRECT", default=True)
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    # HTTP Strict Transport Security (HSTS: 1 año)
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ==============================================================================
# 15. AUDITORÍA Y LOGGING ESTRUCTURADO
# ==============================================================================
SIMPLE_HISTORY_HISTORY_CHANGE_REASON_USE_TEXT_FIELD = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} [{name}:{lineno}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO" if not DEBUG else "DEBUG",
    },
    "loggers": {
        "django.security": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
