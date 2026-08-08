# NX Historia

Alternatif tarih kum havuzu. Bir ülke ve bir tarih seç, emirlerini kendi cümlelerinle yaz, dünyanın nasıl değiştiğini gör. Kural kitabı yok; motor yapay zekânın kendisi.

## Nasıl çalışır

1. Senaryo bir başlangıç dünyası tanımlar: devletler, liderler, istikrar / ekonomi / ordu değerleri, toprak kodları ve ilişki matrisi.
2. Oyuncu doğal dille bir emir yazar.
3. Emir, dünya durumuyla birlikte modele gönderilir. Model sonucu değerlendirir ve şemaya uygun JSON döndürür: anlatı, sevkler, devlet güncellemeleri, ilişki değişimleri, toprak devirleri.
4. Motor bu farkı duruma uygular, harita yeniden boyanır, sevk defteri güncellenir.

## Sağlayıcılar

OpenRouter, Anthropic, Google Gemini, OpenAI ve OpenAI uyumlu kendi sunucun. Anahtar yalnızca tarayıcıda saklanır, hiçbir sunucuya gönderilmez.

## Yerelde çalıştırma

```bash
python3 -m http.server 8000
```

Sonra `http://localhost:8000` adresini aç. Sayfa ES modülleri kullandığı için dosyayı doğrudan `file://` ile açmak yerine bir sunucu üzerinden aç.

## Yayına alma

`main` dalına push atıldığında `.github/workflows/pages.yml` siteyi GitHub Pages üzerinde yayınlar. Depo ayarlarında Pages kaynağı **GitHub Actions** olarak seçilmelidir.

## Yeni senaryo ekleme

`data/scenarios.json` içine bir nesne ekle. Toprak kodları ISO 3166-1 alpha-3 biçimindedir ve `data/world.geo.json` içindeki ülke kimlikleriyle eşleşir.

```json
{
  "id": "kendi-senaryon",
  "title": "1991 — Ayrılık",
  "year": 1991,
  "summary": "Tek satırlık tanıtım.",
  "nations": [
    {
      "code": "RUS",
      "name": "Rusya",
      "color": "#8f4b2e",
      "leader": "Lider",
      "government": "Yönetim biçimi",
      "stability": 50,
      "economy": 50,
      "military": 50,
      "territories": ["RUS", "BLR"]
    }
  ],
  "relations": [{ "a": "RUS", "b": "USA", "value": -40 }]
}
```

## Dosya düzeni

```
index.html
assets/css/style.css
assets/js/app.js         arayüz kabuğu
assets/js/engine.js      durum, tur uygulaması, ayrıştırma
assets/js/map.js         SVG harita: Winkel Tripel izdüşümü, küre sınırı, paralel ağı, kaydırma ve yakınlaştırma
assets/js/providers.js   çoklu sağlayıcı istek katmanı
assets/js/prompts.js     sistem ve tur istemleri
assets/js/storage.js     yerel kayıt
data/scenarios.json      başlangıç senaryoları
data/world.geo.json      ülke sınırları
```

NX Team · Novatex

## Bayraklar

Bayraklar iki katmanlıdır. Önce `data/flags.json` manifestosuna bakılır: kimlik orada varsa karşılığındaki `assets/flags/` dosyası gösterilir. Manifesto kimlikten dosya adına eşlemedir, yani svg, png, jpg, webp, gif ve avif kabul edilir. Yoksa `assets/js/flags.js` içindeki vektör çizim kullanılır. Böylece dosya eklendikçe site kendiliğinden gerçek görseli kullanmaya geçer, dosya yoksa da hiçbir yer boş kalmaz.

Her senaryo devletinin `flag` alanı bir kimliği gösterir, yani aynı ülke kodu farklı dönemlerde farklı bayrak taşıyabilir: `ottoman-early` 1453 için, `ottoman` 1914 için, `tr` günümüz için.

### Bayrak indirme

Bayrakların tamamı `assets/flags/` altında gerçek görsel dosyası olarak durur; tek istisna 1939 Almanya'sıdır, o sembolsüz olarak çizilir. `tools/fetch_flags.py` eksik bir bayrağı Wikimedia Commons'tan indirir ve manifestoyu yeniden yazar. Yalnızca standart kütüphaneyi kullanır.

```bash
python3 tools/fetch_flags.py                    # eksik olan tüm bayrakları indir
python3 tools/fetch_flags.py ussr at-hu venice  # sadece belirtilenleri indir
python3 tools/fetch_flags.py --force            # var olanların üzerine yaz
python3 tools/fetch_flags.py --list             # hangi kimlik hangi dosyadan geliyor
python3 tools/fetch_flags.py --lang en          # İngilizce çıktı
```

Her kimlik için birden çok aday dosya adı denenir, ilki bulunamazsa sonraki denenir. İndirme bittiğinde `data/flags.json` yeniden yazılır; dosyaları depoya işlemek yeterlidir.

Bir kimlik başka bir kimliğin dosyasını kullanabilir. `assets/js/flags.js` içindeki `FLAG_ALIASES` bunu tanımlar; örneğin 1914 Osmanlı bayrağı günümüz Türkiye dosyasına yönlendirilmiştir. Takma adlar manifesto yeniden yazıldığında bozulmaz.

Bayrağı elle de ekleyebilirsin: dosyayı `assets/flags/<kimlik>.<uzantı>` olarak koy, sonra manifestoyu tazele.

```bash
python3 tools/fetch_flags.py --manifest-only
```

Var olan dosyalar atlanır, üzerine yazmak için `--force` gerekir. Yani elle koyduğun bir bayrak indirme sırasında bozulmaz.

## Diller

Site Türkçe ve İngilizce çalışır. Dil sırasıyla `?lang=` parametresinden, daha önce yapılan seçimden ve tarayıcı dilinden belirlenir; sağ üstteki düğmeyle her an değiştirilebilir.

- Türkçe: `tr.html` veya `index.html?lang=tr`
- İngilizce: `en.html` veya `index.html?lang=en`

Arayüz metinleri `assets/js/i18n.js` içinde, senaryo metinleri `data/scenarios.json` içinde `{ "tr": ..., "en": ... }` biçimindedir. Yapay zekâya giden sistem istemi de seçili dile göre değişir, yani anlatı ve sevkler o dilde gelir.

## Model listesi aracı

`tools/models.py` gerçek model listelerini çeker ve her modelin ücretli mi ücretsiz mi olduğunu yazar. Yalnızca standart kütüphaneyi kullanır.

```bash
python3 tools/models.py                          # OpenRouter, Türkçe, fiyata göre sıralı
python3 tools/models.py --free-only              # sadece ücretsiz modeller
python3 tools/models.py --lang en --sort context # İngilizce, bağlam boyutuna göre
python3 tools/models.py --search claude --json   # arama, JSON çıktı
python3 tools/models.py --provider all           # anahtar verilen tüm sağlayıcılar
```

OpenRouter listesi anahtar istemez ve gerçek fiyat verisi döndürür. Anthropic, OpenAI ve Gemini listeleri için sırasıyla `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` ortam değişkenleri okunur; bu API'ler fiyat döndürmediği için Anthropic ve OpenAI ücretli, Gemini bilinmiyor olarak işaretlenir.
