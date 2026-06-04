# LilyGO T-SIM7670G S3 + carrier-PCB v1.1 upload-strategie
# =========================================================================
# Probleem: de carrier heeft een TPL5010 hardware-watchdog die het bord ~10 s
# na entry in download-mode reset (zie watchdog_tpl5010.cpp). De standaard
# PIO-uploadflow doet:
#   1. Connect @ 115200, upload stub
#   2. Vraag stub om naar `upload_speed` te switchen     <-- faalt op USB-CDC
#      met al draaiende firmware ("No serial data received")
#   3. Schrijf bootloader + partitions + boot_app0 + app
# Stap 3 op 115200 zou ~80 s duren -> TPL5010 reset het bord halverwege.
#
# Werkende workaround die wij hier installeren:
#   - schrijf ALLEEN de app (0x10000) ipv 4 bestanden  → veel sneller
#   - direct op 921600 baud  → schrijftijd ~7 s (ruim onder 10 s window)
#   - --flash_mode qio (snellere SPI) i.p.v. dio
#
# Voor first-time provisioning (nieuw bord, lege flash) heb je wel de
# volledige set bestanden nodig. Zet dan `FORCE_FULL_UPLOAD=1` in de env:
#     FORCE_FULL_UPLOAD=1 pio run -t upload
import os

Import("env")  # noqa: F821

ESPTOOL_BAUD = os.environ.get("UPLOAD_BAUD", "921600")


def _build_uploadcmd(env):
    python_exe = env.subst("$PYTHONEXE")
    esptool_py = os.path.join(
        env.PioPlatform().get_package_dir("tool-esptoolpy"), "esptool.py"
    )
    flash_mode = env.subst("$BOARD_FLASH_MODE") or "qio"
    flash_size = env.subst("$BOARD_UPLOAD_FLASH_SIZE") or "16MB"

    full_upload = bool(int(os.environ.get("FORCE_FULL_UPLOAD", "0") or "0"))
    if full_upload:
        boot_app0 = os.path.join(
            env.PioPlatform().get_package_dir("framework-arduinoespressif32"),
            "tools", "partitions", "boot_app0.bin",
        )
        targets = (
            f'0x0000 "$BUILD_DIR/bootloader.bin" '
            f'0x8000 "$BUILD_DIR/partitions.bin" '
            f'0xe000 "{boot_app0}" '
            f'0x10000 "$BUILD_DIR/firmware.bin"'
        )
        print(">>> [carrier] FORCE_FULL_UPLOAD=1: bootloader+partitions+app via 921600 stub")
    else:
        targets = '0x10000 "$BUILD_DIR/firmware.bin"'
        print(">>> [carrier] App-only flash (0x10000) via 921600 stub. "
              "Voor full-flash: FORCE_FULL_UPLOAD=1 pio run -t upload")

    cmd = (
        f'"{python_exe}" "{esptool_py}" '
        f'--chip esp32s3 --port "$UPLOAD_PORT" --baud {ESPTOOL_BAUD} '
        f'--before default_reset --after hard_reset '
        f'write_flash --flash_mode {flash_mode} --flash_freq 80m '
        f'--flash_size {flash_size} -z {targets}'
    )
    return cmd


# UPLOADCMD is een PIO/SCons-template-string, geen functie. We bouwen 'm
# meteen op zodat $UPLOAD_PORT en $BUILD_DIR door SCons worden ingevuld
# wanneer het commando wordt uitgevoerd.
env.Replace(UPLOADCMD=_build_uploadcmd(env))  # noqa: F821
