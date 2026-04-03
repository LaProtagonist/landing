#!/bin/bash

set -euo pipefail

SERVER="${SERVER:-root@144.31.198.70}"
SSH_OPTS="${SSH_OPTS:- -o ServerAliveInterval=30 -o ServerAliveCountMax=20}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_DIR="/srv/static/promo.spi.ski"

echo "Build land2 -> https://promo.spi.ski"
cd "$ROOT_DIR"
npm run build

ssh $SSH_OPTS "$SERVER" "mkdir -p '$REMOTE_DIR'"
rsync -rlptDz --progress --no-owner --no-group "$ROOT_DIR/dist/" "$SERVER:$REMOTE_DIR/"

echo "Done"
