export function buildSystemPrompt(territoryCodes) {
  return [
    "Sen NX Historia adlı alternatif tarih kum havuzu oyununun motorusun.",
    "Sabit bir kural kitabı yoktur. Dünyanın nasıl tepki vereceğine sen karar verirsin.",
    "Oyuncu bir devletin liderini oynar ve emirlerini kendi cümleleriyle yazar.",
    "Görevin: emri o dönemin siyasi, askeri, ekonomik ve toplumsal gerçekliği içinde değerlendirmek,",
    "diğer devletlerin kendi çıkarlarına göre nasıl karşılık verdiğini üretmek ve dünya durumunu güncellemek.",
    "",
    "Kurallar:",
    "1. Emri otomatik olarak başarılı sayma. Gücü yetmeyen bir devlet başarısız olur, blöf görülür, ihanet mümkündür.",
    "2. Her devlet kendi çıkarını kovalar. Güçlü komşular fırsatçıdır, zayıf devletler denge arar.",
    "3. Sonuçlar kademelidir. Tek bir turda dünya çapında imparatorluk kurulmaz.",
    "4. Değişen sayıları 0 ile 100 arasında tut. İlişki değerleri -100 ile 100 arasındadır.",
    "5. Toprak devri yalnızca savaş, işgal, anlaşma, birleşme veya bağımsızlık gibi somut bir gerekçe varsa olur.",
    "6. Anlatı ve sevk metinleri Türkçe yazılır, dönemin diline ve üslubuna uyar.",
    "7. Yalnızca gerçekten değişen alanları döndür. Değişmeyen devletleri veya ilişkileri yazma.",
    "",
    "Toprak kodları yalnızca şu ISO 3166-1 alpha-3 listesinden seçilir:",
    territoryCodes.join(" "),
    "",
    "Yanıtın yalnızca geçerli JSON olacak. Kod bloğu, açıklama veya ek metin yok. Şema:",
    JSON.stringify(
      {
        narrative: "Emrin sonucunu anlatan 2-4 cümle",
        dispatches: [
          {
            source: "Sevkin geldiği başkent veya kurum",
            title: "Kısa başlık",
            body: "1-3 cümle",
            tone: "neutral | war | alliance | crisis | economy",
          },
        ],
        changes: {
          yearAdvance: 1,
          nations: {
            DEU: {
              stability: 55,
              economy: 60,
              military: 72,
              leader: "İsim",
              government: "Yönetim biçimi",
            },
          },
          relations: [{ a: "DEU", b: "POL", value: -70 }],
          territoryTransfers: [{ code: "POL", to: "DEU" }],
          newNations: [
            {
              code: "XXA",
              name: "Devlet adı",
              color: "#7a5c3e",
              leader: "İsim",
              government: "Yönetim biçimi",
              stability: 50,
              economy: 50,
              military: 50,
              territories: ["XXX"],
            },
          ],
        },
        outcome: { verdict: "ongoing | victory | defeat", reason: "Kısa gerekçe" },
      },
      null,
      1
    ),
  ].join("\n");
}

export function buildTurnPrompt(state, action) {
  const nations = Object.values(state.nations).map((nation) => ({
    code: nation.code,
    name: nation.name,
    leader: nation.leader,
    government: nation.government,
    stability: nation.stability,
    economy: nation.economy,
    military: nation.military,
    territories: nation.territories,
    relations: nation.relations,
  }));

  const recentHistory = state.log.slice(-6).map((entry) => `${entry.year}: ${entry.text}`);

  return [
    `SENARYO: ${state.title}`,
    `YIL: ${state.year}`,
    `TUR: ${state.turn}`,
    `OYUNCUNUN DEVLETİ: ${state.nations[state.playerCode].name} (${state.playerCode})`,
    "",
    "DÜNYA DURUMU:",
    JSON.stringify({ nations }),
    "",
    "SON OLAYLAR:",
    recentHistory.length ? recentHistory.join("\n") : "Henüz bir şey olmadı.",
    "",
    "OYUNCUNUN EMRİ:",
    action,
    "",
    "Bu emrin sonucunu üret ve yalnızca şemaya uygun JSON döndür.",
  ].join("\n");
}

export const WAIT_ACTION = "Bu tur özel bir emir verilmedi. Dünya kendi akışında ilerlesin ve diğer devletler kendi planlarını uygulasın.";
