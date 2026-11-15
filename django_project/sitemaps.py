"""
Clases Sitemap Dinámicas para Posicionamiento SEO en Motores de Búsqueda y Google News
(`apps/core/sitemaps.py`).
"""

from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from apps.noticias.models import Categoria, Etiqueta, Noticia
from apps.usuarios.models import Usuario


class PortadaStaticSitemap(Sitemap):
    """Sitemap para la portada principal de actualización continua."""

    priority = 1.0
    changefreq = "always"
    protocol = "https"

    def items(self):
        return ["noticias:portada"]

    def location(self, item):
        return reverse(item)


class NoticiaSitemap(Sitemap):
    """
    Sitemap dinámico de todas las noticias publicadas o programadas cuya fecha ya se cumplió.
    Utiliza Noticia.publicadas para aprovechar el índice MySQL `idx_noticia_estado_fecha`.
    """

    changefreq = "daily"
    priority = 0.9
    protocol = "https"
    limit = 2000

    def items(self):
        return Noticia.publicadas.only("slug", "actualizado_en", "fecha_publicacion")

    def lastmod(self, obj: Noticia):
        return obj.actualizado_en or obj.fecha_publicacion


class CategoriaSitemap(Sitemap):
    """Sitemap de secciones temáticas activas."""

    changefreq = "hourly"
    priority = 0.8
    protocol = "https"

    def items(self):
        return Categoria.objects.filter(activa=True).only("slug", "actualizado_en")

    def lastmod(self, obj: Categoria):
        return obj.actualizado_en


class EtiquetaSitemap(Sitemap):
    """Sitemap de etiquetas (tags) con artículos publicados."""

    changefreq = "weekly"
    priority = 0.6
    protocol = "https"

    def items(self):
        return (
            Etiqueta.objects.filter(noticias__isnull=False)
            .distinct()
            .only("slug", "actualizado_en")
        )

    def lastmod(self, obj: Etiqueta):
        return obj.actualizado_en


class AutorSitemap(Sitemap):
    """Sitemap de perfiles públicos de autores y periodistas del diario."""

    changefreq = "weekly"
    priority = 0.6
    protocol = "https"

    def items(self):
        return (
            Usuario.objects.filter(is_active=True, noticias_escritas__isnull=False)
            .distinct()
            .only("slug", "date_joined")
        )


SITEMAPS_DIARIO = {
    "portada": PortadaStaticSitemap,
    "noticias": NoticiaSitemap,
    "categorias": CategoriaSitemap,
    "etiquetas": EtiquetaSitemap,
    "autores": AutorSitemap,
}
