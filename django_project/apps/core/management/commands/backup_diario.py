"""
Management Command: backup_diario
Uso:
  python manage.py backup_diario
  python manage.py backup_diario --retencion=14 --omitir-media

Ejecuta un respaldo automatizado, atómico y seguro para producción:
1. Dump consistente de la base de datos MySQL 8.0 mediante `mysqldump` con
   `--single-transaction`, `--quick`, `--routines`, `--triggers` y `--events`
   comprimido al vuelo con Gzip (.sql.gz) sin exponer la contraseña en `ps aux`.
2. Empaquetado comprimido (.tar.gz) de la carpeta `MEDIA_ROOT` (imágenes WebP).
3. Generación de manifiesto JSON con hashes criptográficos SHA-256.
4. Rotación automática eliminando respaldos con antigüedad mayor a `BACKUP_RETENTION_DAYS`.
"""

import gzip
import hashlib
import json
import os
import shutil
import subprocess
import tarfile
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone


def calcular_sha256(ruta_archivo: Path) -> str:
    """Calcula el hash SHA-256 de un archivo leyendo en bloques de 64 KB."""
    sha256 = hashlib.sha256()
    with ruta_archivo.open("rb") as f:
        for bloque in iter(lambda: f.read(65536), b""):
            sha256.update(bloque)
    return sha256.hexdigest()


class Command(BaseCommand):
    help = (
        "Realiza un backup automatizado de la base de datos MySQL 8.0 (.sql.gz) "
        "y del directorio media/ (.tar.gz) con verificación SHA-256 y rotación por antigüedad."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--retencion",
            type=int,
            default=getattr(settings, "BACKUP_RETENTION_DAYS", 14),
            help="Días de retención antes de purgar backups antiguos (por defecto: 14).",
        )
        parser.add_argument(
            "--omitir-media",
            action="store_true",
            default=False,
            help="Si se especifica, respalda únicamente la base de datos MySQL.",
        )

    def handle(self, *args, **options):
        dias_retencion: int = options["retencion"]
        omitir_media: bool = options["omitir_media"]

        backup_root: Path = Path(getattr(settings, "BACKUP_ROOT", settings.BASE_DIR / "backups"))
        backup_root.mkdir(parents=True, exist_ok=True)

        marca_tiempo = timezone.localtime(timezone.now()).strftime("%Y%m%d_%H%M%S")
        db_conf = settings.DATABASES.get("default", {})

        if "mysql" not in db_conf.get("ENGINE", ""):
            raise CommandError(
                "El comando backup_diario está diseñado para el motor MySQL (django.db.backends.mysql)."
            )

        db_name = db_conf.get("NAME")
        db_user = db_conf.get("USER")
        db_password = db_conf.get("PASSWORD", "")
        db_host = db_conf.get("HOST", "127.0.0.1")
        db_port = str(db_conf.get("PORT", "3306"))
        mysqldump_bin = getattr(settings, "MYSQLDUMP_BINARY", "mysqldump")

        if not shutil.which(mysqldump_bin):
            raise CommandError(
                f"No se encontró el binario '{mysqldump_bin}' en el PATH del servidor."
            )

        archivo_sql_gz = backup_root / f"db_{db_name}_{marca_tiempo}.sql.gz"
        archivo_media_tar = backup_root / f"media_{db_name}_{marca_tiempo}.tar.gz"
        archivo_manifiesto = backup_root / f"manifest_{marca_tiempo}.json"

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f"=== Iniciando Backup Automatizado [{marca_tiempo}] ==="
            )
        )

        # 1. Respaldo consistente de MySQL 8.0 sin bloqueo de tablas InnoDB
        comando_dump = [
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

        # Se inyecta MYSQL_PWD únicamente en el entorno del subproceso para evitar exposición en ps aux
        env_subproceso = os.environ.copy()
        if db_password:
            env_subproceso["MYSQL_PWD"] = db_password

        try:
            with gzip.open(archivo_sql_gz, "wb", compresslevel=6) as gz_out:
                proceso = subprocess.Popen(
                    comando_dump,
                    stdout= subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    env=env_subproceso,
                )
                assert proceso.stdout is not None
                shutil.copyfileobj(proceso.stdout, gz_out)
                _, stderr_data = proceso.communicate(timeout=600)

                if proceso.returncode != 0:
                    detalle_error = stderr_data.decode("utf-8", errors="replace").strip()
                    raise CommandError(
                        f"Error en mysqldump (código {proceso.returncode}): {detalle_error}"
                    )
        except Exception as exc:
            if archivo_sql_gz.exists():
                archivo_sql_gz.unlink()
            raise CommandError(f"Fallo durante el volcado de MySQL: {exc}") from exc

        peso_sql_mb = round(archivo_sql_gz.stat().st_size / (1024 * 1024), 2)
        hash_sql = calcular_sha256(archivo_sql_gz)
        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Base de datos MySQL respaldada: {archivo_sql_gz.name} ({peso_sql_mb} MB | SHA-256: {hash_sql[:16]}...)"
            )
        )

        # 2. Empaquetado comprimido de la carpeta MEDIA_ROOT (Imágenes WebP)
        hash_media = None
        peso_media_mb = 0.0
        media_root = Path(settings.MEDIA_ROOT)

        if not omitir_media and media_root.exists():
            with tarfile.open(archivo_media_tar, "w:gz") as tar:
                tar.add(media_root, arcname="media")
            peso_media_mb = round(archivo_media_tar.stat().st_size / (1024 * 1024), 2)
            hash_media = calcular_sha256(archivo_media_tar)
            self.stdout.write(
                self.style.SUCCESS(
                    f"[OK] Carpeta media/ respaldada: {archivo_media_tar.name} ({peso_media_mb} MB | SHA-256: {hash_media[:16]}...)"
                )
            )

        # 3. Escritura de manifiesto de auditoría del backup
        manifiesto = {
            "timestamp": marca_tiempo,
            "fecha_iso": timezone.now().isoformat(),
            "database": {
                "archivo": archivo_sql_gz.name,
                "peso_mb": peso_sql_mb,
                "sha256": hash_sql,
            },
            "media": (
                {
                    "archivo": archivo_media_tar.name,
                    "peso_mb": peso_media_mb,
                    "sha256": hash_media,
                }
                if hash_media
                else None
            ),
            "retencion_dias": dias_retencion,
        }
        archivo_manifiesto.write_text(
            json.dumps(manifiesto, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

        # 4. Política de retención: purga automática de archivos antiguos
        limite_antiguedad = datetime.now() - timedelta(days=dias_retencion)
        archivos_eliminados = 0

        for archivo_existente in backup_root.iterdir():
            if not archivo_existente.is_file():
                continue
            if archivo_existente.name.startswith(("db_", "media_", "manifest_")):
                fecha_mod = datetime.fromtimestamp(archivo_existente.stat().st_mtime)
                if fecha_mod < limite_antiguedad:
                    archivo_existente.unlink()
                    archivos_eliminados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"[OK] Política de retención ({dias_retencion} días) aplicada: "
                f"{archivos_eliminados} respaldos antiguos eliminados."
            )
        )
