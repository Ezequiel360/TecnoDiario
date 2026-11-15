"""
Management Command: inicializar_roles
Uso: python manage.py inicializar_roles [--sincronizar-usuarios]

Crea de forma idempotente y transaccional en MySQL 8.0 los grupos de roles del
Diario Digital Tecnológico:
1. "Administrador": Control total sobre noticias, categorías, etiquetas, publicidad,
   newsletter, configuración del sitio y usuarios.
2. "Editor": Creación, edición, revisión, programación y publicación de noticias de
   cualquier autor, gestión de taxonomías y lectura de analítica de anuncios/newsletter.
3. "Redactor": Creación y edición de sus propios borradores de noticias y creación
   de etiquetas, sin permiso de publicación directa ni eliminación.
"""

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.core.models import ConfiguracionSitio
from apps.newsletter.models import LogSincronizacionNewsletter, Suscriptor
from apps.noticias.models import Categoria, Etiqueta, Noticia
from apps.publicidad.models import Anuncio, EspacioPublicitario
from apps.usuarios.models import Usuario


MATRIZ_PERMISOS_POR_GRUPO: dict[str, list[tuple[type, list[str]]]] = {
    "Administrador": [
        (
            Noticia,
            [
                "add_noticia",
                "change_noticia",
                "delete_noticia",
                "view_noticia",
                "can_publish_noticia",
                "can_feature_hero",
            ],
        ),
        (
            Categoria,
            ["add_categoria", "change_categoria", "delete_categoria", "view_categoria"],
        ),
        (
            Etiqueta,
            ["add_etiqueta", "change_etiqueta", "delete_etiqueta", "view_etiqueta"],
        ),
        (
            EspacioPublicitario,
            [
                "add_espaciopublicitario",
                "change_espaciopublicitario",
                "delete_espaciopublicitario",
                "view_espaciopublicitario",
            ],
        ),
        (
            Anuncio,
            ["add_anuncio", "change_anuncio", "delete_anuncio", "view_anuncio"],
        ),
        (
            Suscriptor,
            [
                "add_suscriptor",
                "change_suscriptor",
                "delete_suscriptor",
                "view_suscriptor",
            ],
        ),
        (
            LogSincronizacionNewsletter,
            ["view_logsincronizacionnewsletter"],
        ),
        (
            ConfiguracionSitio,
            ["add_configuracionsitio", "change_configuracionsitio", "view_configuracionsitio"],
        ),
        (
            Usuario,
            ["add_usuario", "change_usuario", "delete_usuario", "view_usuario"],
        ),
    ],
    "Editor": [
        (
            Noticia,
            [
                "add_noticia",
                "change_noticia",
                "view_noticia",
                "can_publish_noticia",
                "can_feature_hero",
            ],
        ),
        (
            Categoria,
            ["add_categoria", "change_categoria", "view_categoria"],
        ),
        (
            Etiqueta,
            ["add_etiqueta", "change_etiqueta", "view_etiqueta"],
        ),
        (
            Anuncio,
            ["view_anuncio"],
        ),
        (
            Suscriptor,
            ["view_suscriptor"],
        ),
    ],
    "Redactor": [
        (
            Noticia,
            ["add_noticia", "change_noticia", "view_noticia"],
        ),
        (
            Categoria,
            ["view_categoria"],
        ),
        (
            Etiqueta,
            ["add_etiqueta", "view_etiqueta"],
        ),
    ],
}

MAPEO_ROL_A_GRUPO = {
    Usuario.RolEditorial.ADMINISTRADOR: "Administrador",
    Usuario.RolEditorial.EDITOR: "Editor",
    Usuario.RolEditorial.REDACTOR: "Redactor",
}


class Command(BaseCommand):
    help = (
        "Inicializa y actualiza los Grupos de Roles (Administrador, Editor, Redactor) "
        "con sus permisos exactos en la base de datos MySQL."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--sincronizar-usuarios",
            action="store_true",
            default=True,
            help="Asigna automáticamente a los usuarios existentes su grupo correspondiente según su campo 'rol'.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.MIGRATE_HEADING(
                "=== Inicializando Matriz de Roles y Permisos RBAC (Diario Digital Tecnológico) ==="
            )
        )

        grupos_creados: dict[str, Group] = {}

        for nombre_grupo, reglas_modelos in MATRIZ_PERMISOS_POR_GRUPO.items():
            grupo, creado = Group.objects.get_or_create(name=nombre_grupo)
            grupos_creados[nombre_grupo] = grupo
            permisos_a_asignar: list[Permission] = []

            for modelo_cls, codenames in reglas_modelos:
                ct = ContentType.objects.get_for_model(modelo_cls)
                permisos_encontrados = list(
                    Permission.objects.filter(
                        content_type=ct,
                        codename__in=codenames,
                    )
                )
                permisos_a_asignar.extend(permisos_encontrados)

            grupo.permissions.set(permisos_a_asignar)
            estado_txt = "CREADO" if creado else "ACTUALIZADO"
            self.stdout.write(
                self.style.SUCCESS(
                    f"[OK] Grupo '{nombre_grupo}' ({estado_txt}): "
                    f"{len(permisos_a_asignar)} permisos exactos vinculados."
                )
            )

        if options["sincronizar_usuarios"]:
            usuarios_actualizados = 0
            for usuario in Usuario.objects.all():
                nombre_grupo_destino = MAPEO_ROL_A_GRUPO.get(usuario.rol, "Redactor")
                grupo_destino = grupos_creados[nombre_grupo_destino]

                # Limpiar membresías previas de los 3 grupos editoriales y asignar el actual
                usuario.groups.remove(*grupos_creados.values())
                usuario.groups.add(grupo_destino)

                # Garantizar acceso al panel Django Admin (is_staff=True) para miembros editoriales activos
                if usuario.is_active and not usuario.is_staff:
                    usuario.is_staff = True
                    usuario.save(update_fields=["is_staff"])

                usuarios_actualizados += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"[OK] Sincronización completada: {usuarios_actualizados} usuarios vinculados a sus grupos RBAC."
                )
            )
