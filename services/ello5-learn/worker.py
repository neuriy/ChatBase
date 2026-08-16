#!/usr/bin/env python3
"""
Ello5 continuous learning daemon for DigitalOcean (day & night).

Each cycle:
  1) Ingest Hugging Face datasets
  2) Merge Neuriy chat feedback inbox
  3) Rebuild knowledge bank (always — improves bridge brain immediately)
  4) Optional LoRA fine-tune when GPU is present
"""
from __future__ import annotations

import argparse
import json
import signal
import time
from pathlib import Path

from build_knowledge import build
from common import load_config
from ingest_hf import ingest
from train_lora import train

_STOP = False


def _handle_stop(signum, frame):  # noqa: ARG001
    global _STOP
    _STOP = True
    print(json.dumps({"event": "ello5_learn_stopping", "signal": signum}))


def run_cycle(cfg: dict, force_train: bool = False) -> dict:
    started = time.time()
    report: dict = {"started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    try:
        report["hf"] = ingest(cfg)
    except SystemExit as e:
        report["hf"] = {"error": str(e)}
    except Exception as e:  # noqa: BLE001
        report["hf"] = {"error": str(e)[:400]}

    kn = cfg.get("knowledge") or {}
    if kn.get("enabled", True):
        try:
            report["knowledge"] = build(cfg)
        except Exception as e:  # noqa: BLE001
            report["knowledge"] = {"error": str(e)[:400]}

    try:
        report["train"] = train(cfg, force=force_train)
    except Exception as e:  # noqa: BLE001
        report["train"] = {"error": str(e)[:400]}

    report["elapsed_sec"] = round(time.time() - started, 2)
    runs = Path(cfg["_runs_dir"])
    runs.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    (runs / f"cycle-{stamp}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (Path(cfg["_data_dir"]) / "last_cycle.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    return report


def main() -> None:
    ap = argparse.ArgumentParser(description="Ello5 continuous learning worker")
    ap.add_argument("--config", default=None)
    ap.add_argument("--once", action="store_true", help="Run a single cycle and exit")
    ap.add_argument("--force-train", action="store_true")
    ap.add_argument("--cycle-seconds", type=int, default=None)
    args = ap.parse_args()

    signal.signal(signal.SIGINT, _handle_stop)
    signal.signal(signal.SIGTERM, _handle_stop)

    cfg = load_config(args.config)
    cycle = args.cycle_seconds or int(cfg.get("cycle_seconds") or 21600)

    print(
        json.dumps(
            {
                "event": "ello5_learn_start",
                "cycle_seconds": cycle,
                "once": args.once,
                "data_dir": cfg["_data_dir"],
            }
        )
    )

    while not _STOP:
        report = run_cycle(cfg, force_train=args.force_train)
        print(json.dumps({"event": "ello5_learn_cycle", **report}))
        if args.once:
            break
        # Sleep in small chunks so SIGTERM can stop overnight jobs cleanly
        slept = 0
        while slept < cycle and not _STOP:
            time.sleep(min(30, cycle - slept))
            slept += 30

    print(json.dumps({"event": "ello5_learn_exit"}))


if __name__ == "__main__":
    main()
