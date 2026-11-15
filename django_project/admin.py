"""
Configuración Avanzada del Panel Editorial (Django Admin) para Diario Digital Tecnológico.
Incluye:
- Integración con django-simple-history (SimpleHistoryAdmin) para auditoría completa.
- Previsualización segura de miniaturas WebP con format_html.
- Optimización de consultas MySQL 8.0 en el listado admin (select_related / prefetch_related).
- Control de acceso granular (RBAC) en get_queryset(), get_readonly_fields() y has_*_permission().
- Acciones masivas (Bulk Actions) para flujo de publicación editorial y reintento de Webhooks.
"""

from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.db.models import Count
from django.http import HttpRequest
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from simple_history.admin import SimpleHistoryAdmin

from apps.core.models import ConfiguracionSitio
from apps.newsletter.models import LogSincronizacionNewsletter, Suscriptor
from apps.noticias.models import Categoria, Etiqueta, Noticia
from apps.publicidad.models import Anuncio, EspacioPublicitario
from apps.usuarios.models import Usuario

# Personalización de cabeceras globales del Panel de Administración
admin.site.site_header = "Diario Digital Tecnológico · Consejo Editorial"
admin.site.site_title = "Panel Editorial · Diario Digital Tecnológico"
admin.site.index_title = "Gestión de Redacción, Publicidad, Suscriptores y Auditoría"


# ==============================================================================
# 1. ADMIN: CORE (ConfiguracionSitio)
# ==============================================================================
@admin.register(ConfiguracionSitio)
class ConfiguracionSitioAdmin(SimpleHistoryAdmin):
    list_display = (
        "nombre_sitio",
        "email_contacto",
        "meta_title_default",
        "actualizado_en",
    )
    readonly_fields = ("creado_en", "actualizado_en")
    fieldsets = (
        (
            _("Identidad del Medio"),
            {
                "fields": (
                    "nombre_sitio",
                    "lema_editorial",
                    "email_contacto",
                )
            },
        ),
        (
            _("SEO Global por Defecto"),
            {
                "fields": (
                    "meta_title_default",
                    "meta_description_default",
                    "robots_txt_extra",
                )
            },
        ),
        (
            _("Perfiles Oficiales y Redes Sociales"),
            {
                "fields": (
                    "url_x_twitter",
                    "url_linkedin",
                    "url_github",
                )
            },
        ),
        (
            _("Trazabilidad"),
            {
                "fields": ("creado_en", "actualizado_en"),
                "classes": ("collapse",),
            },
        ),
    )

    def has_add_permission(self, request: HttpRequest) -> bool:
        # Patrón Singleton: impide crear múltiples registros si ya existe uno en MySQL
        if ConfiguracionSitio.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request: HttpRequest, obj=None) -> bool:
        return False


# ==============================================================================
# 2. ADMIN: USUARIOS Y PERFILES DE AUTOR (Usuario)
# ==============================================================================
@admin.register(Usuario)
class UsuarioAdmin(SimpleHistoryAdmin, UserAdmin):
    list_display = (
        "miniatura_avatar",
        "email",
        "nombre_publico",
        "badge_rol",
        "especialidad",
        "is_staff",
        "is_active",
    )
    list_display_links = ("email", "nombre_publico")
    list_filter = ("rol", "is_staff", "is_superuser", "is_active", "groups")
    search_fields = ("email", "username", "first_name", "last_name", "especialidad")
    ordering = ("email",)
    readonly_fields = ("vista_previa_avatar", "last_login", "date_joined")
    prepopulated_fields = {"slug": ("first_name", "last_name")}

    fieldsets = (
        (
            _("Credenciales y Rol RBAC"),
            {
                "fields": (
                    "email",
                    "username",
                    "password",
                    "rol",
                )
            },
        ),
        (
            _("Perfil Periodístico / Autor"),
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "slug",
                    "especialidad",
                    "biografia_corta",
                    "biografia_extendida",
                    "avatar",
                    "vista_previa_avatar",
                )
            },
        ),
        (
            _("Redes Profesionales del Autor"),
            {
                "fields": ("x_handle", "linkedin_url", "github_url"),
                "classes": ("collapse",),
            },
        ),
        (
            _("Permisos y Grupos de Django"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            _("Fechas del Sistema"),
            {
                "fields": ("last_login", "date_joined"),
                "classes": ("collapse",),
            },
        ),
    )

    @admin.display(description=_("Avatar"))
    def miniatura_avatar(self, obj: Usuario):
        if obj.avatar:
            return format_html(
                '<img src="{}" alt="{}" style="width:36px;height:36px;object-fit:cover;border-radius:50%;border:1px solid #d6cebe;" />',
                obj.avatar.url,
                obj.nombre_publico,
            )
        return format_html(
            '<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#ebe6df;color:#1c1917;font-weight:600;font-size:12px;">{}</span>',
            (obj.first_name[:1] or obj.email[:1]).upper(),
        )

    @admin.display(description=_("Vista Previa Avatar WebP"))
    def vista_previa_avatar(self, obj: Usuario):
        if obj.avatar:
            return format_html(
                '<img src="{}" alt="{}" style="max-height:140px;border-radius:8px;border:1px solid #d6cebe;" />',
                obj.avatar.url,
                obj.nombre_publico,
            )
        return _("Sin fotografía cargada.")

    @admin.display(description=_("Rol Editorial"), ordering="rol")
    def badge_rol(self, obj: Usuario):
        colores = {
            Usuario.RolEditorial.ADMINISTRADOR: ("#9A3412", "#FFF7ED"),
            Usuario.RolEditorial.EDITOR: ("#1E3A8A", "#EFF6FF"),
            Usuario.RolEditorial.REDACTOR: ("#1C1917", "#F5F5F4"),
        }
        fg, bg = colores.get(obj.rol, ("#1C1917", "#F5F5F4"))
        return format_html(
            '<span style="padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;color:{};background:{};border:1px solid {};">{}</span>',
            fg,
            bg,
            fg,
            obj.get_rol_display(),
        )


# ==============================================================================
# 3. ADMIN: CATEGORÍAS Y ETIQUETAS (Categoria, Etiqueta)
# ==============================================================================
@admin.register(Categoria)
class CategoriaAdmin(SimpleHistoryAdmin):
    list_display = (
        "nombre",
        "slug",
        "orden_menu",
        "activa",
        "total_noticias",
        "actualizado_en",
    )
    list_editable = ("orden_menu", "activa")
    list_filter = ("activa",)
    search_fields = ("nombre", "descripcion", "meta_title")
    prepopulated_fields = {"slug": ("nombre",)}
    readonly_fields = ("creado_en", "actualizado_en")

    def get_queryset(self, request: HttpRequest):
        qs = super().get_queryset(request)
        return qs.annotate(_total_noticias=Count("noticias"))

    @admin.display(description=_("Noticias Asociadas"), ordering="_total_noticias")
    def total_noticias(self, obj: Categoria) -> int:
        return getattr(obj, "_total_noticias", 0)


@admin.register(Etiqueta)
class EtiquetaAdmin(SimpleHistoryAdmin):
    list_display = ("nombre", "slug", "total_usos", "creado_en")
    search_fields = ("nombre", "slug")
    prepopulated_fields = {"slug": ("nombre",)}
    readonly_fields = ("creado_en", "actualizado_en")

    def get_queryset(self, request: HttpRequest):
        qs = super().get_queryset(request)
        return qs.annotate(_total_usos=Count("noticias"))

    @admin.display(description=_("Artículos Etiquetados"), ordering="_total_usos")
    def total_usos(self, obj: Etiqueta) -> int:
        return getattr(obj, "_total_usos", 0)


# ==============================================================================
# 4. ADMIN: NOTICIAS (Panel Editorial Principal con Rich Text, WebP y RBAC)
# ==============================================================================
@admin.register(Noticia)
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
    list_display_links = ("miniatura_portada", "titulo")
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
        "autor__email",
        "etiquetas__nombre",
    )
    prepopulated_fields = {"slug": ("titulo",)}
    autocomplete_fields = ("categoria", "etiquetas", "autor", "editor_revisor")
    date_hierarchy = "fecha_publicacion"
    list_per_page = 25
    save_on_top = True
    actions = [
        "publicar_noticias_seleccionadas",
        "pasar_a_borrador",
        "marcar_como_destacada_secundaria",
    ]

    fieldsets = (
        (
            _("Titular y Cuerpo Periodístico (Rich Text CKEditor 5)"),
            {
                "fields": (
                    "titulo",
                    "slug",
                    "bajada",
                    "contenido",
                )
            },
        ),
        (
            _("Taxonomía y Autoría"),
            {
                "fields": (
                    "categoria",
                    "etiquetas",
                    "autor",
                    "editor_revisor",
                )
            },
        ),
        (
            _("Imagen Principal (Optimización Automática Pillow -> WebP)"),
            {
                "fields": (
                    "imagen_principal",
                    "vista_previa_imagen",
                    "imagen_alt_text",
                    "epigrafe_imagen",
                )
            },
        ),
        (
            _("Flujo Editorial, Programación y Jerarquía en Portada"),
            {
                "fields": (
                    "estado",
                    "nivel_destacado",
                    "fecha_publicacion",
                    "permitir_comentarios",
                    "tiempo_lectura_minutos",
                    "vistas_totales",
                )
            },
        ),
        (
            _("SEO Avanzado y Metadatos OpenGraph / Twitter Cards"),
            {
                "fields": (
                    "meta_title",
                    "meta_description",
                    "canonical_url",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            _("Auditoría de Tiempos"),
            {
                "fields": ("creado_en", "actualizado_en"),
                "classes": ("collapse",),
            },
        ),
    )

    def get_queryset(self, request: HttpRequest):
        """
        1. Optimiza la consulta en MySQL con select_related y prefetch_related (0 consultas N+1).
        2. Aplica aislamiento por rol: los usuarios con rol REDACTOR ven sus propias notas,
           mientras que EDITOR y ADMINISTRADOR gestionan todo el catálogo editorial.
        """
        qs = (
            super()
            .get_queryset(request)
            .select_related("categoria", "autor", "editor_revisor")
            .prefetch_related("etiquetas")
        )
        user: Usuario = request.user  # type: ignore[assignment]
        if user.is_superuser or getattr(user, "puede_publicar_directamente", False):
            return qs
        return qs.filter(autor=user)

    def get_readonly_fields(self, request: HttpRequest, obj: Noticia | None = None):
        base_readonly = [
            "vista_previa_imagen",
            "tiempo_lectura_minutos",
            "vistas_totales",
            "creado_en",
            "actualizado_en",
        ]
        user: Usuario = request.user  # type: ignore[assignment]
        # Si es REDACTOR sin permiso de publicación directa, no puede auto-publicarse ni asignarse Hero
        if not (user.is_superuser or getattr(user, "puede_publicar_directamente", False)):
            base_readonly.extend(["autor", "editor_revisor", "estado", "nivel_destacado"])
        return tuple(base_readonly)

    def get_changeform_initial_data(self, request: HttpRequest):
        initial = super().get_changeform_initial_data(request)
        initial["autor"] = request.user.pk
        return initial

    def save_model(self, request: HttpRequest, obj: Noticia, form, change: bool):
        user: Usuario = request.user  # type: ignore[assignment]
        if not change and not obj.autor_id:
            obj.autor = user

        # Si el usuario es REDACTOR, forzar estado BORRADOR en caso de manipulación del POST
        if not (user.is_superuser or getattr(user, "puede_publicar_directamente", False)):
            obj.estado = Noticia.EstadoPublicacion.BORRADOR
            obj.nivel_destacado = Noticia.NivelDestacado.NORMAL
        elif obj.estado in (
            Noticia.EstadoPublicacion.PUBLICADO,
            Noticia.EstadoPublicacion.PROGRAMADO,
        ):
            obj.editor_revisor = user

        super().save_model(request, obj, form, change)

    @admin.display(description=_("Portada WebP"))
    def miniatura_portada(self, obj: Noticia):
        if obj.imagen_principal:
            return format_html(
                '<img src="{}" alt="{}" style="width:72px;height:44px;object-fit:cover;border-radius:4px;border:1px solid #d6cebe;" />',
                obj.imagen_principal.url,
                obj.imagen_alt_text,
            )
        return "—"

    @admin.display(description=_("Previsualización de Imagen Optimizada (WebP)"))
    def vista_previa_imagen(self, obj: Noticia):
        if obj.imagen_principal:
            return format_html(
                '<div><img src="{}" alt="{}" style="max-width:480px;max-height:270px;object-fit:cover;border-radius:6px;border:1px solid #d6cebe;" /><p style="font-family:monospace;font-size:11px;color:#57534e;margin-top:6px;">Archivo actual: {}</p></div>',
                obj.imagen_principal.url,
                obj.imagen_alt_text,
                obj.imagen_principal.name,
            )
        return _("Sube una imagen JPG/PNG/WebP; al guardar se convertirá automáticamente a WebP.")

    @admin.display(description=_("Estado"), ordering="estado")
    def badge_estado(self, obj: Noticia):
        estilos = {
            Noticia.EstadoPublicacion.PUBLICADO: ("#14532D", "#F0FDF4"),
            Noticia.EstadoPublicacion.PROGRAMADO: ("#1E3A8A", "#EFF6FF"),
            Noticia.EstadoPublicacion.BORRADOR: ("#78350F", "#FEF3C7"),
        }
        fg, bg = estilos.get(obj.estado, ("#1C1917", "#F5F5F4"))
        return format_html(
            '<span style="padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;color:{};background:{};border:1px solid {};">{}</span>',
            fg,
            bg,
            fg,
            obj.get_estado_display(),
        )

    # Acciones masivas (Bulk Actions) protegidas por permisos RBAC
    @admin.action(
        description=_("Publicar inmediatamente las noticias seleccionadas"),
        permissions=["change"],
    )
    def publicar_noticias_seleccionadas(self, request: HttpRequest, queryset):
        user: Usuario = request.user  # type: ignore[assignment]
        if not (user.is_superuser or getattr(user, "puede_publicar_directamente", False)):
            self.message_user(
                request,
                _("No tienes permisos de Editor o Administrador para publicar artículos."),
                level=messages.ERROR,
            )
            return

        actualizadas = queryset.update(
            estado=Noticia.EstadoPublicacion.PUBLICADO,
            editor_revisor=user,
            fecha_publicacion=timezone.now(),
        )
        self.message_user(
            request,
            _(f"{actualizadas} noticias han sido publicadas con éxito."),
            level=messages.SUCCESS,
        )

    @admin.action(
        description=_("Mover noticias seleccionadas a estado Borrador"),
        permissions=["change"],
    )
    def pasar_a_borrador(self, request: HttpRequest, queryset):
        actualizadas = queryset.update(
            estado=Noticia.EstadoPublicacion.BORRADOR,
            nivel_destacado=Noticia.NivelDestacado.NORMAL,
        )
        self.message_user(
            request,
            _(f"{actualizadas} noticias pasaron a estado Borrador."),
            level=messages.WARNING,
        )

    @admin.action(
        description=_("Destacar como Noticia Secundaria de Portada"),
        permissions=["change"],
    )
    def marcar_como_destacada_secundaria(self, request: HttpRequest, queryset):
        user: Usuario = request.user  # type: ignore[assignment]
        if not (user.is_superuser or getattr(user, "puede_publicar_directamente", False)):
            self.message_user(
                request,
                _("Acción reservada para Editores y Administradores."),
                level=messages.ERROR,
            )
            return
        actualizadas = queryset.update(nivel_destacado=Noticia.NivelDestacado.SECUNDARIA)
        self.message_user(
            request,
            _(f"{actualizadas} noticias marcadas como Destacadas Secundarias."),
            level=messages.SUCCESS,
        )


# ==============================================================================
# 5. ADMIN: PUBLICIDAD Y BANNERS PROGRAMADOS (EspacioPublicitario, Anuncio)
# ==============================================================================
@admin.register(EspacioPublicitario)
class EspacioPublicitarioAdmin(SimpleHistoryAdmin):
    list_display = ("nombre", "codigo", "dimensiones_sugeridas", "activo", "actualizado_en")
    list_editable = ("activo",)
    list_filter = ("activo", "codigo")
    search_fields = ("nombre", "codigo")


@admin.register(Anuncio)
class AnuncioAdmin(SimpleHistoryAdmin):
    list_display = (
        "miniatura_banner",
        "titulo_campana",
        "anunciante",
        "espacio",
        "fecha_inicio",
        "fecha_fin",
        "prioridad",
        "activo",
        "impresiones",
        "clics",
        "ctr_display",
    )
    list_filter = ("activo", "espacio", "fecha_inicio", "fecha_fin")
    search_fields = ("titulo_campana", "anunciante", "url_destino")
    readonly_fields = ("vista_previa_banner", "impresiones", "clics", "creado_en", "actualizado_en")
    list_editable = ("prioridad", "activo")

    @admin.display(description=_("Creatividad"))
    def miniatura_banner(self, obj: Anuncio):
        if obj.imagen_desktop:
            return format_html(
                '<img src="{}" alt="{}" style="width:84px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #d6cebe;" />',
                obj.imagen_desktop.url,
                obj.texto_alternativo,
            )
        return "—"

    @admin.display(description=_("Previsualización del Banner"))
    def vista_previa_banner(self, obj: Anuncio):
        if obj.imagen_desktop:
            return format_html(
                '<img src="{}" alt="{}" style="max-width:520px;max-height:220px;object-fit:contain;border-radius:6px;border:1px solid #d6cebe;" />',
                obj.imagen_desktop.url,
                obj.texto_alternativo,
            )
        return _("Sin creatividad cargada.")

    @admin.display(description=_("CTR %"))
    def ctr_display(self, obj: Anuncio) -> str:
        return f"{obj.ctr_porcentaje:.2f}%"


# ==============================================================================
# 6. ADMIN: NEWSLETTER Y LOGS DE SINCRONIZACIÓN (Suscriptor)
# ==============================================================================
class LogSincronizacionInline(admin.TabularInline):
    model = LogSincronizacionNewsletter
    extra = 0
    readonly_fields = ("creado_en", "proveedor", "codigo_http", "exitoso", "detalle_respuesta")
    can_delete = False


@admin.register(Suscriptor)
class SuscriptorAdmin(SimpleHistoryAdmin):
    list_display = (
        "email",
        "nombre",
        "estado",
        "estado_sincronizacion",
        "ultima_sincronizacion",
        "origen_captura",
        "creado_en",
    )
    list_filter = ("estado", "estado_sincronizacion", "origen_captura", "creado_en")
    search_fields = ("email", "nombre", "proveedor_externo_id")
    readonly_fields = (
        "token_baja",
        "ultima_sincronizacion",
        "ip_origen",
        "creado_en",
        "actualizado_en",
    )
    filter_horizontal = ("categorias_interes",)
    inlines = [LogSincronizacionInline]
    actions = ["marcar_para_resincronizar"]

    def get_queryset(self, request: HttpRequest):
        return super().get_queryset(request).prefetch_related("categorias_interes")

    @admin.action(description=_("Marcar suscriptores seleccionados para reintento de sincronización API"))
    def marcar_para_resincronizar(self, request: HttpRequest, queryset):
        total = queryset.update(
            estado_sincronizacion=Suscriptor.EstadoSincronizacion.PENDIENTE
        )
        self.message_user(
            request,
            _(f"{total} suscriptores marcados como PENDIENTE de sincronización externa."),
            level=messages.INFO,
        )
