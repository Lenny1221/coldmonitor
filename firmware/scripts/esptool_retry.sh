#!/usr/bin/env bash
# Snelle, betrouwbare flash voor LilyGO T-SIM7670G S3 + carrier-PCB v1.1
# =========================================================================
# De carrier heeft een TPL5010 hardware-watchdog die het bord ~10 s na
# entry in download-mode reset. Daarom moeten we flashen ONDER deze 10 s.
#
# Strategie:
#   - alleen de app op 0x10000 (skip bootloader/partitions die al goed zijn)
#   - 921600 baud met stub  → ~7 s schrijftijd
#   - retry tot N pogingen, want USB-CDC is af en toe instabiel
#
# Voor first-time provisioning op een nieuw bord:
#   FORCE_FULL_UPLOAD=1 ./scripts/esptool_retry.sh
#
# Usage:
#   ./scripts/esptool_retry.sh [PORT] [ENV]
#   PORT default = /dev/cu.usbmodem2101
#   ENV  default = lilygo-t-sim7670g-s3-release
set +e
cd "$(dirname "$0")/.."

PORT="${1:-/dev/cu.usbmodem2101}"
ENV="${2:-lilygo-t-sim7670g-s3-release}"
MAX="${MAX:-10}"

ESPTOOL="$HOME/.platformio/packages/tool-esptoolpy/esptool.py"
PYTHON="${PYTHON:-python3}"
BUILD_DIR=".pio/build/${ENV}"
FW_BIN="${BUILD_DIR}/firmware.bin"
BL_BIN="${BUILD_DIR}/bootloader.bin"
PART_BIN="${BUILD_DIR}/partitions.bin"
BOOT_APP0="$HOME/.platformio/packages/framework-arduinoespressif32/tools/partitions/boot_app0.bin"

if [ ! -f "$FW_BIN" ]; then
  echo "firmware.bin niet gevonden in $BUILD_DIR — eerst bouwen:"
  echo "    pio run -e $ENV"
  exit 1
fi

if [ "${FORCE_FULL_UPLOAD:-0}" = "1" ]; then
  TARGETS=(
    "0x0000" "$BL_BIN"
    "0x8000" "$PART_BIN"
    "0xe000" "$BOOT_APP0"
    "0x10000" "$FW_BIN"
  )
  echo "*** FORCE_FULL_UPLOAD=1: bootloader+partitions+app ***"
else
  TARGETS=("0x10000" "$FW_BIN")
fi

for i in $(seq 1 "$MAX"); do
  echo "=== upload poging $i/$MAX (poort $PORT, env $ENV, 921600 baud) ==="
  if [ ! -e "$PORT" ]; then
    echo "Poort $PORT niet aanwezig, 2s wachten..."
    sleep 2
    [ ! -e "$PORT" ] && { echo "Poort blijft weg, volgende poging..."; sleep 1; continue; }
  fi
  "$PYTHON" "$ESPTOOL" \
      --chip esp32s3 \
      --port "$PORT" \
      --baud 921600 \
      --before default_reset \
      --after hard_reset \
      write_flash \
      --flash_mode qio --flash_freq 80m --flash_size 16MB \
      -z "${TARGETS[@]}"
  rc=$?
  if [ $rc -eq 0 ]; then
    echo "=== SUCCESS op poging $i ==="
    exit 0
  fi
  echo "--- poging $i faalde (rc=$rc), 2s rust ---"
  sleep 2
done

echo "=== $MAX pogingen mislukt ==="
exit 1
