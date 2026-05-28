#!/bin/sh
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8000}"

for var in MONGO_URL JWT_SECRET DB_NAME; do
  eval "val=\$$var"
  if [ -z "$val" ]; then
    echo "[start.sh] FATAL: $var is not set. Railway -> Variables -> add it, then Redeploy." >&2
    exit 1
  fi
done

echo "[start.sh] uvicorn server:app on 0.0.0.0:${PORT} (cwd=$(pwd))"
exec uvicorn server:app --host 0.0.0.0 --port "$PORT"
