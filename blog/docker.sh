#!/bin/bash
# One-command build + start for the asanAI blog (this blog/ folder).
#
#   bash docker.sh --local-port 8080          # build (if needed) + start
#   bash docker.sh --local-port 8080 --build  # build only
#   bash docker.sh --restart                  # rebuild + restart
#   bash docker.sh --down                     # stop + remove
#   bash docker.sh --logs                     # tail logs
#
# The build context is this directory; the whole blog becomes the Apache
# document root (see Dockerfile). No build step is needed — PHP + Apache serve
# the static PHP templates and vendored JS directly.

set -euo pipefail

# Always operate from this directory (where docker-compose.yml / Dockerfile live).
cd "$(dirname "$0")"

LOCAL_PORT="${LOCAL_PORT:-8080}"
ACTION="up"

_sudo() {
	if command -v sudo >/dev/null 2>&1; then
		sudo "$@"
	else
		"$@"
	fi
}

usage() {
	cat <<EOF
Usage: docker.sh [OPTIONS]

Options:
  --local-port N   Local port to expose the blog on (default: ${LOCAL_PORT})
  --up             Build if needed, then start (default)
  --build          Build the image only (do not start)
  --restart        Rebuild and restart the container
  --down           Stop and remove the running container
  --logs           Tail the container logs (Ctrl-C to stop)
  --status         Show container status
  --help, -h       Show this help

When started, the blog is available at:  http://localhost:${LOCAL_PORT}/
EOF
}

require_docker() {
	if ! command -v docker >/dev/null 2>&1; then
		echo "Error: docker is not installed." >&2
		echo "  Debian/Ubuntu:  curl -fsSL https://get.docker.com | sh" >&2
		exit 127
	fi
}

# Prefer the user's docker group membership; fall back to sudo so the script
# works both for regular users and in CI.
docker_compose() {
	local prefix=""
	if command -v sudo >/dev/null 2>&1; then
		if [[ -n "${USER:-}" ]]; then
			id -nG "${USER}" 2>/dev/null | grep -qw docker || prefix="_sudo"
		else
			prefix="_sudo"
		fi
	fi
	if command -v docker-compose >/dev/null 2>&1; then
		${prefix} docker-compose "$@"
	else
		${prefix} docker compose "$@"
	fi
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--local-port) LOCAL_PORT="$2"; shift 2 ;;
		--up)         ACTION="up";      shift ;;
		--build)      ACTION="build";   shift ;;
		--restart)    ACTION="restart"; shift ;;
		--down)       ACTION="down";    shift ;;
		--logs)       ACTION="logs";    shift ;;
		--status)     ACTION="status";  shift ;;
		--help|-h)    usage; exit 0 ;;
		*) echo "Unknown option: $1" >&2; usage; exit 1 ;;
	esac
done

# Persist the chosen port so docker-compose picks it up.
{
	echo "# Local port the blog is exposed on (managed by docker.sh)"
	echo "LOCAL_PORT=${LOCAL_PORT}"
} > .env

case "${ACTION}" in
	build)
		require_docker
		docker_compose build
		;;
	up)
		require_docker
		docker_compose build
		docker_compose up -d
		echo
		echo "asanAI blog is running at:  http://localhost:${LOCAL_PORT}/"
		;;
	restart)
		require_docker
		docker_compose build
		docker_compose up -d
		echo
		echo "asanAI blog (re)started at:  http://localhost:${LOCAL_PORT}/"
		;;
	down)
		require_docker
		docker_compose down
		;;
	logs)
		require_docker
		docker_compose logs -f
		;;
	status)
		require_docker
		docker_compose ps
		;;
esac
