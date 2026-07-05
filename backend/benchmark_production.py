#!/usr/bin/env python3

"""Benchmark the deployed Terra AI backend.

This script targets the production backend over HTTP and can benchmark:
  - /health
  - /ready
  - /api/vision/analyze
  - /api/spatial/scan

It requests opt-in backend diagnostics so the response includes phase timings.
That lets you distinguish:
  - client-observed latency
  - total server time
  - internal spatial task timings (Overpass, GEE, soil, Gemini, etc.)
  - vision decode vs analysis time

Examples:
  python benchmark_production.py --base-url https://your-render-service.onrender.com --mode health
  python benchmark_production.py --base-url https://your-render-service.onrender.com --mode vision --vision-image ../src/assets/front_page/hero_section.png
  python benchmark_production.py --base-url https://your-render-service.onrender.com --mode spatial --lat -1.2864 --lng 36.8172 --spatial-token "$TERRA_BENCH_BEARER_TOKEN"
  python benchmark_production.py --base-url https://your-render-service.onrender.com --mode all --vision-image ../src/assets/front_page/hero_section.png --lat -1.2864 --lng 36.8172 --json-out benchmark_results.json
"""

from __future__ import annotations

import argparse
import json
import math
import os
import statistics
import sys
import time
from pathlib import Path
from typing import Any

import requests


def _percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    if len(values) == 1:
        return round(values[0], 2)
    ordered = sorted(values)
    rank = (len(ordered) - 1) * pct
    low = math.floor(rank)
    high = math.ceil(rank)
    if low == high:
        return round(ordered[low], 2)
    weight = rank - low
    return round(ordered[low] * (1 - weight) + ordered[high] * weight, 2)


def _clean_base_url(base_url: str) -> str:
    return base_url.strip().rstrip("/")


def _ms(started: float) -> float:
    return round((time.perf_counter() - started) * 1000, 2)


def _json_or_none(response: requests.Response) -> dict[str, Any] | None:
    try:
        payload = response.json()
        return payload if isinstance(payload, dict) else {"raw": payload}
    except Exception:
        return None


def _flatten_timing(prefix: str, payload: dict[str, Any], out: dict[str, float]) -> None:
    for key, value in payload.items():
        next_prefix = f"{prefix}.{key}" if prefix else key
        if isinstance(value, (int, float)):
            out[next_prefix] = float(value)
        elif isinstance(value, dict):
            if "elapsed_ms" in value and isinstance(value["elapsed_ms"], (int, float)):
                out[next_prefix] = float(value["elapsed_ms"])
            else:
                _flatten_timing(next_prefix, value, out)


def _summarize_runs(name: str, runs: list[dict[str, Any]]) -> dict[str, Any]:
    client_values = [r["client_ms"] for r in runs if r.get("ok")]
    server_values = [r.get("server_total_ms") for r in runs if r.get("ok") and isinstance(r.get("server_total_ms"), (int, float))]

    summary: dict[str, Any] = {
        "name": name,
        "runs": len(runs),
        "ok_runs": sum(1 for r in runs if r.get("ok")),
        "error_runs": sum(1 for r in runs if not r.get("ok")),
        "client_ms": _series_summary(client_values),
        "server_total_ms": _series_summary(server_values),
    }

    phase_samples: dict[str, list[float]] = {}
    for run in runs:
        for key, value in run.get("flattened_timing", {}).items():
            phase_samples.setdefault(key, []).append(value)

    ranked = []
    for key, values in phase_samples.items():
        stats = _series_summary(values)
        if stats is None:
            continue
        ranked.append((stats["mean_ms"], key, stats))

    ranked.sort(reverse=True)
    summary["slowest_phases"] = [
        {"phase": key, **stats}
        for _, key, stats in ranked[:10]
    ]
    return summary


def _series_summary(values: list[float]) -> dict[str, Any] | None:
    if not values:
        return None
    return {
        "min_ms": round(min(values), 2),
        "max_ms": round(max(values), 2),
        "mean_ms": round(statistics.mean(values), 2),
        "p50_ms": _percentile(values, 0.5),
        "p95_ms": _percentile(values, 0.95),
    }


def _print_endpoint_summary(summary: dict[str, Any]) -> None:
    print(f"\n=== {summary['name']} ===")
    print(f"runs={summary['runs']} ok={summary['ok_runs']} errors={summary['error_runs']}")

    client = summary.get("client_ms")
    if client:
        print(
            "client_ms: "
            f"mean={client['mean_ms']} p50={client['p50_ms']} p95={client['p95_ms']} "
            f"min={client['min_ms']} max={client['max_ms']}"
        )

    server = summary.get("server_total_ms")
    if server:
        print(
            "server_total_ms: "
            f"mean={server['mean_ms']} p50={server['p50_ms']} p95={server['p95_ms']} "
            f"min={server['min_ms']} max={server['max_ms']}"
        )

    slowest = summary.get("slowest_phases") or []
    if slowest:
        print("slowest phases:")
        for item in slowest[:8]:
            print(
                f"  - {item['phase']}: "
                f"mean={item['mean_ms']} p95={item['p95_ms']} max={item['max_ms']}"
            )


def _request_health(session: requests.Session, base_url: str, path: str, timeout: float) -> dict[str, Any]:
    started = time.perf_counter()
    response = session.get(f"{base_url}{path}", timeout=timeout)
    payload = _json_or_none(response)
    return {
        "path": path,
        "ok": response.ok,
        "status_code": response.status_code,
        "client_ms": _ms(started),
        "payload": payload,
        "server_total_ms": payload.get("timing", {}).get("total_ms") if isinstance(payload, dict) else None,
        "flattened_timing": {},
    }


def _request_spatial(
    session: requests.Session,
    base_url: str,
    timeout: float,
    token: str,
    lat: float,
    lng: float,
) -> dict[str, Any]:
    started = time.perf_counter()
    response = session.post(
        f"{base_url}/api/spatial/scan",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Terra-Diagnostics": "1",
        },
        json={
            "lat": lat,
            "lng": lng,
            "includeTimings": True,
        },
        timeout=timeout,
    )
    payload = _json_or_none(response)
    timing = payload.get("timing") if isinstance(payload, dict) and isinstance(payload.get("timing"), dict) else {}
    flattened: dict[str, float] = {}
    if timing:
        _flatten_timing("", timing, flattened)
    return {
        "path": "/api/spatial/scan",
        "ok": response.ok,
        "status_code": response.status_code,
        "client_ms": _ms(started),
        "payload": payload,
        "server_total_ms": timing.get("total_ms"),
        "flattened_timing": flattened,
    }


def _request_vision(
    session: requests.Session,
    base_url: str,
    timeout: float,
    image_path: Path,
) -> dict[str, Any]:
    started = time.perf_counter()
    with image_path.open("rb") as handle:
        response = session.post(
            f"{base_url}/api/vision/analyze",
            headers={"X-Terra-Diagnostics": "1"},
            files={"image": (image_path.name, handle)},
            timeout=timeout,
        )
    payload = _json_or_none(response)
    timing = payload.get("timing") if isinstance(payload, dict) and isinstance(payload.get("timing"), dict) else {}
    flattened: dict[str, float] = {}
    if timing:
        _flatten_timing("", timing, flattened)
    return {
        "path": "/api/vision/analyze",
        "ok": response.ok,
        "status_code": response.status_code,
        "client_ms": _ms(started),
        "payload": payload,
        "server_total_ms": timing.get("total_request_ms") or timing.get("total_ms") or timing.get("inference_ms"),
        "flattened_timing": flattened,
    }


def _run_many(name: str, warmups: int, runs: int, fn: Any) -> dict[str, Any]:
    for index in range(warmups):
        result = fn()
        print(f"warmup {name} #{index + 1}: status={result['status_code']} client_ms={result['client_ms']}")

    records = []
    for index in range(runs):
        result = fn()
        records.append(result)
        print(f"run {name} #{index + 1}: status={result['status_code']} client_ms={result['client_ms']}")
    return {"summary": _summarize_runs(name, records), "runs": records}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Benchmark the deployed Terra AI backend")
    parser.add_argument("--base-url", default=os.getenv("TERRA_BENCH_BASE_URL", ""), help="Production backend base URL")
    parser.add_argument("--mode", choices=["all", "health", "vision", "spatial"], default="all")
    parser.add_argument("--runs", type=int, default=3, help="Measured runs per endpoint")
    parser.add_argument("--warmup-runs", type=int, default=1, help="Warmup runs per endpoint")
    parser.add_argument("--timeout", type=float, default=120.0, help="Per-request timeout in seconds")
    parser.add_argument("--lat", type=float, default=-1.286389, help="Latitude for spatial benchmark")
    parser.add_argument("--lng", type=float, default=36.817223, help="Longitude for spatial benchmark")
    parser.add_argument("--vision-image", default="", help="Path to an image file for vision benchmarking")
    parser.add_argument("--spatial-token", default=os.getenv("TERRA_BENCH_BEARER_TOKEN", ""), help="Supabase Bearer token for spatial endpoint")
    parser.add_argument("--json-out", default="", help="Optional path to write full benchmark JSON")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.base_url:
        print("error: provide --base-url or set TERRA_BENCH_BASE_URL", file=sys.stderr)
        return 2

    base_url = _clean_base_url(args.base_url)
    session = requests.Session()
    session.headers.update({"User-Agent": "TerraAI-Benchmark/1.0"})

    benchmark: dict[str, Any] = {
        "base_url": base_url,
        "mode": args.mode,
        "runs": args.runs,
        "warmup_runs": args.warmup_runs,
        "generated_at": time.time(),
        "results": {},
    }

    health_result = _run_many(
        "health",
        warmups=0,
        runs=1,
        fn=lambda: _request_health(session, base_url, "/health", args.timeout),
    )
    benchmark["results"]["health"] = health_result

    ready_result = _run_many(
        "ready",
        warmups=0,
        runs=1,
        fn=lambda: _request_health(session, base_url, "/ready", args.timeout),
    )
    benchmark["results"]["ready"] = ready_result

    if args.mode in {"all", "vision"}:
        if not args.vision_image:
            print("warning: skipping vision benchmark because --vision-image was not provided", file=sys.stderr)
        else:
            image_path = Path(args.vision_image).expanduser().resolve()
            if not image_path.exists():
                print(f"error: vision image not found: {image_path}", file=sys.stderr)
                return 2
            benchmark["results"]["vision"] = _run_many(
                "vision",
                warmups=args.warmup_runs,
                runs=args.runs,
                fn=lambda: _request_vision(session, base_url, args.timeout, image_path),
            )

    if args.mode in {"all", "spatial"}:
        if not args.spatial_token:
            print("warning: skipping spatial benchmark because --spatial-token was not provided", file=sys.stderr)
        else:
            benchmark["results"]["spatial"] = _run_many(
                "spatial",
                warmups=args.warmup_runs,
                runs=args.runs,
                fn=lambda: _request_spatial(session, base_url, args.timeout, args.spatial_token, args.lat, args.lng),
            )

    print("\n=== Summary ===")
    for key, result in benchmark["results"].items():
        _print_endpoint_summary(result["summary"])

    if args.json_out:
        output_path = Path(args.json_out).expanduser().resolve()
        output_path.write_text(json.dumps(benchmark, indent=2), encoding="utf-8")
        print(f"\nWrote benchmark JSON to {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())