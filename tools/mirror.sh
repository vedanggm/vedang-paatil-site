#!/usr/bin/env bash
# Step 1 of the rebuild: mirror every static asset from the origin.
# Run from the workspace root:  bash tools/mirror.sh
set -euo pipefail

ORIGIN="https://louisraille.fr"
OUT="mirror"

mkdir -p "$OUT"
cd "$OUT"

wget --mirror --page-requisites --adjust-extension --no-verbose \
     --timeout=20 --tries=3 --waitretry=1 \
     --span-hosts --domains=louisraille.fr,www.louisraille.fr \
     --exclude-domains=cal.com,github.com,instagram.com,linkedin.com \
     --reject-regex='(mailto:|\?.*|/api/)' \
     "$ORIGIN/"

echo "Mirror done → $(pwd)"
