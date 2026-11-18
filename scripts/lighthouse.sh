#!/usr/bin/env bash
set -euo pipefail
PORT=4322
OUT="${TMPDIR:-/tmp}"

# Fail fast if anything already holds the port: astro preview would silently
# move to another port and we would audit (and could later kill) the wrong server.
if HOLDER=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null) && [ -n "$HOLDER" ]; then
  echo "port $PORT is already in use; refusing to run:" >&2
  echo "$HOLDER" >&2
  exit 1
fi

npm run build >/dev/null
# Run the astro binary directly (not via npm) so $! is the server itself, and
# pass --ignore-lock so Astro 7 stays in the foreground instead of daemonizing.
node_modules/.bin/astro preview --port "$PORT" --ignore-lock >/dev/null 2>&1 &
PID=$!

# Only ever stop the process we started and its children, never other listeners.
cleanup() {
  pkill -TERM -P "$PID" 2>/dev/null || true
  kill -TERM "$PID" 2>/dev/null || true
  wait "$PID" 2>/dev/null || true
}
trap cleanup EXIT

# true if $1 is $PID or one of its descendants
ours() {
  local p="$1"
  while [ -n "$p" ] && [ "$p" -gt 1 ]; do
    [ "$p" = "$PID" ] && return 0
    p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')
  done
  return 1
}

# Ready only when the listener on $PORT belongs to our process tree.
READY=
for _ in $(seq 1 60); do
  kill -0 "$PID" 2>/dev/null || { echo "preview server exited before listening" >&2; exit 1; }
  for L in $(lsof -t -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true); do
    if ours "$L"; then READY=1; else echo "port $PORT is held by foreign pid $L; refusing to audit" >&2; exit 1; fi
  done
  [ -n "$READY" ] && curl -sf "http://localhost:$PORT" >/dev/null && break
  READY=
  sleep 0.5
done
[ -n "$READY" ] || { echo "preview server did not start on $PORT" >&2; exit 1; }

for form in mobile desktop; do
  npx lighthouse "http://localhost:$PORT" --quiet --chrome-flags="--headless=new" \
    $( [ "$form" = desktop ] && echo "--preset=desktop" ) \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=json --output-path="$OUT/lh-$form.json"
  node -e "const r=require('$OUT/lh-$form.json').categories;const s=Object.fromEntries(Object.entries(r).map(([k,v])=>[k,Math.round(v.score*100)]));console.log('$form',s);if(s.performance<90||s.accessibility<95||s['best-practices']<90||s.seo<90)process.exit(1)"
done
