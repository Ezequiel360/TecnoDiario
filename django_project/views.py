"""
Vistas Públicas, Servicio de Newsletter, Redirección Publicitaria y Robots.txt
para Diario Digital Tecnológico (Django 5.1.x + MySQL 8.0).

Incluye:
1. apps/noticias/views.py: PortadaView, NoticiaDetalleView, NoticiaPorCategoriaView,
   NoticiaPorEtiquetaView, NoticiaPorAutorView, BuscarNoticiasView.
2. apps/newsletter/services.py & apps/newsletter/views.py: Servicio HTTP desacoplado
   (Brevo / Mailchimp / Webhook) + SuscribirNewsletterView y CancelarSuscripcionView.
3. apps/publicidad/views.py: RegistrarClicAnuncioView (conteo atómico con F() en MySQL).
4. apps/core/views.py: RobotsTxtView (generación dinámica de /robots.txt).
5. Context Processors optimizados con caché (core, noticias, publicidad).
"""

import json
import logging
import requests

from django.conf import settings
from django.contrib import messages
from django.core.cache import cache
from django.core.paginator import Paginator
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db.models import F
from django.http import (
    Http404,
    HttpRequest,
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseRedirect,
    JsonResponse,
)
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_GET, require_POST
from django.views.generic import DetailView, ListView, TemplateView

from apps.core.models import ConfiguracionSitio
from apps.newsletter.models import LogSincronizacionNewsletter, Suscriptor
from apps.noticias.models import Categoria, Etiqueta, Noticia
from apps.publicidad.models import Anuncio
from apps.usuarios.models import Usuario

logger = logging.getLogger("apps")


# ==============================================================================
# 1. APLICACIÓN: NOTICIAS (apps/noticias/views.py)
# ==============================================================================
class PortadaView(TemplateView):
    """
    Vista principal (Home) del Diario Digital Tecnológico.
    Implementa jerarquía editorial de 3 niveles libre de consultas N+1 en MySQL 8.0:
    1. Noticia Principal Destacada (HERO).
    2. Grilla de Noticias Secundarias Destacadas (hasta 3 artículos).
    3. Listado paginado de Últimas Noticias Publicadas/Programadas cumplidas.
    """

    template_name = "noticias/portada.html"
    noticias_por_pagina = 10

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # El manager Noticia.publicadas ya aplica:
        # - Filtro de estado PUBLICADO o PROGRAMADO con fecha_publicacion <= timezone.now()
        # - select_related("categoria", "autor", "editor_revisor")
        # - prefetch_related("etiquetas")
        qs_visibles = Noticia.publicadas.all()

        # 1. Noticia Hero principal
        noticia_hero = (
            qs_visibles.filter(nivel_destacado=Noticia.NivelDestacado.HERO).first()
            or qs_visibles.first()
        )

        # 2. Grilla de Noticias Secundarias Destacadas (excluyendo la Hero)
        ids_excluidos = [noticia_hero.pk] if noticia_hero else []
        noticias_secundarias = list(
            qs_visibles.exclude(pk__in=ids_excluidos).filter(
                nivel_destacado=Noticia.NivelDestacado.SECUNDARIA
            )[:3]
        )
        ids_excluidos.extend([n.pk for n in noticias_secundarias])

        # 3. Últimas noticias publicadas con paginación eficiente
        qs_ultimas = qs_visibles.exclude(pk__in=ids_excluidos)
        paginator = Paginator(qs_ultimas, self.noticias_por_pagina)
        page_number = self.request.GET.get("page", 1)
        page_obj = paginator.get_page(page_number)

        # 4. Ranking de las 5 notas más leídas de la semana (consulta indexada ligera)
        hace_siete_dias = timezone.now() - timezone.timedelta(days=7)
        mas_leidas = list(
            qs_visibles.filter(fecha_publicacion__gte=hace_siete_dias)
            .order_by("-vistas_totales", "-fecha_publicacion")[:5]
        )

        context.update(
            {
                "noticia_hero": noticia_hero,
                "noticias_secundarias": noticias_secundarias,
                "ultimas_noticias": page_obj.object_list,
                "page_obj": page_obj,
                "is_paginated": page_obj.has_other_pages(),
                "mas_leidas": mas_leidas,
                "seo_title": getattr(
                    settings,
                    "SITE_NAME",
                    "Diario Digital Tecnológico | Portada",
                ),
            }
        )
        return context


class NoticiaDetalleView(DetailView):
    """
    Vista individual de artículo periodístico.
    - Resuelve por SlugField único.
    - Verifica visibilidad (PUBLICADO o PROGRAMADO cuya fecha ya se cumplió, salvo staff/autor).
    - Incrementa de forma atómica el contador de lecturas en MySQL con F('vistas_totales') + 1.
    - Inyecta noticias relacionadas y metadatos OpenGraph / Twitter Cards para el <head>.
    """

    model = Noticia
    template_name = "noticias/detalle_noticia.html"
    context_object_name = "noticia"
    slug_field = "slug"
    slug_url_kwarg = "slug"

    def get_queryset(self):
        # Si el usuario autenticado es Staff (Admin/Editor/Redactor), permite previsualizar borradores propios
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            qs = Noticia.objects.con_relaciones_optimizadas()
            if getattr(user, "puede_publicar_directamente", False) or user.is_superuser:
                return qs
            return qs.filter(autor=user) | Noticia.publicadas.all()

        return Noticia.publicadas.all()

    def get_object(self, queryset=None):
        obj: Noticia = super().get_object(queryset=queryset)
        # Incremento atómico en MySQL sólo cuando la nota ya es pública
        if obj.estado == Noticia.EstadoPublicacion.PUBLICADO or (
            obj.estado == Noticia.EstadoPublicacion.PROGRAMADO
            and obj.fecha_publicacion <= timezone.now()
        ):
            obj.incrementar_vistas()
            obj.vistas_totales += 1
        return obj

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        noticia: Noticia = self.object
        url_absoluta = self.request.build_absolute_uri(noticia.get_absolute_url())
        imagen_og = (
            self.request.build_absolute_uri(noticia.imagen_principal.url)
            if noticia.imagen_principal
            else ""
        )

        context.update(
            {
                "noticias_relacionadas": noticia.obtener_noticias_relacionadas(limite=3),
                # Metadatos SEO y OpenGraph / Twitter Cards dinámicos para templates/base.html
                "seo_title": noticia.seo_title,
                "seo_description": noticia.seo_description,
                "canonical_url": noticia.canonical_url or url_absoluta,
                "og_type": "article",
                "og_image": imagen_og,
                "og_published_time": noticia.fecha_publicacion.isoformat(),
                "og_author": noticia.autor.nombre_publico,
                "twitter_creator": f"@{noticia.autor.x_handle}" if noticia.autor.x_handle else "",
            }
        )
        return context


class NoticiaPorCategoriaView(ListView):
    """
    Vista filtrada por sección/categoría (Hardware, IA, Ciberseguridad, Desarrollo, etc.).
    Utiliza el índice compuesto MySQL `idx_noticia_cat_estado_fecha`.
    """

    model = Noticia
    template_name = "noticias/lista_categoria.html"
    context_object_name = "noticias"
    paginate_by = 12

    def get_queryset(self):
        self.categoria = get_object_or_404(
            Categoria,
            slug=self.kwargs["slug"],
            activa=True,
        )
        return Noticia.publicadas.filter(categoria=self.categoria)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "categoria": self.categoria,
                "seo_title": self.categoria.meta_title or f"{self.categoria.nombre} | {settings.SITE_NAME}",
                "seo_description": self.categoria.meta_description or self.categoria.descripcion,
            }
        )
        return context


class NoticiaPorEtiquetaView(ListView):
    """
    Vista filtrada por etiqueta transversal (Tag).
    """

    model = Noticia
    template_name = "noticias/lista_etiqueta.html"
    context_object_name = "noticias"
    paginate_by = 12

    def get_queryset(self):
        self.etiqueta = get_object_or_404(Etiqueta, slug=self.kwargs["slug"])
        return Noticia.publicadas.filter(etiquetas=self.etiqueta)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "etiqueta": self.etiqueta,
                "seo_title": f"Artículos sobre #{self.etiqueta.nombre} | {settings.SITE_NAME}",
                "seo_description": f"Cobertura técnica y noticias etiquetadas con {self.etiqueta.nombre} en {settings.SITE_NAME}.",
            }
        )
        return context


class NoticiaPorAutorView(ListView):
    """
    Vista pública del perfil periodístico del autor y su archivo cronológico de notas.
    Utiliza el índice compuesto MySQL `idx_noticia_autor_fecha`.
    """

    model = Noticia
    template_name = "noticias/lista_autor.html"
    context_object_name = "noticias"
    paginate_by = 12

    def get_queryset(self):
        self.autor = get_object_or_404(
            Usuario,
            slug=self.kwargs["slug"],
            is_active=True,
        )
        return Noticia.publicadas.filter(autor=self.autor)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "autor": self.autor,
                "seo_title": f"{self.autor.nombre_publico} — Artículos y Análisis | {settings.SITE_NAME}",
                "seo_description": self.autor.biografia_corta
                or f"Archivo de publicaciones de {self.autor.nombre_publico} en {settings.SITE_NAME}.",
            }
        )
        return context


class BuscarNoticiasView(ListView):
    """
    Buscador de noticias por texto en título, bajada/resumen, contenido Rich Text y etiquetas.
    """

    model = Noticia
    template_name = "noticias/resultados_busqueda.html"
    context_object_name = "noticias"
    paginate_by = 12

    def get_queryset(self):
        self.termino_busqueda = self.request.GET.get("q", "").strip()[:120]
        if not self.termino_busqueda:
            return Noticia.objects.none()
        return Noticia.objects.buscar_texto(self.termino_busqueda)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            {
                "termino_busqueda": self.termino_busqueda,
                "total_resultados": context["paginator"].count if context.get("paginator") else 0,
                "seo_title": (
                    f"Resultados para «{self.termino_busqueda}» | {settings.SITE_NAME}"
                    if self.termino_busqueda
                    else f"Buscador de Noticias | {settings.SITE_NAME}"
                ),
            }
        )
        return context


# ==============================================================================
# 2. APLICACIÓN: NEWSLETTER — SERVICIO DESACOPLADO Y VISTAS (apps/newsletter/)
# ==============================================================================
class SincronizadorNewsletterService:
    """
    Servicio de dominio desacoplado (`apps/newsletter/services.py`) para sincronizar
    suscriptores con plataformas externas vía API REST / Webhook (Brevo, Mailchimp o Webhook genérico).
    Registra cada intento en `LogSincronizacionNewsletter` para auditoría y reintentos.
    """

    @staticmethod
    def sincronizar_suscriptor(suscriptor: Suscriptor) -> bool:
        proveedor = getattr(settings, "NEWSLETTER_PROVIDER", "brevo").lower()
        api_key = getattr(settings, "NEWSLETTER_API_KEY", "")
        webhook_url = getattr(settings, "NEWSLETTER_WEBHOOK_URL", "")
        list_id = int(getattr(settings, "NEWSLETTER_LIST_ID", "4"))
        timeout_sec = int(getattr(settings, "NEWSLETTER_TIMEOUT_SECONDS", 8))

        categorias_nombres = list(
            suscriptor.categorias_interes.values_list("nombre", flat=True)
        )

        # Construcción del payload según proveedor configurado
        if proveedor == "brevo":
            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": api_key,
            }
            payload = {
                "email": suscriptor.email,
                "attributes": {
                    "NOMBRE": suscriptor.nombre,
                    "INTERESES": ", ".join(categorias_nombres),
                    "ORIGEN": suscriptor.origen_captura,
                },
                "listIds": [list_id],
                "updateEnabled": True,
            }
        else:
            headers = {
                "content-type": "application/json",
                "Authorization": f"Bearer {api_key}" if api_key else "",
            }
            payload = {
                "email": suscriptor.email,
                "nombre": suscriptor.nombre,
                "categorias": categorias_nombres,
                "token_baja": str(suscriptor.token_baja),
                "creado_en": timezone.now().isoformat(),
            }

        # Si no hay API_KEY configurada en entorno local, registrar en modo simulación controlada
        if not api_key or not webhook_url:
            suscriptor.estado_sincronizacion = Suscriptor.EstadoSincronizacion.PENDIENTE
            suscriptor.save(update_fields=["estado_sincronizacion", "actualizado_en"])
            LogSincronizacionNewsletter.objects.create(
                suscriptor=suscriptor,
                proveedor=proveedor,
                codigo_http=202,
                exitoso=True,
                detalle_respuesta="Entorno sin NEWSLETTER_API_KEY; suscriptor encolado localmente en MySQL.",
            )
            return True

        try:
            respuesta = requests.post(
                webhook_url,
                headers=headers,
                data=json.dumps(payload),
                timeout=timeout_sec,
            )
            exito = 200 <= respuesta.status_code < 300
            datos_resp = {}
            try:
                datos_resp = respuesta.json()
            except ValueError:
                datos_resp = {"raw": respuesta.text[:500]}

            suscriptor.estado_sincronizacion = (
                Suscriptor.EstadoSincronizacion.SINCRONIZADO
                if exito
                else Suscriptor.EstadoSincronizacion.ERROR
            )
            suscriptor.ultima_sincronizacion = timezone.now()
            if exito and isinstance(datos_resp, dict) and "id" in datos_resp:
                suscriptor.proveedor_externo_id = str(datos_resp["id"])

            suscriptor.save(
                update_fields=[
                    "estado_sincronizacion",
                    "ultima_sincronizacion",
                    "proveedor_externo_id",
                    "actualizado_en",
                ]
            )

            LogSincronizacionNewsletter.objects.create(
                suscriptor=suscriptor,
                proveedor=proveedor,
                codigo_http=respuesta.status_code,
                exitoso=exito,
                detalle_respuesta=json.dumps(datos_resp, ensure_ascii=False)[:1000],
            )
            return exito

        except requests.RequestException as exc:
            logger.error("Error sincronizando suscriptor %s con %s: %s", suscriptor.email, proveedor, exc)
            suscriptor.estado_sincronizacion = Suscriptor.EstadoSincronizacion.ERROR
            suscriptor.save(update_fields=["estado_sincronizacion", "actualizado_en"])
            LogSincronizacionNewsletter.objects.create(
                suscriptor=suscriptor,
                proveedor=proveedor,
                codigo_http=0,
                exitoso=False,
                detalle_respuesta=str(exc)[:1000],
            )
            return False


class SuscribirNewsletterView(View):
    """
    Controlador de captura de suscriptores en el frontend (`POST /newsletter/suscribir/`).
    Soporta tanto peticiones tradicionales con redirección y mensajes Flash como AJAX/Fetch JSON.
    """

    def post(self, request: HttpRequest) -> HttpResponse:
        email = request.POST.get("email", "").strip().lower()
        nombre = request.POST.get("nombre", "").strip()[:100]
        origen = request.POST.get("origen", "portada_footer").strip()[:60]
        categorias_slugs = request.POST.getlist("categorias")
        es_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest" or (
            "application/json" in request.headers.get("Accept", "")
        )

        try:
            validate_email(email)
        except ValidationError:
            msg_error = "Por favor ingresa una dirección de correo electrónico válida."
            if es_ajax:
                return JsonResponse({"ok": False, "error": msg_error}, status=400)
            messages.error(request, msg_error)
            return redirect(request.META.get("HTTP_REFERER", "noticias:portada"))

        ip_cliente = (
            request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
            or request.META.get("REMOTE_ADDR")
        )

        suscriptor, creado = Suscriptor.objects.get_or_create(
            email=email,
            defaults={
                "nombre": nombre,
                "estado": Suscriptor.EstadoSuscripcion.ACTIVO,
                "ip_origen": ip_cliente,
                "origen_captura": origen,
            },
        )

        if not creado:
            suscriptor.estado = Suscriptor.EstadoSuscripcion.ACTIVO
            if nombre:
                suscriptor.nombre = nombre
            suscriptor.save(update_fields=["estado", "nombre", "actualizado_en"])

        if categorias_slugs:
            cats = Categoria.objects.filter(slug__in=categorias_slugs, activa=True)
            suscriptor.categorias_interes.set(cats)

        SincronizadorNewsletterService.sincronizar_suscriptor(suscriptor)

        msg_exito = "¡Suscripción confirmada! Recibirás nuestro boletín semanal de ingeniería y tecnología."
        if es_ajax:
            return JsonResponse(
                {
                    "ok": True,
                    "mensaje": msg_exito,
                    "estado_sincronizacion": suscriptor.estado_sincronizacion,
                },
                status=201 if creado else 200,
            )

        messages.success(request, msg_exito)
        return redirect(request.META.get("HTTP_REFERER", "noticias:portada"))


class CancelarSuscripcionNewsletterView(View):
    """
    Permite a un lector darse de baja de forma instantánea mediante su token UUID único.
    """

    def get(self, request: HttpRequest, token_baja) -> HttpResponse:
        suscriptor = get_object_or_404(Suscriptor, token_baja=token_baja)
        suscriptor.estado = Suscriptor.EstadoSuscripcion.BAJA
        suscriptor.save(update_fields=["estado", "actualizado_en"])
        messages.info(
            request,
            f"El correo {suscriptor.email} ha sido dado de baja exitosamente del boletín.",
        )
        return redirect("noticias:portada")


# ==============================================================================
# 3. APLICACIÓN: PUBLICIDAD (apps/publicidad/views.py)
# ==============================================================================
class RegistrarClicAnuncioView(View):
    """
    Registra de manera atómica en MySQL el clic sobre un banner publicitario
    (`clics = F('clics') + 1`) y redirige a la URL de destino de la campaña.
    """

    def get(self, request: HttpRequest, pk: int) -> HttpResponseRedirect:
        anuncio = get_object_or_404(Anuncio.objects.vigentes(), pk=pk)
        Anuncio.objects.filter(pk=anuncio.pk).update(clics=F("clics") + 1)
        return HttpResponseRedirect(anuncio.url_destino)


# ==============================================================================
# 4. APLICACIÓN: CORE — VISTA ROBOTS.TXT Y CONTEXT PROCESSORS (apps/core/)
# ==============================================================================
class RobotsTxtView(View):
    """
    Genera dinámicamente el archivo `/robots.txt` indicando las rutas restringidas
    al rastreo y la URL absoluta del `/sitemap.xml` para motores de búsqueda.
    """

    def get(self, request: HttpRequest) -> HttpResponse:
        sitemap_url = request.build_absolute_uri(reverse("django.contrib.sitemaps.views.sitemap"))
        config_sitio = ConfiguracionSitio.objects.first()
        reglas_extra = config_sitio.robots_txt_extra.strip() if config_sitio else ""

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
        if reglas_extra:
            lineas.extend(["", "# Directivas adicionales configuradas en el Panel Editorial", reglas_extra])

        contenido = "\n".join(lineas) + "\n"
        return HttpResponse(contenido, content_type="text/plain; charset=utf-8")


# ==============================================================================
# 5. CONTEXT PROCESSORS GLOBALES CON CACHÉ (Evitan consultas repetitivas en MySQL)
# ==============================================================================
def configuracion_sitio_context(request: HttpRequest) -> dict:
    """Inyecta la instancia única de ConfiguracionSitio cacheada por 10 minutos."""
    config = cache.get("diariotech_configuracion_sitio")
    if config is None:
        config = ConfiguracionSitio.objects.first()
        cache.set("diariotech_configuracion_sitio", config, timeout=600)
    return {
        "configuracion_sitio": config,
        "SITE_NAME": getattr(settings, "SITE_NAME", "Diario Digital Tecnológico"),
        "SITE_URL": getattr(settings, "SITE_URL", "https://www.diariotech.com"),
    }


def categorias_menu_context(request: HttpRequest) -> dict:
    """Inyecta las categorías activas ordenadas para el navbar y footer."""
    categorias = cache.get("diariotech_categorias_menu")
    if categorias is None:
        categorias = list(
            Categoria.objects.filter(activa=True).order_by("orden_menu", "nombre")
        )
        cache.set("diariotech_categorias_menu", categorias, timeout=300)
    return {"categorias_menu": categorias}


def banners_activos_context(request: HttpRequest) -> dict:
    """
    Obtiene en una única consulta MySQL todos los anuncios vigentes por fecha
    y los agrupa en un diccionario por código de ubicación (`HEADER_TOP`, `HOME_MID`, `SIDEBAR_STICKY`, etc.).
    """
    banners_por_slot = cache.get("diariotech_banners_vigentes")
    if banners_por_slot is None:
        banners_por_slot = {}
        anuncios_vigentes = list(Anuncio.objects.vigentes())
        ids_impresos = []

        for anuncio in anuncios_vigentes:
            codigo_slot = anuncio.espacio.codigo
            if codigo_slot not in banners_por_slot:
                banners_por_slot[codigo_slot] = anuncio
                ids_impresos.append(anuncio.pk)

        if ids_impresos:
            Anuncio.objects.filter(pk__in=ids_impresos).update(
                impresiones=F("impresiones") + 1
            )
        cache.set("diariotech_banners_vigentes", banners_por_slot, timeout=120)

    return {"banners_publicitarios": banners_por_slot}
