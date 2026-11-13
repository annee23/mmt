#!/usr/bin/env bash
# Docker-free local Supabase-compatible stack: PostgreSQL + GoTrue (Auth) + PostgREST + gateway.
# Used to verify migrations / RLS / the full application flow on a machine without Docker.
#   usage: scripts/local-stack/start.sh [start|stop|reset]
# Requires: postgres (brew), postgrest (brew install postgrest), a GoTrue binary at $GOTRUE_BIN
#   (git clone https://github.com/supabase/auth && go build -o auth .).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STACK_DIR="${STACK_DIR:-/tmp/mmt-local-stack}"
GOTRUE_BIN="${GOTRUE_BIN:-/tmp/gotrue/auth}"
JWT_SECRET="${JWT_SECRET:-local-dev-jwt-secret-must-be-at-least-32-characters}"
PG_PORT=54322
export PATH="/opt/homebrew/bin:/opt/homebrew/opt/postgresql@16/bin:$PATH"

psql_su() { psql -h 127.0.0.1 -p "$PG_PORT" -U postgres -v ON_ERROR_STOP=1 "$@"; }

stop() {
  for f in gateway postgrest gotrue; do
    [ -f "$STACK_DIR/$f.pid" ] && kill "$(cat "$STACK_DIR/$f.pid")" 2>/dev/null || true
    rm -f "$STACK_DIR/$f.pid"
  done
  [ -d "$STACK_DIR/pgdata" ] && pg_ctl -D "$STACK_DIR/pgdata" stop -m fast 2>/dev/null || true
}

start() {
  mkdir -p "$STACK_DIR"
  if [ ! -d "$STACK_DIR/pgdata" ]; then
    initdb -D "$STACK_DIR/pgdata" -U postgres --auth=trust -E UTF8 >/dev/null
    pg_ctl -D "$STACK_DIR/pgdata" -o "-p $PG_PORT -k $STACK_DIR" -l "$STACK_DIR/pg.log" -w start >/dev/null
    psql_su -d postgres -q <<SQL
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit password 'authenticator';
grant anon, authenticated, service_role to authenticator;
create role supabase_auth_admin login createrole password 'auth' ;
create schema auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;
alter role supabase_auth_admin set search_path = auth, public;
create schema extensions; grant usage on schema extensions to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
SQL
    # GoTrue runs its own migrations on boot
    start_gotrue
    for i in $(seq 1 30); do
      curl -fs "http://127.0.0.1:54332/health" >/dev/null && break || sleep 1
    done
    for f in "$ROOT"/supabase/migrations/*.sql; do psql_su -d postgres -q -f "$f"; done
    psql_su -d postgres -q -c "grant usage on schema public to anon, authenticated, service_role" || true
  else
    pg_ctl -D "$STACK_DIR/pgdata" -o "-p $PG_PORT -k $STACK_DIR" -l "$STACK_DIR/pg.log" -w start >/dev/null
    start_gotrue
  fi
  start_postgrest
  node "$ROOT/scripts/local-stack/gateway.mjs" >"$STACK_DIR/gateway.log" 2>&1 &
  echo $! >"$STACK_DIR/gateway.pid"
  sleep 1
  echo "Local stack ready: API http://127.0.0.1:54321  DB postgresql://postgres@127.0.0.1:$PG_PORT/postgres"
}

start_gotrue() {
  [ -f "$STACK_DIR/gotrue.pid" ] && kill -0 "$(cat "$STACK_DIR/gotrue.pid")" 2>/dev/null && return
  GOTRUE_API_HOST=127.0.0.1 GOTRUE_API_PORT=54332 \
  GOTRUE_DB_DRIVER=postgres \
  DATABASE_URL="postgres://supabase_auth_admin:auth@127.0.0.1:$PG_PORT/postgres?search_path=auth" \
  GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:auth@127.0.0.1:$PG_PORT/postgres?search_path=auth" \
  GOTRUE_DB_NAMESPACE=auth \
  GOTRUE_SITE_URL=http://localhost:3000 \
  GOTRUE_JWT_SECRET="$JWT_SECRET" GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated \
  GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated \
  GOTRUE_DISABLE_SIGNUP=true GOTRUE_MAILER_AUTOCONFIRM=true GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
  API_EXTERNAL_URL=http://127.0.0.1:54321 \
    "$GOTRUE_BIN" >"$STACK_DIR/gotrue.log" 2>&1 &
  echo $! >"$STACK_DIR/gotrue.pid"
}

start_postgrest() {
  cat >"$STACK_DIR/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:authenticator@127.0.0.1:$PG_PORT/postgres"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$JWT_SECRET"
server-host = "127.0.0.1"
server-port = 54331
CONF
  postgrest "$STACK_DIR/postgrest.conf" >"$STACK_DIR/postgrest.log" 2>&1 &
  echo $! >"$STACK_DIR/postgrest.pid"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  reset) stop; rm -rf "$STACK_DIR"; start ;;
esac
