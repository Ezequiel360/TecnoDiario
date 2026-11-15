"""
Modelos de Datos Relacionales para Diario Digital Tecnológico (Django 5.x + MySQL 8.0).
Incluye:
- apps.core.models: ModeloBaseAuditable y ConfiguracionSitio
- apps.usuarios.models: Usuario personalizado (Roles RBAC) y PerfilAutor
- apps.noticias.models: Categoria, Etiqueta, Noticia (con optimización Pillow a WebP y flujo editorial)
- apps.publicidad.models: EspacioPublicitario y Anuncio (con programación de vigencia)
- apps.newsletter.models: Suscriptor y LogSincronizacionNewsletter
"""

import io
import os
import uuid
from pathlib import Path
from PIL import Image, ImageOps

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.validators import FileExtensionValidator, MinLengthValidator
from django.db import models
from django.db.models import F, Q
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from django_ckeditor_5.fields import CKEditor5Field
from simple_history.models import HistoricalRecords


# ==============================================================================
# UTILIDAD TRANSVERSAL: OPTIMIZACIÓN DE IMÁGENES CON PILLOW (CONVERSIÓN A WEBP)
# ==============================================================================
def optimizar_imagen_a_webp(
    imagen_field,
    max_width: int = 1600,
    max_height: int = 900,
    quality: int = 82,
) -> ContentFile | None:
    """
    Procesa un ImageField en memoria utilizando Pillow:
    1. Corrige la orientación EXIF automáticamente.
    2. Convierte modos CMYK/P/RGBA a RGB (o preserva transparencia en WebP).
    3. Redimensiona proporcionalmente (LANCZOS) si supera las dimensiones máximas.
    4. Codifica y comprime en formato WebP de alta eficiencia.
    """
    if not imagen_field:
        return None

    try:
        imagen_field.open()
        img = Image.open(imagen_field)
        img = ImageOps.exif_transpose(img)

        # Convertir a RGB si el modo no es compatible con WebP estándar
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGB")

        # Redimensionamiento manteniendo la relación de aspecto con filtro LANCZOS
        if img.width > max_width or img.height > max_height:
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="WEBP", quality=quality, optimize=True)
        buffer.seek(0)

        nombre_base = Path(imagen_field.name).stem
        nuevo_nombre = f"{slugify(nombre_base)}-{uuid.uuid4().hex[:8]}.webp"
        return ContentFile(buffer.read(), name=nuevo_nombre)
    except Exception as exc:
        raise ValidationError(
            _(f"Error al procesar y optimizar la imagen con Pillow: {exc}")
        ) from exc


def generar_slug_unico(instance, valor_fuente: str, slug_field_name: str = "slug", max_length: int = 220) -> str:
    """
    Genera un slug único garantizado en la tabla MySQL del modelo,
    añadiendo sufijos incrementales (-2, -3, ...) en caso de colisión.
    """
    slug_base = slugify(valor_fuente)[: max_length - 10]
    if not slug_base:
        slug_base = uuid.uuid4().hex[:12]

    slug_candidato = slug_base
    ModelClass = instance.__class__
    contador = 2

    qs = ModelClass.objects.all()
    if instance.pk:
        qs = qs.exclude(pk=instance.pk)

    while qs.filter(**{slug_field_name: slug_candidato}).exists():
        sufijo = f"-{contador}"
        slug_candidato = f"{slug_base[: max_length - len(sufijo)]}{sufijo}"
        contador += 1

    return slug_candidato


# ==============================================================================
# 1. APLICACIÓN: CORE (apps/core/models.py)
# ==============================================================================
class ModeloBaseAuditable(models.Model):
    """
    Clase abstracta base con marcas de tiempo indexadas para ordenamiento rápido en MySQL.
    """

    creado_en = models.DateTimeField(
        _("Fecha de creación"),
        auto_now_add=True,
        db_index=True,
    )
    actualizado_en = models.DateTimeField(
        _("Última actualización"),
        auto_now=True,
    )

    class Meta:
        abstract = True


class ConfiguracionSitio(ModeloBaseAuditable):
    """
    Configuración global del Diario Digital (SEO por defecto, redes y metadatos).
    """

    nombre_sitio = models.CharField(
        _("Nombre del Diario"),
        max_length=120,
        default="Diario Digital Tecnológico",
    )
    lema_editorial = models.CharField(
        _("Lema / Subtítulo editorial"),
        max_length=200,
        default="Periodismo de ingeniería, ciencia de datos, hardware y cultura digital.",
    )
    meta_title_default = models.CharField(
        _("Meta Title por defecto (SEO)"),
        max_length=70,
        default="Diario Digital Tecnológico | Noticias de IA, Hardware y Ciberseguridad",
    )
    meta_description_default = models.CharField(
        _("Meta Description por defecto (SEO)"),
        max_length=160,
        default="Cobertura rigurosa en español sobre inteligencia artificial, semiconductores, ciberseguridad, desarrollo de software y política tecnológica.",
    )
    email_contacto = models.EmailField(
        _("Correo de redacción"),
        default="redaccion@diariotech.com",
    )
    url_x_twitter = models.URLField(_("URL perfil X / Twitter"), blank=True)
    url_linkedin = models.URLField(_("URL perfil LinkedIn"), blank=True)
    url_github = models.URLField(_("URL organización GitHub"), blank=True)
     robots_txt_extra = models.TextField(
        _("Reglas adicionales para robots.txt"),
        blank=True,
        help_text=_("Directivas personalizadas que se añadirán al archivo robots.txt dinámico."),
    )
    history = HistoricalRecords(inherit=True)

    class Meta:
        app_label = "core"
        db_table = "core_configuracion_sitio"
        verbose_name = _("Configuración del Sitio")
        verbose_name_plural = _("Configuraciones del Sitio")

    def __str__(self) -> str:
        return self.nombre_sitio


# ==============================================================================
# 2. APLICACIÓN: USUARIOS Y PERFILES DE AUTOR (apps/usuarios/models.py)
# ==============================================================================
class Usuario(AbstractUser):
    """
    Modelo de Usuario extendido con soporte de Roles RBAC editoriales:
    - ADMINISTRADOR: Control total sobre usuarios, configuración, publicidad y cualquier nota.
    - EDITOR: Puede revisar, programar y publicar notas de todos los redactores.
    - REDACTOR: Puede crear y editar sus propios artículos en estado Borrador/Revisión.
    """

    class RolEditorial(models.TextChoices):
        ADMINISTRADOR = "ADMIN", _("Administrador General")
        EDITOR = "EDITOR", _("Editor Jefe / Revisor")
        REDACTOR = "REDACTOR", _("Redactor / Periodista")

    email = models.EmailField(
        _("Correo electrónico"),
        unique=True,
        db_index=True,
    )
    rol = models.CharField(
        _("Rol en el Diario"),
        max_length=15,
        choices=RolEditorial.choices,
        default=RolEditorial.REDACTOR,
        db_index=True,
    )
    slug = models.SlugField(
        _("Slug de autor"),
        max_length=150,
        unique=True,
        blank=True,
        db_index=True,
    )
    biografia_corta = models.CharField(
        _("Biografía corta (Byline)"),
        max_length=280,
        blank=True,
        help_text=_("Resumen de 1-2 líneas que aparece debajo de cada noticia publicada."),
    )
    biografia_extendida = models.TextField(
        _("Biografía extendida"),
        blank=True,
    )
    especialidad = models.CharField(
        _("Especialidad tecnológica"),
        max_length=100,
        blank=True,
        help_text=_("Ej: Arquitecturas RISC-V, Ciberseguridad Ofensiva, Sistemas Distribuidos."),
    )
    avatar = models.ImageField(
        _("Fotografía de perfil"),
        upload_to="autores/avatares/%Y/%m/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"])],
    )
    x_handle = models.CharField(
        _("Usuario en X/Twitter"),
        max_length=60,
        blank=True,
        help_text=_("Sin @, ej: martintech"),
    )
    linkedin_url = models.URLField(_("Perfil de LinkedIn"), blank=True)
    github_url = models.URLField(_("Perfil de GitHub"), blank=True)
    history = HistoricalRecords()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    class Meta:
        app_label = "usuarios"
        db_table = "usuarios_usuario"
        verbose_name = _("Usuario / Autor")
        verbose_name_plural = _("Usuarios y Autores")
        indexes = [
            models.Index(fields=["rol", "is_active"], name="idx_usuario_rol_activo"),
            models.Index(fields=["slug"], name="idx_usuario_slug"),
        ]

    def __str__(self) -> str:
        nombre = self.get_full_name()
        return f"{nombre} ({self.get_rol_display()})" if nombre else self.email

    @property
    def nombre_publico(self) -> str:
        return self.get_full_name() or self.username

    @property
    def es_administrador(self) -> bool:
        return self.is_superuser or self.rol == self.RolEditorial.ADMINISTRADOR

    @property
    def puede_publicar_directamente(self) -> bool:
        return self.is_superuser or self.rol in (
            self.RolEditorial.ADMINISTRADOR,
            self.RolEditorial.EDITOR,
        )

    def get_absolute_url(self) -> str:
        return reverse("noticias:por_autor", kwargs={"slug": self.slug})

    def save(self, *args, **kwargs):
        if not self.slug:
            base = self.get_full_name() or self.username or self.email.split("@")[0]
            self.slug = generar_slug_unico(self, base, max_length=150)

        # Optimizar avatar a WebP 400x400 si se subió un archivo nuevo no-webp
        if self.avatar and not str(self.avatar.name).lower().endswith(".webp"):
            webp_content = optimizar_imagen_a_webp(
                self.avatar,
                max_width=400,
                max_height=400,
                quality=85,
            )
            if webp_content:
                self.avatar.save(webp_content.name, webp_content, save=False)

        super().save(*args, **kwargs)


# ==============================================================================
# 3. APLICACIÓN: NOTICIAS, CATEGORÍAS Y ETIQUETAS (apps/noticias/models.py)
# ==============================================================================
class Categoria(ModeloBaseAuditable):
    """
    Secciones temáticas del diario (Hardware, IA, Ciberseguridad, Desarrollo, Política Tech, eSports).
    """

    nombre = models.CharField(
        _("Nombre de la categoría"),
        max_length=80,
        unique=True,
    )
    slug = models.SlugField(
        _("Slug URL"),
        max_length=100,
        unique=True,
        blank=True,
        db_index=True,
    )
    descripcion = models.TextField(
        _("Descripción de la sección"),
        max_length=320,
        blank=True,
    )
    orden_menu = models.PositiveSmallIntegerField(
        _("Orden en barra de navegación"),
        default=10,
        db_index=True,
    )
    activa = models.BooleanField(
        _("Categoría activa"),
        default=True,
        db_index=True,
    )
    # Campos SEO específicos por sección
    meta_title = models.CharField(
        _("Meta Title (SEO)"),
        max_length=70,
        blank=True,
    )
    meta_description = models.CharField(
        _("Meta Description (SEO)"),
        max_length=160,
        blank=True,
    )
    history = HistoricalRecords()

    class Meta:
        app_label = "noticias"
        db_table = "noticias_categoria"
        verbose_name = _("Categoría")
        verbose_name_plural = _("Categorías")
        ordering = ["orden_menu", "nombre"]
        indexes = [
            models.Index(fields=["activa", "orden_menu"], name="idx_cat_activa_orden"),
        ]

    def __str__(self) -> str:
        return self.nombre

    def get_absolute_url(self) -> str:
        return reverse("noticias:por_categoria", kwargs={"slug": self.slug})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generar_slug_unico(self, self.nombre, max_length=100)
        if not self.meta_title:
            self.meta_title = f"{self.nombre} | Diario Digital Tecnológico"[:70]
        if not self.meta_description and self.descripcion:
            self.meta_description = self.descripcion[:160]
        super().save(*args, **kwargs)


class Etiqueta(ModeloBaseAuditable):
    """
    Taxonomía transversal (tags) para agrupar noticias por tecnologías o temas puntuales.
    """

    nombre = models.CharField(
        _("Nombre de la etiqueta"),
        max_length=60,
        unique=True,
    )
    slug = models.SlugField(
        _("Slug URL"),
        max_length=80,
        unique=True,
        blank=True,
        db_index=True,
    )
    history = HistoricalRecords()

    class Meta:
        app_label = "noticias"
        db_table = "noticias_etiqueta"
        verbose_name = _("Etiqueta (Tag)")
        verbose_name_plural = _("Etiquetas (Tags)")
        ordering = ["nombre"]

    def __str__(self) -> str:
        return self.nombre

    def get_absolute_url(self) -> str:
        return reverse("noticias:por_etiqueta", kwargs={"slug": self.slug})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generar_slug_unico(self, self.nombre, max_length=80)
        super().save(*args, **kwargs)


class NoticiaQuerySet(models.QuerySet):
    """
    QuerySet optimizado para MySQL 8.0 que previene consultas N+1 mediante
    select_related y prefetch_related y gestiona publicación programada.
    """

    def con_relaciones_optimizadas(self):
        return self.select_related("categoria", "autor", "editor_revisor").prefetch_related(
            "etiquetas"
        )

    def visibles_en_sitio(self):
        """
        Retorna artículos cuyo estado es PUBLICADO, o bien PROGRAMADO cuya
        fecha_publicacion ya se ha cumplido en el reloj del servidor.
        """
        ahora = timezone.now()
        return (
            self.con_relaciones_optimizadas()
            .filter(
                Q(estado=Noticia.EstadoPublicacion.PUBLICADO)
                | Q(
                    estado=Noticia.EstadoPublicacion.PROGRAMADO,
                    fecha_publicacion__lte=ahora,
                ),
                categoria__activa=True,
                fecha_publicacion__lte=ahora,
            )
            .order_by("-fecha_publicacion")
        )

    def buscar_texto(self, termino: str):
        """
        Búsqueda en título, bajada/resumen y cuerpo de la noticia compatible con índices MySQL.
        """
        termino_limpio = (termino or "").strip()
        if not termino_limpio:
            return self.none()
        return self.visibles_en_sitio().filter(
            Q(titulo__icontains=termino_limpio)
            | Q(bajada__icontains=termino_limpio)
            | Q(contenido__icontains=termino_limpio)
            | Q(etiquetas__nombre__icontains=termino_limpio)
        ).distinct()


class NoticiaPublicadaManager(models.Manager):
    """Manager directo para obtener únicamente noticias visibles al público."""

    def get_queryset(self):
        return NoticiaQuerySet(self.model, using=self._db).visibles_en_sitio()


class Noticia(ModeloBaseAuditable):
    """
    Entidad central del Diario Digital Tecnológico.
    Soporta flujo editorial (Borrador, Programado, Publicado), Rich Text CKEditor 5,
    optimización automática de imagen principal a WebP con Pillow, SEO/OpenGraph
    y auditoría completa con django-simple-history.
    """

    class EstadoPublicacion(models.TextChoices):
        BORRADOR = "BORRADOR", _("Borrador en Redacción")
        PROGRAMADO = "PROGRAMADO", _("Programado para Publicación")
        PUBLICADO = "PUBLICADO", _("Publicado")

    class NivelDestacado(models.TextChoices):
        NORMAL = "NORMAL", _("Noticia Estándar")
        SECUNDARIA = "SECUNDARIA", _("Destacada Secundaria (Grilla Portada)")
        HERO = "HERO", _("Noticia Principal de Portada (Hero)")

    titulo = models.CharField(
        _("Título de la noticia"),
        max_length=200,
        validators=[MinLengthValidator(12)],
        db_index=True,
    )
    slug = models.SlugField(
        _("Slug URL amigable"),
        max_length=220,
        unique=True,
        blank=True,
        db_index=True,
    )
    bajada = models.TextField(
        _("Bajada / Resumen editorial"),
        max_length=420,
        help_text=_("Resumen periodístico que encabeza la nota y alimenta las tarjetas de portada."),
    )
    contenido = CKEditor5Field(
        _("Contenido del artículo (Rich Text)"),
        config_name="editorial_completo",
    )

    # Relaciones clave (con índices relacionales en MySQL)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="noticias",
        verbose_name=_("Categoría principal"),
    )
    etiquetas = models.ManyToManyField(
        Etiqueta,
        related_name="noticias",
        blank=True,
        verbose_name=_("Etiquetas (Tags)"),
    )
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="noticias_escritas",
        verbose_name=_("Autor / Periodista"),
    )
    editor_revisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="noticias_revisadas",
        verbose_name=_("Editor revisor"),
    )

    # Multimedia optimizada automáticamente con Pillow a WebP
    imagen_principal = models.ImageField(
        _("Imagen principal (se optimiza a WebP)"),
        upload_to="noticias/portadas/%Y/%m/",
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"])],
    )
    imagen_alt_text = models.CharField(
        _("Texto alternativo de imagen (Accesibilidad y SEO)"),
        max_length=180,
    )
    epigrafe_imagen = models.CharField(
        _("Epígrafe / Crédito fotográfico"),
        max_length=240,
        blank=True,
    )

    # Flujo de publicación y jerarquía en portada
    estado = models.CharField(
        _("Estado de publicación"),
        max_length=15,
        choices=EstadoPublicacion.choices,
        default=EstadoPublicacion.BORRADOR,
        db_index=True,
    )
    nivel_destacado = models.CharField(
        _("Jerarquía en portada"),
        max_length=15,
        choices=NivelDestacado.choices,
        default=NivelDestacado.NORMAL,
        db_index=True,
    )
    fecha_publicacion = models.DateTimeField(
        _("Fecha y hora de publicación"),
        default=timezone.now,
        db_index=True,
        help_text=_("Si el estado es Programado, la noticia se hará pública automáticamente a partir de esta fecha."),
    )
    tiempo_lectura_minutos = models.PositiveSmallIntegerField(
        _("Tiempo estimado de lectura (minutos)"),
        default=4,
    )
    vistas_totales = models.PositiveIntegerField(
        _("Lecturas acumuladas"),
        default=0,
        editable=False,
    )
    permitir_comentarios = models.BooleanField(
        _("Permitir discusión de lectores"),
        default=True,
    )

    # SEO Avanzado y OpenGraph / Twitter Cards
    meta_title = models.CharField(
        _("Meta Title personalizado (SEO)"),
        max_length=70,
        blank=True,
        help_text=_("Máximo recomendado: 60-70 caracteres. Si se deja vacío, se usa el título de la noticia."),
    )
    meta_description = models.CharField(
        _("Meta Description personalizada (SEO)"),
        max_length=160,
        blank=True,
        help_text=_("Máximo recomendado: 155-160 caracteres. Si se deja vacío, se usa la bajada."),
    )
    canonical_url = models.URLField(
        _("URL Canónica (opcional)"),
        blank=True,
    )

    # Managers
    objects = NoticiaQuerySet.as_manager()
    publicadas = NoticiaPublicadaManager()

    # Registro de auditoría histórica (quién creó, editó o cambió de estado)
    history = HistoricalRecords()

    class Meta:
        app_label = "noticias"
        db_table = "noticias_noticia"
        verbose_name = _("Noticia")
        verbose_name_plural = _("Noticias")
        ordering = ["-fecha_publicacion", "-creado_en"]
        permissions = [
            ("can_publish_noticia", "Puede publicar y programar noticias en portada"),
            ("can_feature_hero", "Puede asignar noticia destacada principal (Hero)"),
        ]
        indexes = [
            # Índice compuesto principal para la consulta de portada y listados públicos
            models.Index(
                fields=["estado", "-fecha_publicacion"],
                name="idx_noticia_estado_fecha",
            ),
            # Índice compuesto para jerarquía Hero y Secundarias en el Home
            models.Index(
                fields=["estado", "nivel_destacado", "-fecha_publicacion"],
                name="idx_noticia_portada_jerarquia",
            ),
            # Índice compuesto para filtrado por categoría sin filesort en MySQL
            models.Index(
                fields=["categoria", "estado", "-fecha_publicacion"],
                name="idx_noticia_cat_estado_fecha",
            ),
            # Índice compuesto para vistas por autor
            models.Index(
                fields=["autor", "estado", "-fecha_publicacion"],
                name="idx_noticia_autor_fecha",
            ),
        ]

    def __str__(self) -> str:
        return f"[{self.get_estado_display()}] {self.titulo}"

    def clean(self):
        """Validaciones de reglas de negocio editoriales antes de persistir."""
        super().clean()
        if (
            self.estado == self.EstadoPublicacion.PROGRAMADO
            and self.fecha_publicacion
            and self.fecha_publicacion <= timezone.now()
        ):
            raise ValidationError(
                {
                    "fecha_publicacion": _(
                        "Para programar una noticia, la fecha y hora de publicación debe ser futura."
                    )
                }
            )

    def calcular_tiempo_lectura(self) -> int:
        """Calcula el tiempo de lectura aproximado (220 palabras por minuto)."""
        import re

        texto_plano = re.sub(r"<[^>]+>", " ", self.contenido or "")
        total_palabras = len(texto_plano.split())
        return max(1, round(total_palabras / 220))

    def incrementar_vistas(self) -> None:
        """Incremento atómico en MySQL evitando condiciones de carrera (Race Conditions)."""
        Noticia.objects.filter(pk=self.pk).update(vistas_totales=F("vistas_totales") + 1)

    def obtener_noticias_relacionadas(self, limite: int = 3):
        """
        Obtiene noticias relacionadas priorizando etiquetas compartidas y misma categoría,
        optimizando la consulta en MySQL.
        """
        etiquetas_ids = list(self.etiquetas.values_list("id", flat=True))
        qs = Noticia.publicadas.exclude(pk=self.pk)
        if etiquetas_ids:
            qs = qs.filter(
                Q(etiquetas__id__in=etiquetas_ids) | Q(categoria_id=self.categoria_id)
            ).distinct()
        else:
            qs = qs.filter(categoria_id=self.categoria_id)
        return qs[:limite]

    def get_absolute_url(self) -> str:
        return reverse("noticias:detalle", kwargs={"slug": self.slug})

    @property
    def seo_title(self) -> str:
        return self.meta_title or self.titulo[:70]

    @property
    def seo_description(self) -> str:
        return self.meta_description or self.bajada[:160]

    def save(self, *args, **kwargs):
        # 1. Generación automática de Slug único
        if not self.slug:
            self.slug = generar_slug_unico(self, self.titulo, max_length=220)

        # 2. Promoción automática si una nota programada ya alcanzó su fecha
        if (
            self.estado == self.EstadoPublicacion.PROGRAMADO
            and self.fecha_publicacion
            and self.fecha_publicacion <= timezone.now()
        ):
            self.estado = self.EstadoPublicacion.PUBLICADO

        # 3. Garantizar una única noticia HERO activa simultáneamente
        if (
            self.nivel_destacado == self.NivelDestacado.HERO
            and self.estado == self.EstadoPublicacion.PUBLICADO
        ):
            Noticia.objects.filter(
                nivel_destacado=self.NivelDestacado.HERO,
                estado=self.EstadoPublicacion.PUBLICADO,
            ).exclude(pk=self.pk).update(
                nivel_destacado=self.NivelDestacado.SECUNDARIA
            )

        # 4. Cálculo automático de tiempo de lectura y campos SEO por defecto
        self.tiempo_lectura_minutos = self.calcular_tiempo_lectura()
        if not self.meta_title:
            self.meta_title = self.titulo[:70]
        if not self.meta_description:
            self.meta_description = self.bajada[:160]

        # 5. Optimización automática de imagen principal a formato WebP con Pillow
        procesar_imagen = False
        if self.imagen_principal:
            if not self.pk:
                procesar_imagen = not str(self.imagen_principal.name).lower().endswith(".webp")
            else:
                original = (
                    Noticia.objects.filter(pk=self.pk)
                    .only("imagen_principal")
                    .first()
                )
                if not original or original.imagen_principal != self.imagen_principal:
                    procesar_imagen = True

        if procesar_imagen:
            imagen_webp = optimizar_imagen_a_webp(
                self.imagen_principal,
                max_width=getattr(settings, "IMAGE_MAX_WIDTH_HERO", 1600),
                max_height=getattr(settings, "IMAGE_MAX_HEIGHT_HERO", 900),
                quality=getattr(settings, "IMAGE_WEBP_QUALITY", 82),
            )
            if imagen_webp:
                self.imagen_principal.save(imagen_webp.name, imagen_webp, save=False)

        super().save(*args, **kwargs)


# ==============================================================================
# 4. APLICACIÓN: PUBLICIDAD Y BANNERS PROGRAMADOS (apps/publicidad/models.py)
# ==============================================================================
class EspacioPublicitario(ModeloBaseAuditable):
    """
    Define las zonas físicas del layout donde pueden renderizarse anuncios.
    """

    class UbicacionSlot(models.TextChoices):
        HEADER_LEADERBOARD = "HEADER_TOP", _("Cabecera Superior (Leaderboard 728x90 / Responsive)")
        HOME_INTERMEDIO = "HOME_MID", _("Portada Entre Secciones (Banner Horizontal)")
        SIDEBAR_ARTICULO = "SIDEBAR_STICKY", _("Columna Derecha en Artículo (300x250 / 300x600)")
        IN_ARTICLE = "IN_ARTICLE", _("Integrado Dentro del Cuerpo de la Noticia")
        FOOTER_BANNER = "FOOTER_WIDE", _("Pie de Página Editorial")

    codigo = models.CharField(
        _("Ubicación en Plantilla"),
        max_length=30,
        choices=UbicacionSlot.choices,
        unique=True,
        db_index=True,
    )
    nombre = models.CharField(
        _("Nombre comercial del espacio"),
        max_length=100,
    )
    dimensiones_sugeridas = models.CharField(
        _("Dimensiones recomendadas (px)"),
        max_length=50,
        default="1200x160",
    )
    activo = models.BooleanField(
        _("Espacio habilitado"),
        default=True,
    )
    history = HistoricalRecords()

    class Meta:
        app_label = "publicidad"
        db_table = "publicidad_espacio"
        verbose_name = _("Espacio Publicitario")
        verbose_name_plural = _("Espacios Publicitarios")

    def __str__(self) -> str:
        return f"{self.nombre} ({self.get_codigo_display()})"


class AnuncioQuerySet(models.QuerySet):
    def vigentes(self):
        ahora = timezone.now()
        return (
            self.select_related("espacio")
            .filter(
                activo=True,
                espacio__activo=True,
                fecha_inicio__lte=ahora,
                fecha_fin__gte=ahora,
            )
            .order_by("-prioridad", "-creado_en")
        )


class Anuncio(ModeloBaseAuditable):
    """
    Banner o campaña publicitaria programada por rango de fechas de vigencia y ubicación.
    """

    titulo_campana = models.CharField(
        _("Nombre de la campaña"),
        max_length=140,
    )
    anunciante = models.CharField(
        _("Empresa / Patrocinador"),
        max_length=120,
    )
    espacio = models.ForeignKey(
        EspacioPublicitario,
        on_delete=models.CASCADE,
        related_name="anuncios",
        verbose_name=_("Ubicación asignada"),
    )
    imagen_desktop = models.ImageField(
        _("Creatividad Desktop (optimizada a WebP)"),
        upload_to="publicidad/banners/%Y/%m/",
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp", "gif"])],
    )
    texto_alternativo = models.CharField(
        _("Texto alternativo / Call to Action"),
        max_length=150,
    )
    url_destino = models.URLField(
        _("URL de destino (con parámetros UTM)"),
        max_length=500,
    )
    abrir_en_nueva_pestana = models.BooleanField(
        _("Abrir en nueva pestaña"),
        default=True,
    )
    fecha_inicio = models.DateTimeField(
        _("Inicio de vigencia"),
        default=timezone.now,
        db_index=True,
    )
    fecha_fin = models.DateTimeField(
        _("Fin de vigencia"),
        db_index=True,
    )
    prioridad = models.PositiveSmallIntegerField(
        _("Prioridad de rotación (1-100)"),
        default=50,
    )
    activo = models.BooleanField(
        _("Campaña activa"),
        default=True,
        db_index=True,
    )
    impresiones = models.PositiveIntegerField(
        _("Impresiones registradas"),
        default=0,
        editable=False,
    )
    clics = models.PositiveIntegerField(
        _("Clics registrados"),
        default=0,
        editable=False,
    )

    objects = AnuncioQuerySet.as_manager()
    history = HistoricalRecords()

    class Meta:
        app_label = "publicidad"
        db_table = "publicidad_anuncio"
        verbose_name = _("Anuncio / Banner")
        verbose_name_plural = _("Anuncios y Banners")
        ordering = ["-prioridad", "-fecha_inicio"]
        indexes = [
            models.Index(
                fields=["activo", "fecha_inicio", "fecha_fin"],
                name="idx_anuncio_vigencia",
            ),
            models.Index(
                fields=["espacio", "activo", "-prioridad"],
                name="idx_anuncio_espacio_prio",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.titulo_campana} - {self.anunciante}"

    def clean(self):
        super().clean()
        if self.fecha_inicio and self.fecha_fin and self.fecha_fin <= self.fecha_inicio:
            raise ValidationError(
                {"fecha_fin": _("La fecha de finalización debe ser posterior a la fecha de inicio.")}
            )

    @property
    def esta_vigente(self) -> bool:
        ahora = timezone.now()
        return self.activo and self.fecha_inicio <= ahora <= self.fecha_fin

    @property
    def ctr_porcentaje(self) -> float:
        if self.impresiones == 0:
            return 0.0
        return round((self.clics / self.impresiones) * 100, 2)

    def save(self, *args, **kwargs):
        if self.imagen_desktop and not str(self.imagen_desktop.name).lower().endswith((".webp", ".gif")):
            webp_banner = optimizar_imagen_a_webp(
                self.imagen_desktop,
                max_width=1440,
                max_height=600,
                quality=85,
            )
            if webp_banner:
                self.imagen_desktop.save(webp_banner.name, webp_banner, save=False)
        super().save(*args, **kwargs)


# ==============================================================================
# 5. APLICACIÓN: NEWSLETTER Y SINCRONIZACIÓN EXTERNA (apps/newsletter/models.py)
# ==============================================================================
class Suscriptor(ModeloBaseAuditable):
    """
    Registro de suscriptores al boletín tecnológico con estado de sincronización
    hacia plataformas externas vía API/Webhook (Brevo / Mailchimp).
    """

    class EstadoSuscripcion(models.TextChoices):
        PENDIENTE = "PENDIENTE", _("Pendiente de Confirmación (Double Opt-In)")
        ACTIVO = "ACTIVO", _("Suscriptor Activo")
        BAJA = "BAJA", _("Dado de Baja (Unsubscribed)")

    class EstadoSincronizacion(models.TextChoices):
        PENDIENTE = "PENDIENTE", _("Pendiente de envío a API externa")
        SINCRONIZADO = "SINCRONIZADO", _("Sincronizado con éxito")
        ERROR = "ERROR", _("Error de sincronización (Reintento programado)")

    email = models.EmailField(
        _("Correo electrónico del suscriptor"),
        unique=True,
        db_index=True,
    )
    nombre = models.CharField(
        _("Nombre (opcional)"),
        max_length=100,
        blank=True,
    )
    categorias_interes = models.ManyToManyField(
        Categoria,
        blank=True,
        related_name="suscriptores",
        verbose_name=_("Categorías de interés"),
    )
    estado = models.CharField(
        _("Estado de suscripción"),
        max_length=15,
        choices=EstadoSuscripcion.choices,
        default=EstadoSuscripcion.ACTIVO,
        db_index=True,
    )
    token_baja = models.UUIDField(
        _("Token seguro de desuscripción"),
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )
    # Trazabilidad de sincronización con servicio externo (Mailchimp / Brevo)
    estado_sincronizacion = models.CharField(
        _("Estado de sincronización API"),
        max_length=15,
        choices=EstadoSincronizacion.choices,
        default=EstadoSincronizacion.PENDIENTE,
        db_index=True,
    )
    proveedor_externo_id = models.CharField(
        _("ID de contacto en plataforma externa"),
        max_length=120,
        blank=True,
    )
    ultima_sincronizacion = models.DateTimeField(
        _("Fecha de última sincronización API"),
        null=True,
        blank=True,
    )
    ip_origen = models.GenericIPAddressField(
        _("IP de registro (Consentimiento GDPR)"),
        null=True,
        blank=True,
    )
    origen_captura = models.CharField(
        _("Ubicación del formulario en el sitio"),
        max_length=60,
        default="portada_footer",
    )
    history = HistoricalRecords()

    class Meta:
        app_label = "newsletter"
        db_table = "newsletter_suscriptor"
        verbose_name = _("Suscriptor de Newsletter")
        verbose_name_plural = _("Suscriptores de Newsletter")
        ordering = ["-creado_en"]
        indexes = [
            models.Index(
                fields=["estado", "estado_sincronizacion"],
                name="idx_news_estado_sync",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.email} ({self.get_estado_display()})"


class LogSincronizacionNewsletter(ModeloBaseAuditable):
    """
    Bitácora de auditoría técnica para envíos hacia el Webhook / API de Newsletter.
    """

    suscriptor = models.ForeignKey(
        Suscriptor,
        on_delete=models.CASCADE,
        related_name="logs_sincronizacion",
    )
    proveedor = models.CharField(
        _("Proveedor (Brevo/Mailchimp/Webhook)"),
        max_length=40,
    )
    codigo_http = models.PositiveSmallIntegerField(
        _("Código de respuesta HTTP"),
        null=True,
        blank=True,
    )
    exitoso = models.BooleanField(
        _("Sincronización exitosa"),
        default=False,
        db_index=True,
    )
    detalle_respuesta = models.TextField(
        _("Payload / Detalle de respuesta"),
        blank=True,
    )

    class Meta:
        app_label = "newsletter"
        db_table = "newsletter_log_sincronizacion"
        verbose_name = _("Log de Sincronización Newsletter")
        verbose_name_plural = _("Logs de Sincronización Newsletter")
        ordering = ["-creado_en"]

    def __str__(self) -> str:
        estado = "OK" if self.exitoso else "ERROR"
        return f"[{estado} - HTTP {self.codigo_http}] {self.suscriptor.email}"
