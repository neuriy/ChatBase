#!/usr/bin/env bash
# Bootstrap Ello5 continuous learning on a DigitalOcean droplet.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

python3 -m venv services/ello5-learn/.venv
services/ello5-learn/.venv/bin/pip install -U pip
services/ello5-learn/.venv/bin/pip install -r services/ello5-learn/requirements.txt

mkdir -p data/ello5-learn/inbox data/ello5-learn/runs
touch data/ello5-learn/inbox/chat.jsonl

# Build knowledge from committed seed so Ello5 improves immediately
services/ello5-learn/.venv/bin/python services/ello5-learn/build_knowledge.py

echo "Installed. Test one cycle:"
echo "  services/ello5-learn/.venv/bin/python services/ello5-learn/worker.py --once"
echo "Then enable systemd (as root):"
echo "  cp services/ello5-learn/systemd/ello5-learn.service /etc/systemd/system/"
echo "  systemctl daemon-reload && systemctl enable --now ello5-learn"
