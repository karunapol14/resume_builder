#!/usr/bin/env bash
set -euo pipefail

echo "Running server deploy script"

# Update and install prerequisites
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release unzip

# Install Docker if missing
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt update
  apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

echo "Ensuring docker service is running"
systemctl enable --now docker

echo "Building and starting production compose"
cd "$(dirname "$0")/.."
docker compose -f deploy/docker-compose.production.yml up -d --build

echo "Waiting for Postgres to be ready..."
DB_CID="$(docker compose -f deploy/docker-compose.production.yml ps -q db)"
until docker compose -f deploy/docker-compose.production.yml exec -T db pg_isready -U resume >/dev/null 2>&1; do
  echo "Postgres not ready yet - sleeping 2s"
  sleep 2
done

echo "Applying DB schema"
docker cp backend/schema.sql ${DB_CID}:/schema.sql
docker compose -f deploy/docker-compose.production.yml exec -T db psql -U resume -d resume_builder -f /schema.sql

echo "Deployment finished. Check services with: docker compose -f deploy/docker-compose.production.yml ps"
