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
assets/js/map.js         SVG harita, projeksiyon, kaydırma ve yakınlaştırma
assets/js/providers.js   çoklu sağlayıcı istek katmanı
assets/js/prompts.js     sistem ve tur istemleri
assets/js/storage.js     yerel kayıt
data/scenarios.json      başlangıç senaryoları
data/world.geo.json      ülke sınırları
```

NX Team · Novatex
