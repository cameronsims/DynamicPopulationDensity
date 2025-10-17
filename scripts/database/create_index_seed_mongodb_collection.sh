#!/usr/bin/env bash
# Create, index, and seed MongoDB collections for Dynamic Population Density
set -euo pipefail

# ---------- logging helpers ----------
log() { printf "==> %s\n" "$*"; }
err() { printf "[ERR] %s\n" "$*" >&2; }
die() { err "$*"; exit 1; }

# Print a short URI without leaking the password
mask_uri() {
  # input: mongodb://USER:PASSWORD@HOST:PORT/DB?...
  printf "%s\n" "${1}" | sed -E 's#(mongodb://[^:]+):[^@]+@#\1:****@#'
}

# Better error context
trap 'err "Aborted at line $LINENO"; exit 1' ERR

# ---------- config ----------
SECRETS_FILE="/root/mongo-secrets.env"

# Resolve repo/script directory (so we can load the JS file reliably)
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
JS_FILE="${SCRIPT_DIR}/create_index_seed_mongodb_collection.js"

# ---------- preflight checks ----------
log "Checking for secrets file at ${SECRETS_FILE}"
[[ -f "$SECRETS_FILE" ]] || die "Secrets file not found: ${SECRETS_FILE}"
[[ -r "$SECRETS_FILE" ]] || die "Secrets file is not readable: ${SECRETS_FILE}"

# Source once (no duplicate sourcing); shellcheck directive for dynamic path.
# shellcheck disable=SC1090
log "Sourcing secrets file"
source "$SECRETS_FILE"

# Required env vars (using APP_* per your connection below)
: "${APP_USER_1:?Missing APP_USER_1 in ${SECRETS_FILE}}"
: "${APP_PASS_1:?Missing APP_PASS_1 in ${SECRETS_FILE}}"
: "${APP_DB:?Missing APP_DB in ${SECRETS_FILE}}"
: "${BIND_IP:?Missing BIND_IP in ${SECRETS_FILE}}"

DB_URI="mongodb://${APP_USER_1}:${APP_PASS_1}@${BIND_IP}:27017/${APP_DB}?authSource=${APP_DB}"

command -v mongosh >/dev/null 2>&1 || die "mongosh not found. Install MongoDB Shell."

[[ -f "$JS_FILE" ]] || die "Seed/index JS not found: ${JS_FILE}"

log "MongoDB URI: $(mask_uri "$DB_URI")"
log "Using user: ${APP_USER_1}"

# ---------- run: create, index, seed ----------
log "Creating, indexing, and seeding MongoDB collections (via ${JS_FILE})..."
# Prefer --file so mongosh gets good errors/line numbers
mongosh "$DB_URI" --file "$JS_FILE"

# ---------- verify ----------
log "Verifying collections, indexes, and sample data..."
mongosh "$DB_URI" --eval '
  db.getName();
  printjson(db.getCollectionNames());
  print("\n[Index overview]");
  ["nodes","locations","nodeEvents","attendanceHistory","densityHistory"].forEach(c=>{
    if (db.getCollectionInfos({name:c}).length===0) { print(`- ${c}: MISSING`); return; }
    print(`- ${c}:`);
    printjson(db.getCollection(c).getIndexes());
  });
  print("\n[Sample docs]");
  ["locations","nodes"].forEach(c=>{
    print(`\n${c}:`);
    db.getCollection(c).find().limit(5).forEach(d=>printjson(d));
  });
'

log "MongoDB collections, indexes, and initial data seeding completed successfully."
log "You can now start your application. Check logs for any warnings."
exit 0
