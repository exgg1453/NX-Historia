#!/usr/bin/env python3
"""NX Historia - list real AI models with their price status."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"
ANTHROPIC_MODELS_URL = "https://api.anthropic.com/v1/models?limit=100"
OPENAI_MODELS_URL = "https://api.openai.com/v1/models"
GEMINI_MODELS_URL = "https://generativelanguage.googleapis.com/v1beta/models"

TEXTS = {
    "tr": {
        "free": "ücretsiz",
        "paid": "ücretli",
        "unknown": "bilinmiyor",
        "header_model": "MODEL",
        "header_provider": "SAĞLAYICI",
        "header_status": "DURUM",
        "header_input": "GİRDİ ($/1M)",
        "header_output": "ÇIKTI ($/1M)",
        "header_context": "BAĞLAM",
        "total": "{count} model listelendi ({free} ücretsiz, {paid} ücretli).",
        "no_models": "Hiç model bulunamadı.",
        "fetch_failed": "{provider} listesi alınamadı: {error}",
        "needs_key": "{provider} için anahtar verilmedi, atlandı.",
        "no_price_api": "fiyat listesi API'de yok",
    },
    "en": {
        "free": "free",
        "paid": "paid",
        "unknown": "unknown",
        "header_model": "MODEL",
        "header_provider": "PROVIDER",
        "header_status": "STATUS",
        "header_input": "INPUT ($/1M)",
        "header_output": "OUTPUT ($/1M)",
        "header_context": "CONTEXT",
        "total": "{count} models listed ({free} free, {paid} paid).",
        "no_models": "No models found.",
        "fetch_failed": "Could not fetch the {provider} list: {error}",
        "needs_key": "No key given for {provider}, skipped.",
        "no_price_api": "no price list in the API",
    },
}


def fetch_json(url, headers=None, timeout=30):
    request = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def per_million(value):
    try:
        return float(value) * 1_000_000
    except (TypeError, ValueError):
        return None


def fetch_openrouter():
    payload = fetch_json(OPENROUTER_MODELS_URL)
    models = []
    for entry in payload.get("data", []):
        pricing = entry.get("pricing") or {}
        prompt_price = per_million(pricing.get("prompt"))
        completion_price = per_million(pricing.get("completion"))
        if prompt_price is None and completion_price is None:
            status = "unknown"
        elif (prompt_price or 0) == 0 and (completion_price or 0) == 0:
            status = "free"
        else:
            status = "paid"
        models.append(
            {
                "id": entry.get("id", ""),
                "name": entry.get("name", ""),
                "provider": "openrouter",
                "status": status,
                "input": prompt_price,
                "output": completion_price,
                "context": entry.get("context_length"),
            }
        )
    return models


def fetch_anthropic(api_key):
    payload = fetch_json(
        ANTHROPIC_MODELS_URL,
        {"x-api-key": api_key, "anthropic-version": "2023-06-01"},
    )
    return [
        {
            "id": entry.get("id", ""),
            "name": entry.get("display_name", ""),
            "provider": "anthropic",
            "status": "paid",
            "input": None,
            "output": None,
            "context": None,
        }
        for entry in payload.get("data", [])
    ]


def fetch_openai(api_key):
    payload = fetch_json(OPENAI_MODELS_URL, {"Authorization": "Bearer " + api_key})
    return [
        {
            "id": entry.get("id", ""),
            "name": entry.get("id", ""),
            "provider": "openai",
            "status": "paid",
            "input": None,
            "output": None,
            "context": None,
        }
        for entry in payload.get("data", [])
    ]


def fetch_gemini(api_key):
    payload = fetch_json(GEMINI_MODELS_URL, {"x-goog-api-key": api_key})
    models = []
    for entry in payload.get("models", []):
        identifier = entry.get("name", "").replace("models/", "")
        models.append(
            {
                "id": identifier,
                "name": entry.get("displayName", identifier),
                "provider": "gemini",
                "status": "unknown",
                "input": None,
                "output": None,
                "context": entry.get("inputTokenLimit"),
            }
        )
    return models


def format_price(value, texts):
    if value is None:
        return "—"
    if value == 0:
        return "0"
    if value < 1:
        return "{:.3f}".format(value)
    return "{:.2f}".format(value)


def format_context(value):
    if not value:
        return "—"
    if value >= 1000:
        return "{}K".format(round(value / 1000))
    return str(value)


def render_table(models, texts):
    columns = [
        texts["header_model"],
        texts["header_provider"],
        texts["header_status"],
        texts["header_input"],
        texts["header_output"],
        texts["header_context"],
    ]
    rows = [
        [
            model["id"],
            model["provider"],
            texts[model["status"]],
            format_price(model["input"], texts),
            format_price(model["output"], texts),
            format_context(model["context"]),
        ]
        for model in models
    ]
    widths = [len(column) for column in columns]
    for row in rows:
        for index, cell in enumerate(row):
            widths[index] = max(widths[index], len(cell))
    line = "  ".join(column.ljust(widths[index]) for index, column in enumerate(columns))
    print(line)
    print("-" * len(line))
    for row in rows:
        print("  ".join(cell.ljust(widths[index]) for index, cell in enumerate(row)))


def main():
    parser = argparse.ArgumentParser(description="List real AI models with their price status.")
    parser.add_argument("--provider", default="openrouter", choices=["openrouter", "anthropic", "openai", "gemini", "all"])
    parser.add_argument("--lang", default="tr", choices=["tr", "en"])
    parser.add_argument("--free-only", action="store_true")
    parser.add_argument("--paid-only", action="store_true")
    parser.add_argument("--search", default="")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sort", default="price", choices=["price", "name", "context"])
    parser.add_argument("--json", action="store_true")
    arguments = parser.parse_args()

    texts = TEXTS[arguments.lang]
    wanted = ["openrouter", "anthropic", "openai", "gemini"] if arguments.provider == "all" else [arguments.provider]
    keys = {
        "anthropic": os.environ.get("ANTHROPIC_API_KEY", ""),
        "openai": os.environ.get("OPENAI_API_KEY", ""),
        "gemini": os.environ.get("GEMINI_API_KEY", ""),
    }

    models = []
    for provider in wanted:
        try:
            if provider == "openrouter":
                models.extend(fetch_openrouter())
            else:
                api_key = keys[provider]
                if not api_key:
                    print(texts["needs_key"].format(provider=provider), file=sys.stderr)
                    continue
                if provider == "anthropic":
                    models.extend(fetch_anthropic(api_key))
                elif provider == "openai":
                    models.extend(fetch_openai(api_key))
                else:
                    models.extend(fetch_gemini(api_key))
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError) as error:
            print(texts["fetch_failed"].format(provider=provider, error=error), file=sys.stderr)

    if arguments.search:
        needle = arguments.search.lower()
        models = [model for model in models if needle in model["id"].lower() or needle in model["name"].lower()]
    if arguments.free_only:
        models = [model for model in models if model["status"] == "free"]
    if arguments.paid_only:
        models = [model for model in models if model["status"] == "paid"]

    if arguments.sort == "name":
        models.sort(key=lambda model: model["id"])
    elif arguments.sort == "context":
        models.sort(key=lambda model: model["context"] or 0, reverse=True)
    else:
        models.sort(key=lambda model: (model["input"] is None, model["input"] or 0, model["id"]))

    if arguments.limit:
        models = models[: arguments.limit]

    if arguments.json:
        print(json.dumps(models, ensure_ascii=False, indent=2))
        return

    if not models:
        print(texts["no_models"])
        return

    render_table(models, texts)
    free_count = sum(1 for model in models if model["status"] == "free")
    paid_count = sum(1 for model in models if model["status"] == "paid")
    print()
    print(texts["total"].format(count=len(models), free=free_count, paid=paid_count))


if __name__ == "__main__":
    main()
