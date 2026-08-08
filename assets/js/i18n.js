export const LANGUAGES = ["tr", "en"];

const STRINGS = {
  tr: {
    documentTitle: "NX Historia — Alternatif tarih kum havuzu",
    eyebrow: "NX TEAM · NOVATEX",
    lede: "Bir ülke seç, bir tarihte dur, sonrasını kendin yaz. Kural kitabı yok; motor yapay zekânın kendisi.",
    blockScenario: "Senaryo",
    blockNation: "Ülke",
    blockEngine: "Motor",
    fieldProvider: "Sağlayıcı",
    fieldModel: "Model",
    fieldApiKey: "API anahtarı",
    fieldBaseUrl: "Sunucu adresi",
    apiKeyPlaceholder: "Anahtar bu tarayıcıda kalır, hiçbir sunucuya gönderilmez",
    baseUrlPlaceholder: "https://ornek.com/v1",
    startButton: "Yönetimi devral",
    pickScenarioFirst: "Önce bir senaryo seç.",
    resumeTitle: "Kaldığın yerden devam et",
    scenariosFailed: "Senaryolar yüklenemedi. Sayfayı yenile.",
    tabDossier: "Dosya",
    tabMap: "Harita",
    tabFeed: "Sevkler",
    settingsLabel: "Motor ayarları",
    relationsTitle: "İlişkiler",
    territoriesTitle: "Topraklar",
    feedTitle: "Sevk defteri",
    gaugeStability: "İstikrar",
    gaugeEconomy: "Ekonomi",
    gaugeMilitary: "Ordu",
    territoryCount: "{count} bölge",
    turnCount: "{count}. tur",
    consoleMark: "EMİR",
    commandPlaceholder: "Ne yapıyorsun?",
    waitButton: "Bekle",
    sendButton: "Gönder",
    thinking: "Kançılaryalar toplanıyor…",
    preparingMap: "Harita hazırlanıyor…",
    settingsTitle: "Motor ayarları",
    saveButton: "Kaydet",
    endGame: "Oyunu bitir",
    zoomIn: "Yakınlaş",
    zoomOut: "Uzaklaş",
    zoomReset: "Sığdır",
    sourceWorld: "Dünya",
    sourceSystem: "Sistem",
    orderTitle: "Emir",
    reportTitle: "{year} raporu",
    endTitle: "Son",
    victory: "Zafer",
    defeat: "Yenilgi",
    gameOver: "Oyun bitti.",
    mapFailedTitle: "Harita yüklenemedi",
    mapFailedBody: "{error} Sayfayı yenile veya bağlantını denetle.",
    turnFailedTitle: "Emir işlenemedi",
    turnFailedBody: "{error} Ayarlardan modeli veya anahtarı denetle, sonra emri tekrar gönder.",
    languageLabel: "Dil",
    testButton: "Anahtarı ve modeli test et",
    verifying: "Model deneniyor…",
    startAnyway: "Yine de başlat",
    startBlocked: "Model yanıt vermedi: {error} Başka bir model seç ya da yine de başlat.",
    testing: "Deneniyor…",
    testOk: "Anahtar çalışıyor, model yanıt verdi.",
    testKeyOk: "Anahtar çalışıyor. Listeden bir model seç.",
    testFailed: "Başarısız: {error}",
    modelRequired: "Önce bir model seç ya da yaz.",
    modelUnverified: "Model doğrulanmadı. Test et düğmesine bas.",
    modelsTitle: "Modeller",
    modelsFree: "bedava",
    modelsPaid: "paralı",
    modelsUnknown: "fiyat bilinmiyor",
    modelSearch: "Model ara",
    filterAll: "Hepsi",
    filterFree: "Bedava",
    filterPaid: "Paralı",
    modelsEmpty: "Model bulunamadı.",
    pricePerMillion: "1M jeton",
    hintOpenrouter: "Anahtarını openrouter.ai/keys adresinden alabilirsin.",
    hintAnthropic: "Anahtarını console.anthropic.com adresinden alabilirsin.",
    hintGemini: "Anahtarını aistudio.google.com/apikey adresinden alabilirsin.",
    hintOpenai: "Anahtarını platform.openai.com/api-keys adresinden alabilirsin.",
    hintCustom: "Kendi sunucunun adresini yaz. Adres /chat/completions ile birleştirilir.",
    labelCustom: "OpenAI uyumlu sunucu",
    errorUnknownProvider: "Bilinmeyen sağlayıcı.",
    errorEmptyResponse: "Sağlayıcı boş yanıt döndürdü.",
    errorBaseUrlRequired: "Sunucu adresi gerekli.",
    errorUnreadable: "Motor okunabilir bir yanıt döndürmedi.",
    errorMapData: "Harita verisi yüklenemedi.",
  },
  en: {
    documentTitle: "NX Historia — An alternate history sandbox",
    eyebrow: "NX TEAM · NOVATEX",
    lede: "Pick a nation, stop at a date, and write what happens next. There is no rulebook; the engine is the model itself.",
    blockScenario: "Scenario",
    blockNation: "Nation",
    blockEngine: "Engine",
    fieldProvider: "Provider",
    fieldModel: "Model",
    fieldApiKey: "API key",
    fieldBaseUrl: "Server URL",
    apiKeyPlaceholder: "The key stays in this browser and is sent to no server of ours",
    baseUrlPlaceholder: "https://example.com/v1",
    startButton: "Take command",
    pickScenarioFirst: "Pick a scenario first.",
    resumeTitle: "Resume where you left off",
    scenariosFailed: "Scenarios could not be loaded. Reload the page.",
    tabDossier: "Dossier",
    tabMap: "Map",
    tabFeed: "Dispatches",
    settingsLabel: "Engine settings",
    relationsTitle: "Relations",
    territoriesTitle: "Territories",
    feedTitle: "Dispatch log",
    gaugeStability: "Stability",
    gaugeEconomy: "Economy",
    gaugeMilitary: "Military",
    territoryCount: "{count} territories",
    turnCount: "Turn {count}",
    consoleMark: "ORDER",
    commandPlaceholder: "What do you do?",
    waitButton: "Wait",
    sendButton: "Send",
    thinking: "The chancelleries are convening…",
    preparingMap: "Preparing the map…",
    settingsTitle: "Engine settings",
    saveButton: "Save",
    endGame: "End game",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    zoomReset: "Fit",
    sourceWorld: "The world",
    sourceSystem: "System",
    orderTitle: "Order",
    reportTitle: "{year} report",
    endTitle: "End",
    victory: "Victory",
    defeat: "Defeat",
    gameOver: "The game is over.",
    mapFailedTitle: "Map could not be loaded",
    mapFailedBody: "{error} Reload the page or check your connection.",
    turnFailedTitle: "Order could not be processed",
    turnFailedBody: "{error} Check the model or key in settings, then send the order again.",
    languageLabel: "Language",
    testButton: "Test key and model",
    verifying: "Trying the model…",
    startAnyway: "Start anyway",
    startBlocked: "The model did not respond: {error} Pick another model or start anyway.",
    testing: "Testing…",
    testOk: "The key works and the model responded.",
    testKeyOk: "The key works. Pick a model from the list.",
    testFailed: "Failed: {error}",
    modelRequired: "Pick or type a model first.",
    modelUnverified: "The model has not been verified. Press the test button.",
    modelsTitle: "Models",
    modelsFree: "free",
    modelsPaid: "paid",
    modelsUnknown: "price unknown",
    modelSearch: "Search models",
    filterAll: "All",
    filterFree: "Free",
    filterPaid: "Paid",
    modelsEmpty: "No models found.",
    pricePerMillion: "1M tokens",
    hintOpenrouter: "Get your key at openrouter.ai/keys.",
    hintAnthropic: "Get your key at console.anthropic.com.",
    hintGemini: "Get your key at aistudio.google.com/apikey.",
    hintOpenai: "Get your key at platform.openai.com/api-keys.",
    hintCustom: "Enter your own server URL. It is joined with /chat/completions.",
    labelCustom: "OpenAI compatible server",
    errorUnknownProvider: "Unknown provider.",
    errorEmptyResponse: "The provider returned an empty response.",
    errorBaseUrlRequired: "A server URL is required.",
    errorUnreadable: "The engine did not return a readable response.",
    errorMapData: "Map data could not be loaded.",
  },
};

let currentLanguage = "tr";

export function detectLanguage(stored) {
  const fromQuery = new URLSearchParams(window.location.search).get("lang");
  if (LANGUAGES.includes(fromQuery)) {
    return fromQuery;
  }
  if (LANGUAGES.includes(stored)) {
    return stored;
  }
  const fromBrowser = (navigator.language || "tr").slice(0, 2).toLowerCase();
  return LANGUAGES.includes(fromBrowser) ? fromBrowser : "en";
}

export function setLanguage(language) {
  currentLanguage = LANGUAGES.includes(language) ? language : "tr";
  document.documentElement.lang = currentLanguage;
  document.title = t("documentTitle");
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key, values = {}) {
  const table = STRINGS[currentLanguage] || STRINGS.tr;
  let output = table[key] !== undefined ? table[key] : STRINGS.tr[key];
  if (output === undefined) {
    return key;
  }
  Object.entries(values).forEach(([name, value]) => {
    output = output.replace(`{${name}}`, value);
  });
  return output;
}

export function text(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return value[currentLanguage] || value.tr || value.en || "";
}

export function applyStaticTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });
  root.querySelectorAll("[data-i18n-label]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nLabel));
  });
}
