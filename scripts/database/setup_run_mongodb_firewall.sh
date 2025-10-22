#!/usr/bin/env bash
set -euo pipefail

# MongoDB version (major)
MONGO_MAJOR="${MONGO_MAJOR:-8.0}"

# ---- secret storage (root-only) ----
SECRETS_FILE="/root/mongo-secrets.env"

# Root check
ensure_root() { 
  if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo $0)"; exit 1
  fi
}

# Generate a strong random password
generate_pw() { 
  # generate without URL-breaking symbols
  openssl rand -base64 32 | tr -d '/+=@!$&%:' | cut -c1-24
}


# Request configuration from user
request_configuration() {
  echo "==> Requesting MongoDB and firewall configuration"

  echo "Please enter the IP address to bind in mongod.conf (e.g., 10.51.33.30):"
  read -r BIND_IP
  BIND_IP="${BIND_IP}"

  echo "Please enter the port number to be used (e.g., 27017):"
  read -r PORT
  PORT="${PORT}"

  echo "Would you like to enable firewall to control access to database? (y/n) - recommended for improve security"
  read -r ENABLE_FIREWALL
  if [[ "$ENABLE_FIREWALL" == "y" ]]; then
    echo "Please enter the subnet to allow through the firewall (e.g., 10.51.33.0/24):"
    read -r FIREWALL_SUBNET
    FIREWALL_SUBNET="${FIREWALL_SUBNET}"
  fi

  FIREWALL_SUBNET="${FIREWALL_SUBNET:-Not_configured}"
}

# Create or load secrets into env file
create_or_load_secrets() {
  echo "==> Creating and loading MongoDB secrets"

  # if [[ -f "$SECRETS_FILE" ]]; then
  #   echo "Secrets file $SECRETS_FILE already exists. Loading existing secrets."
  #   # shellcheck disable=SC1090
  #   source "$SECRETS_FILE"
  #   return
  # fi

  echo "Secrets file $SECRETS_FILE does not exist. Creating new secrets."
  # Prompt for admin user/pass and app DB/user/pass
  # with silent prompts, defaults and auto-generated passwords
  echo "Loading MongoDB admin and app users into $SECRETS_FILE."
  echo "Press ENTER to accept defaults or leave password empty to auto-generate."

  # Create admin user
  echo "Requesting MongoDB admin user credentials to load onto $SECRETS_FILE..."

  read -r -p "Mongo admin username [Default -> admin]: " ADMIN_USER_INPUT || true
  ADMIN_USER="${ADMIN_USER_INPUT:-admin}"

  read -r -s -p "Mongo admin password (leave empty to auto-generate): " ADMIN_PASS_INPUT || true
  echo
  if [[ -z "${ADMIN_PASS_INPUT:-}" ]]; then ADMIN_PASS_INPUT="$(generate_pw)"; fi

  # Create app database name
  echo "Requesting application database name to load onto $SECRETS_FILE..."
  read -r -p "App DB name [Default -> dynamicpopulationdensity_db]: " APP_DB_INPUT || true
  APP_DB="${APP_DB_INPUT:-dynamicpopulationdensity_db}"

cat > "$SECRETS_FILE" <<EOF
BIND_IP='$BIND_IP'
PORT='$PORT'
FIREWALL_SUBNET='$FIREWALL_SUBNET'
ENABLE_FIREWALL='$ENABLE_FIREWALL'
MONGO_MAJOR='$MONGO_MAJOR'
ADMIN_USER='$ADMIN_USER'
ADMIN_PASS='$ADMIN_PASS_INPUT'
APP_DB='$APP_DB'
EOF

  # Create initial app users (lab a, b, g, and backend services)
  echo "Requesting initial application users for labs and backend services into $SECRETS_FILE..."

    read -r -p "App DB username for backend services [Default -> dpd_backend_services]: " APP_USER_INPUT || true
  APP_USER_1="${APP_USER_INPUT:-dpd_backend_services}"

  read -r -s -p "App DB password for $APP_USER_1 (leave empty to auto-generate): " APP_PASS_INPUT || true
  echo
  if [[ -z "${APP_PASS_INPUT:-}" ]]; then APP_PASS_INPUT="$(generate_pw)"; fi

cat >> "$SECRETS_FILE" <<EOF
APP_USER_1='$APP_USER_1'
APP_PASS_1='$APP_PASS_INPUT'
EOF

  read -r -p "App DB username for Lab A [Default -> dpd_node_lab_a]: " APP_USER_INPUT || true
  APP_USER_2="${APP_USER_INPUT:-dpd_node_lab_a}"

  read -r -s -p "App DB password for $APP_USER_2 (leave empty to auto-generate): " APP_PASS_INPUT || true
  echo
  if [[ -z "${APP_PASS_INPUT:-}" ]]; then APP_PASS_INPUT="$(generate_pw)"; fi

cat >> "$SECRETS_FILE" <<EOF
APP_USER_2='$APP_USER_2'
APP_PASS_2='$APP_PASS_INPUT'
EOF

  read -r -p "App DB username for Lab B [Default -> dpd_node_lab_b]: " APP_USER_INPUT || true
  APP_USER_3="${APP_USER_INPUT:-dpd_node_lab_b}"

  read -r -s -p "App DB password for $APP_USER_3 (leave empty to auto-generate): " APP_PASS_INPUT || true
  echo
  if [[ -z "${APP_PASS_INPUT:-}" ]]; then APP_PASS_INPUT="$(generate_pw)"; fi

cat >> "$SECRETS_FILE" <<EOF
APP_USER_3='$APP_USER_3'
APP_PASS_3='$APP_PASS_INPUT'
EOF

  read -r -p "App DB username for Lab G [Default -> dpd_node_lab_g]: " APP_USER_INPUT || true
  APP_USER_4="${APP_USER_INPUT:-dpd_node_lab_g}"

  read -r -s -p "App DB password for $APP_USER_4 (leave empty to auto-generate): " APP_PASS_INPUT || true
  echo
  if [[ -z "${APP_PASS_INPUT:-}" ]]; then APP_PASS_INPUT="$(generate_pw)"; fi

cat >> "$SECRETS_FILE" <<EOF
APP_USER_4='$APP_USER_4'
APP_PASS_4='$APP_PASS_INPUT'
EOF


  chmod 600 "$SECRETS_FILE"
  chown root:root "$SECRETS_FILE"
  echo "==> Secrets saved to $SECRETS_FILE (chmod 600)."
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
}

install_mongo() {
  echo "==> Installing MongoDB $MONGO_MAJOR"
  apt-get update -y
  apt-get install -y ca-certificates gnupg lsb-release curl ufw netcat-openbsd
  local CODENAME; CODENAME="$(lsb_release -sc)"
  local KEYRING="/usr/share/keyrings/mongodb-server-${MONGO_MAJOR}.gpg"
  local REPO_LIST="/etc/apt/sources.list.d/mongodb-org-${MONGO_MAJOR}.list"

  echo "Adding MongoDB repository for ${CODENAME}... if not already present."
  if ! [[ -f "$REPO_LIST" ]]; then
    curl -fsSL "https://www.mongodb.org/static/pgp/server-${MONGO_MAJOR}.asc" | gpg --dearmor -o "$KEYRING"
    chmod 644 "$KEYRING"
    echo "deb [ signed-by=${KEYRING} ] https://repo.mongodb.org/apt/ubuntu ${CODENAME}/mongodb-org/${MONGO_MAJOR} multiverse" \
      > "$REPO_LIST"
    apt-get update -y
  fi

  echo "Installing MongoDB packages..."
  apt-get install -y mongodb-org

  echo "Starting mongod service..."
  systemctl start mongod

  echo "Enabling mongod service..."
  systemctl enable mongod

}

# Configure mongod to bind to specified IP without authorization yet
configure_mongod_noauth() {
  echo "==> Configuring mongod to bind IP address to ${BIND_IP} (no authorization yet)"

  local CONF="/etc/mongod.conf"
  cp -a "$CONF" "/etc/mongod.conf.bak.$(date +%s)" || true
  cat > "$CONF" <<EOF

# mongod.conf

# for documentation of all options, see:
#   http://docs.mongodb.org/manual/reference/configuration-options/

# Where and how to store data.
storage:
  dbPath: /var/lib/mongodb
  journal:
    commitIntervalMs: 100 # Default 100
#  engine:
#  wiredTiger:

# Where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

# Network interfaces
net:
  port: ${PORT}
  bindIp: "127.0.0.1,${BIND_IP}" # Listen to local interface or ${BIND_IP}. Comment this line to listen on all interfaces.

# # How the process runs
# processManagement:
#   fork: true # Run in background.
#   pidFilePath: /var/run/mongodb/mongod.pid
#   timeZoneInfo: /usr/share/zoneinfo

EOF

  echo "Restarting mongod with new bind IP..."
  systemctl restart mongod
}

# Create users using MongoDB shell(mongosh) and enable authorization in mongod.conf
create_users_then_enable_auth() {
  echo "==> Creating MongoDB users and enabling authorization"

  # Wait for mongod
  echo "Waiting for mongod to come back..."
  for i in {1..30}; do
    mongosh --quiet --eval 'db.adminCommand({ping:1})' 2>/dev/null && break
    sleep 1
  done

  #Now actually create users (variables substituted safely via env)
  echo "Creating users using MongoDB shell..."
  mongosh <<EOS

use admin
if (!db.getUser("${ADMIN_USER}")) {
  db.createUser({
    user: "${ADMIN_USER}",
    pwd: "${ADMIN_PASS}",
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
      { role: "readWriteAnyDatabase", db: "admin" }
    ]
  });
} else {
  db.updateUser("${ADMIN_USER}", { pwd: "${ADMIN_PASS}" });
}


use ${APP_DB}
print("Successfully connected to database: " + db.getName() + "...");

if (!db.getUser("${APP_USER_1}")) {
  db.createUser({
    user: "${APP_USER_1}",
    pwd: "${APP_PASS_1}",
    roles: [ { role: "dbOwner", db: "${APP_DB}" } ]
  })
} else {
  db.updateUser("${APP_USER_1}", { pwd: "${APP_PASS_1}" });
}

if (!db.getUser("${APP_USER_2}")) {
  db.createUser({
    user: "${APP_USER_2}",
    pwd: "${APP_PASS_2}",
    roles: [ { role: "readWrite", db: "${APP_DB}" } ]
  })
} else {
  db.updateUser("${APP_USER_2}", { pwd: "${APP_PASS_2}" });
}

if (!db.getUser("${APP_USER_3}")) {
  db.createUser({
    user: "${APP_USER_3}",
    pwd: "${APP_PASS_3}",
    roles: [ { role: "readWrite", db: "${APP_DB}" } ]
  })
} else {
  db.updateUser("${APP_USER_3}", { pwd: "${APP_PASS_3}" });
}

if (!db.getUser("${APP_USER_4}")) {
  db.createUser({
    user: "${APP_USER_4}",
    pwd: "${APP_PASS_4}",
    roles: [ { role: "readWrite", db: "${APP_DB}" } ]
  })
} else {
  db.updateUser("${APP_USER_4}", { pwd: "${APP_PASS_4}" });
}
EOS

  # Enable authorization
  echo "==> Enabling MongoDB authorization"

  if ! grep -q '^security:' /etc/mongod.conf; then
    cat >> /etc/mongod.conf <<'EOF'

security:
  authorization: enabled
EOF

echo "Added security block to /etc/mongod.conf"

  else
    # naive replace existing security block
    awk '
      BEGIN{p=1}
      /^security:/{print "security:\n  authorization: enabled"; p=0; next}
      p{print}
    ' /etc/mongod.conf > /etc/mongod.conf.new && mv /etc/mongod.conf.new /etc/mongod.conf
  fi

  echo "Restarting mongod with authorization enabled..."
  systemctl restart mongod

  echo "Waiting for mongod to come back..."
  for i in {1..30}; do
    mongosh --quiet --eval 'db.adminCommand({ping:1})' 2>/dev/null && break
    sleep 1
  done

  echo "MongoDB users created and authorization enabled."
}

# Lock down firewall using UFW
lockdown_firewall() {
  if [[ "$ENABLE_FIREWALL" != "y" ]]; then
    echo "==> Skipping firewall lockdown as per user request."
    return
  fi

  echo "==> Locking down firewall (ufw)"

  # Reset UFW to default state
  echo "Resetting UFW to default state..."
  ufw --force reset

  # Set default policies and allow necessary ports
  echo "Setting default UFW policies and allowing necessary ports..."

  ufw default deny incoming

  echo "Allowing SSH connections (port 22)..."
  ufw allow OpenSSH || true

  # Allow MongoDB from specified subnet
  echo "Allowing MongoDB connections (port 27017) from ${FIREWALL_SUBNET}..."
  ufw allow from "$FIREWALL_SUBNET" to any port $PORT proto tcp || true


  # VPN-specific rules
  echo "Does this server requires VPN to access? (y/n)"
  read -r REQUIRES_VPN

  echo "Does this server has VPN Interface? (y/n) (e.g. tailnet0, tun0, cscotun0)"
  read -r HAS_VPN_IFACE

  if [[ "$REQUIRES_VPN" = "y" && "$HAS_VPN_IFACE" = "y" ]]; then
    echo "Setting up UFW for VPN access..."
    echo "Please enter VPN interface name (Default -> N/A): (e.g. tailnet0, tun0, cscotun0)"
    read -r VPN_IFACE
    VPN_IFACE="${VPN_IFACE:- N/A}"

    # Allow MongoDB only on VPN interface
    # If using VPN interface as the only path in:
    if [[ "$VPN_IFACE" == "N/A" ]]; then
      echo "VPN interface not provided. Skipping VPN-specific UFW rules."
    else
      ufw allow in on "$VPN_IFACE" to any port $PORT proto tcp || true
      echo "Allowed MongoDB access on VPN interface $VPN_IFACE."  
    fi
    
  else
    echo "Skipping VPN-specific UFW rules."
  fi

  # Enable UFW
  echo "Enabling UFW..."
  ufw enable
  ufw status numbered

  echo "Firewall rules applied."
}

# prints length but hides content
mask() { 
  local s="$1"; printf "%s" "$(printf '%*s' "${#s}" '' | tr ' ' '*')"
}

# Print summary of configuration
print_summary() {
  echo "====================================================="
  echo " MongoDB installed and secured."
  echo "  - Bind IP Address              : ${BIND_IP}"
  echo "  - MongoDB Port                 : ${PORT}"
  echo "  - Enabled firewall             : ${ENABLE_FIREWALL}"
  echo "  - Allowed subnet               : ${FIREWALL_SUBNET}"
  echo "  - Allowed VPN Interface        : ${VPN_IFACE:-Not_configured}"
  echo "  - MongoDB Admin                : ${ADMIN_USER} / $(mask "$ADMIN_PASS")"
  echo "  --------------------------------------------------"
  echo "  - App database name            : ${APP_DB}"
  echo "  - Initial Number of App Users  : 4"
  echo "  - Initial App Users detail     :"
  echo "  ------------------------------------------------"
  echo "        - APP_USER_1             : ${APP_USER_1} / $(mask "$APP_PASS_1")"
  echo "        - APP_USER_2             : ${APP_USER_2} / $(mask "$APP_PASS_2")"
  echo "        - APP_USER_3             : ${APP_USER_3} / $(mask "$APP_PASS_3")"
  echo "        - APP_USER_4             : ${APP_USER_4} / $(mask "$APP_PASS_4")"
  echo "  ------------------------------------------------"
  echo "  - Secrets file                 : $SECRETS_FILE (root-only)"
  echo
  echo " From a client(MongoDB shell or Python), use:"
  echo "   mongosh \"mongodb://<enter db username>:<enter password>@${BIND_IP}:${PORT}/${APP_DB}?authSource=${APP_DB}\""
  echo " (Password is stored in $SECRETS_FILE; do not print it to logs.)"
  echo "====================================================="
}

# Main script execution
main() {
  ensure_root
  request_configuration
  create_or_load_secrets
  install_mongo
  configure_mongod_noauth
  create_users_then_enable_auth
  lockdown_firewall
  print_summary
}

# Execute the main function
main
