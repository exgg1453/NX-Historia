import { text, getLanguage } from "./i18n.js";

const ENGLISH_SYSTEM = (territoryCodes, regionCodes) => [
  "You are the engine of an alternate history sandbox called NX Historia.",
  "There is no fixed rulebook. You decide how the world reacts.",
  "The player rules a state and writes orders in their own words.",
  "Your task: judge the order inside the political, military, economic and social reality of its period,",
  "produce how other states respond according to their own interests, and update the state of the world.",
  "",
  "Rules:",
  "1. Do not treat an order as automatically successful. A state without the means fails, a bluff can be called, betrayal is possible.",
  "2. Every state pursues its own interest. Strong neighbours are opportunistic, weak states seek balance.",
  "3. Consequences are gradual. No world-spanning empire is built in a single turn.",
  "4. Keep changed figures between 0 and 100. Relation values run from -100 to 100.",
  "5. Territory only changes hands with a concrete cause such as war, occupation, treaty, union or independence.",
  "6. Narrative and dispatch text is written in English, in the register of the period.",
  "7. Return only what actually changed. Do not repeat unchanged states or relations.",
  "",
  "Territory codes may only be chosen from this ISO 3166-1 alpha-3 list:",
  territoryCodes.join(" "),
  "",
  "Your answer will be valid JSON only. No code fences, no commentary, no extra text. Schema:",
].join("\n");

export function buildSystemPrompt(territoryCodes, regionCodes = []) {
  if (getLanguage() === "en") {
    return [
      ENGLISH_SYSTEM(territoryCodes, regionCodes),
      JSON.stringify(
        {
          narrative: "2-4 sentences describing the outcome of the order",
          dispatches: [
            {
              source: "The capital or institution the dispatch comes from",
              title: "Short headline",
              body: "1-3 sentences",
              tone: "neutral | war | alliance | crisis | economy",
            },
          ],
          changes: {
            yearAdvance: 1,
            nations: { DEU: { stability: 55, economy: 60, military: 72, leader: "Name", government: "Form of government" } },
            relations: [{ a: "DEU", b: "POL", value: -70 }],
            territoryTransfers: [{ code: "POL", to: "DEU" }],
            newNations: [
              {
                code: "XXA",
                name: "State name",
                color: "#7a5c3e",
                leader: "Name",
                government: "Form of government",
                stability: 50,
                economy: 50,
                military: 50,
                territories: ["XXX"],
              },
            ],
          },
          outcome: { verdict: "ongoing | victory | defeat", reason: "Short reason" },
        },
        null,
        1
      ),
    ].join("\n");
  }
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
    "Ayrıca şu tarihî bölge kodları kullanılabilir. Bir bölge ait olduğu ülkenin üstünde durur,",
    "yani ülkenin tamamı el değiştirmeden bölge el değiştirebilir:",
    regionCodes.join(" "),
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
    name: text(nation.name),
    leader: text(nation.leader),
    government: text(nation.government),
    stability: nation.stability,
    economy: nation.economy,
    military: nation.military,
    territories: nation.territories,
    relations: nation.relations,
  }));

  const recentHistory = state.log.slice(-6).map((entry) => `${entry.year}: ${entry.text}`);

  if (getLanguage() === "en") {
    return [
      `SCENARIO: ${text(state.title)}`,
      `YEAR: ${state.year}`,
      `TURN: ${state.turn}`,
      `PLAYER STATE: ${text(state.nations[state.playerCode].name)} (${state.playerCode})`,
      "",
      "WORLD STATE:",
      JSON.stringify({ nations }),
      "",
      "RECENT EVENTS:",
      recentHistory.length ? recentHistory.join("\n") : "Nothing has happened yet.",
      "",
      "PLAYER ORDER:",
      action,
      "",
      "Produce the outcome of this order and return only JSON matching the schema.",
    ].join("\n");
  }

  return [
    `SENARYO: ${text(state.title)}`,
    `YIL: ${state.year}`,
    `TUR: ${state.turn}`,
    `OYUNCUNUN DEVLETİ: ${text(state.nations[state.playerCode].name)} (${state.playerCode})`,
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

export function waitAction() {
  if (getLanguage() === "en") {
    return "No specific order was given this turn. Let the world move on its own and let other states pursue their plans.";
  }
  return "Bu tur özel bir emir verilmedi. Dünya kendi akışında ilerlesin ve diğer devletler kendi planlarını uygulasın.";
}
