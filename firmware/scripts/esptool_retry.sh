#!/usr/bin/env bash
# Upload-retry voor de carrier-PCB: als het board in een boot-loop zit
# verdwijnt de USB-CDC tussendoor. Probeer tot 15 keer.
set +e
cd "$(dirname "$0")/.."

PORT="${1:-/dev/cu.usbmodem1101}"
ENV="${2:-lilygo-t-sim7670g-s3}"
MAX=${MAX:-15}

for i in $(seq 1 $MAX); do
  echo "=== upload poging $i/$MAX (poort $PORT, env $ENV) ==="
  pio run -e "$ENV" -t upload --upload-port "$PORT"
  rc=$?
  if [ $rc -eq 0 ]; then
    echo "=== SUCCESS op poging $i ==="
    exit 0
  fi
  echo "--- poging $i faalde (rc=$rc), 3s rust ---"
  sleep 3
done

echo "=== $MAX pogingen mislukt ==="
exit 1
