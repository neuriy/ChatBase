# Ello5 continuous learning (DigitalOcean + Hugging Face)

Ello5 improves **automatically day and night** on your DigitalOcean server:

```text
Hugging Face datasets ─┐
                       ├─► ello5-learn worker (24/7) ─► knowledge.jsonl ─► Ello5 brain
Neuriy chat 👍 feedback┘                         └─► optional LoRA (GPU) ─► Ollama ellofive
```

## What runs forever

| Cycle step | Needs GPU? | Effect |
|------------|------------|--------|
| Pull HF datasets (`ultrachat`, `oasst1`, `alpaca`, …) | No | Fresh instruction data |
| Merge Neuriy chat thumbs-up pairs | No | Product-specific learning |
| Rebuild knowledge bank | No | Bridge brain answers improve immediately |
| LoRA fine-tune TinyLlama → promote | **Yes** | Stronger Ollama `ellofive` weights |

CPU droplets still learn 24/7 via the knowledge bank. Add a GPU droplet (or DO GPU) when you want weight updates.

## DigitalOcean setup

```bash
# On the droplet
git clone https://github.com/neuriy/ChatBase.git /opt/neuriy/ChatBase
cd /opt/neuriy/ChatBase
chmod +x services/ello5-learn/install.sh
./services/ello5-learn/install.sh

# Optional HF token (higher rate limits / gated sets)
echo 'HF_TOKEN=hf_xxx' > .env.learn

# One test cycle
services/ello5-learn/.venv/bin/python services/ello5-learn/worker.py --once

# Enable day & night daemon
sudo cp services/ello5-learn/systemd/ello5-learn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ello5-learn
sudo journalctl -u ello5-learn -f
```

Default cycle: **every 6 hours** (`cycle_seconds` in `services/ello5-learn/config.yaml`).

## Hugging Face datasets

Edit `services/ello5-learn/config.yaml`:

```yaml
huggingface:
  datasets:
    - id: HuggingFaceH4/ultrachat_200k
      split: train_sft
      max_rows: 2000
      format: ultrachat
    - id: tatsu-lab/alpaca
      split: train
      max_rows: 2000
      format: alpaca
```

Add any public HF dataset and a small formatter in `ingest_hf.py` if the schema differs.

## Chat → learning

1. User chats in Neuriy
2. Thumbs-up on an assistant reply → `POST /api/learn` → Ello5 `/v1/learn` inbox
3. Next worker cycle merges inbox into `data/ello5-learn/knowledge.jsonl`
4. Bridge reloads knowledge within ~60s (`ELLO5_KNOWLEDGE_RELOAD_MS`)

## Bridge + ChatBase

```bash
npm run ellofive          # bridge reads knowledge bank
npm run ello5:learn:once  # one learning cycle locally
```

Health includes learning stats: `GET http://127.0.0.1:3999/health` → `learning.entries`.

## GPU LoRA (optional)

On a GPU droplet, also install:

```bash
services/ello5-learn/.venv/bin/pip install torch transformers peft accelerate
```

Then training runs in each cycle when CUDA is available. Adapters land in `data/ello5-learn/adapters/ellofive-lora/`. Wire the merged model into Ollama and set `ELLOFIVE_UPSTREAM=http://127.0.0.1:11434`.
