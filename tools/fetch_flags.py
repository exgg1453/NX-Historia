#!/usr/bin/env python3
"""NX Historia - download real flag images from Wikimedia Commons into assets/flags."""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "NX-Historia-flag-fetcher/1.0 (https://github.com/exgg1453/NX-Historia)"

SOURCES = {
    "ottoman": [
        "Flag of the Ottoman Empire.svg",
        "Ottoman flag.svg",
    ],
    "ottoman-early": [
        "Flag of the Ottoman Empire (1453-1517).svg",
        "Fictitious Ottoman flag 2.svg",
        "Ottoman Flag 1453.svg",
    ],
    "de-imperial": [
        "Flag of the German Empire.svg",
        "Flag of Germany (1867-1918).svg",
    ],
    "ussr": [
        "Flag of the Soviet Union.svg",
        "Flag of the Soviet Union (1936-1955).svg",
    ],
    "muscovy": [
        "Flag of Grand Duchy of Moscow.svg",
        "Banner of the Grand Prince of Moscow.svg",
        "Flag of Russia (1668).svg",
    ],
    "venice": [
        "Flag of Most Serene Republic of Venice.svg",
        "Flag of the Republic of Venice.svg",
    ],
    "hu-arpad": [
        "Flag of Hungary (1301-1382).svg",
        "Arpad stripes.svg",
        "Flag of Hungary (11th century-1301).svg",
    ],
    "mamluk": [
        "Mamluk Flag.svg",
        "Flag of the Mamluk Sultanate.svg",
    ],
    "akkoyunlu": [
        "Aq Qoyunlu flag.svg",
        "Flag of Aq Qoyunlu.svg",
    ],
    "castile": [
        "Flag of the Crown of Castile.svg",
        "Bandera de la Corona de Castilla.svg",
        "Estandarte Real de Castilla y Leon.svg",
    ],
    "fr-royal": [
        "Royal Standard of the King of France.svg",
        "Pavillon royal de la France.svg",
        "Flag of the Kingdom of France (1365-1376).svg",
    ],
    "at-hu": [
        "Flag of Austria-Hungary (1869-1918).svg",
        "Civil Ensign of Austria-Hungary (1869-1918).svg",
    ],
    "tr": ["Flag of Turkey.svg"],
    "de": ["Flag of Germany.svg"],
    "fr": ["Flag of France.svg"],
    "gb": ["Flag of the United Kingdom.svg"],
    "it": ["Flag of Italy.svg"],
    "us": ["Flag of the United States.svg"],
    "jp": ["Flag of Japan.svg"],
    "cn": ["Flag of the People's Republic of China.svg"],
    "cn-roc": ["Flag of the Republic of China.svg"],
    "kr": ["Flag of South Korea.svg"],
    "kp": ["Flag of North Korea.svg"],
    "in": ["Flag of India.svg"],
    "ir": ["Flag of Iran.svg"],
    "il": ["Flag of Israel.svg"],
    "sa": ["Flag of Saudi Arabia.svg"],
    "br": ["Flag of Brazil.svg"],
    "eg": ["Flag of Egypt.svg"],
    "pk": ["Flag of Pakistan.svg"],
    "ua": ["Flag of Ukraine.svg"],
    "gr": ["Flag of Greece.svg"],
    "bg": ["Flag of Bulgaria.svg"],
    "rs": ["Flag of Serbia.svg"],
    "es": ["Flag of Spain.svg"],
    "pl": ["Flag of Poland.svg"],
    "ru": ["Flag of Russia.svg"],
    "byzantium": ["Byzantine imperial flag, 14th century, square.svg", "Flag of Palaeologus Dynasty.svg"],
}

TEXTS = {
    "tr": {
        "resolving": "{flag}: {title} aranıyor",
        "downloaded": "{flag}: indirildi ({size} bayt) <- {title}",
        "skipped": "{flag}: zaten var, atlandı",
        "not_found": "{flag}: Commons'ta hiçbir aday bulunamadı",
        "failed": "{flag}: indirilemedi ({error})",
        "summary": "{done} bayrak indirildi, {skipped} atlandı, {failed} başarısız.",
        "manifest": "Manifesto yazıldı: {path} ({count} bayrak)",
        "unknown_flag": "Bilinmeyen bayrak kimliği: {flag}",
    },
    "en": {
        "resolving": "{flag}: looking up {title}",
        "downloaded": "{flag}: downloaded ({size} bytes) <- {title}",
        "skipped": "{flag}: already present, skipped",
        "not_found": "{flag}: no candidate found on Commons",
        "failed": "{flag}: download failed ({error})",
        "summary": "{done} flags downloaded, {skipped} skipped, {failed} failed.",
        "manifest": "Manifest written: {path} ({count} flags)",
        "unknown_flag": "Unknown flag id: {flag}",
    },
}


def request_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def resolve_file_url(title):
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "titles": "File:" + title,
            "prop": "imageinfo",
            "iiprop": "url",
        }
    )
    payload = request_json(COMMONS_API + "?" + query)
    pages = payload.get("query", {}).get("pages", {})
    for page in pages.values():
        if "missing" in page:
            continue
        info = page.get("imageinfo") or []
        if info:
            return info[0].get("url")
    return None


def download(url, destination):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read()
    with open(destination, "wb") as handle:
        handle.write(data)
    return len(data)


IMAGE_EXTENSIONS = (".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif")


def write_manifest(directory, manifest_path, texts):
    manifest = {}
    for name in sorted(os.listdir(directory)):
        stem, extension = os.path.splitext(name)
        if extension.lower() in IMAGE_EXTENSIONS:
            manifest[stem] = name
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2, sort_keys=True)
    print(texts["manifest"].format(path=manifest_path, count=len(manifest)))


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    parser = argparse.ArgumentParser(description="Download real flag images from Wikimedia Commons.")
    parser.add_argument("flags", nargs="*", help="flag ids to fetch, empty means all")
    parser.add_argument("--lang", default="tr", choices=["tr", "en"])
    parser.add_argument("--out", default=os.path.join(root, "assets", "flags"))
    parser.add_argument("--manifest", default=os.path.join(root, "data", "flags.json"))
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--manifest-only", action="store_true")
    arguments = parser.parse_args()

    texts = TEXTS[arguments.lang]

    if arguments.list:
        for flag in sorted(SOURCES):
            print(flag, "->", SOURCES[flag][0])
        return

    os.makedirs(arguments.out, exist_ok=True)

    if arguments.manifest_only:
        write_manifest(arguments.out, arguments.manifest, texts)
        return

    wanted = arguments.flags or sorted(SOURCES)
    done = 0
    skipped = 0
    failed = 0

    for flag in wanted:
        if flag not in SOURCES:
            print(texts["unknown_flag"].format(flag=flag), file=sys.stderr)
            failed += 1
            continue
        destination = os.path.join(arguments.out, flag + ".svg")
        existing = [
            name
            for name in os.listdir(arguments.out)
            if os.path.splitext(name)[0] == flag and os.path.splitext(name)[1].lower() in IMAGE_EXTENSIONS
        ]
        if existing and not arguments.force:
            print(texts["skipped"].format(flag=flag))
            skipped += 1
            continue

        url = None
        used_title = ""
        for title in SOURCES[flag]:
            print(texts["resolving"].format(flag=flag, title=title))
            try:
                url = resolve_file_url(title)
            except (urllib.error.URLError, urllib.error.HTTPError, ValueError, TimeoutError) as error:
                print(texts["failed"].format(flag=flag, error=error), file=sys.stderr)
                url = None
            if url:
                used_title = title
                break
            time.sleep(0.4)

        if not url:
            print(texts["not_found"].format(flag=flag), file=sys.stderr)
            failed += 1
            continue

        try:
            size = download(url, destination)
        except (urllib.error.URLError, urllib.error.HTTPError, OSError, TimeoutError) as error:
            print(texts["failed"].format(flag=flag, error=error), file=sys.stderr)
            failed += 1
            continue

        print(texts["downloaded"].format(flag=flag, size=size, title=used_title))
        done += 1
        time.sleep(0.4)

    write_manifest(arguments.out, arguments.manifest, texts)
    print(texts["summary"].format(done=done, skipped=skipped, failed=failed))


if __name__ == "__main__":
    main()
