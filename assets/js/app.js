import { PROVIDERS, requestCompletion, listModels, verifyModel } from "./providers.js";
import { buildSystemPrompt, buildTurnPrompt, waitAction } from "./prompts.js";
import { createState, applyTurn, parseModelResponse, buildOwnership } from "./engine.js";
import { WorldMap } from "./map.js";
import { flagMarkup, loadFlagFiles } from "./flags.js";
import { readValue, writeValue, removeValue } from "./storage.js";
import { LANGUAGES, detectLanguage, setLanguage, getLanguage, t, text, applyStaticTranslations } from "./i18n.js";

const SETTINGS_KEY = "nx-historia-settings";
const LANGUAGE_KEY = "nx-historia-language";
const SAVE_KEY = "nx-historia-save";

const elements = {
  setup: document.getElementById("setup"),
  languageButton: document.getElementById("languageButton"),
  langSwitch: document.getElementById("langSwitch"),
  testButton: document.getElementById("testButton"),
  testResult: document.getElementById("testResult"),
  modelPanel: document.getElementById("modelPanel"),
  modelSearch: document.getElementById("modelSearch"),
  modelList: document.getElementById("modelList"),
  game: document.getElementById("game"),
  scenarioList: document.getElementById("scenarioList"),
  nationList: document.getElementById("nationList"),
  providerSelect: document.getElementById("providerSelect"),
  modelInput: document.getElementById("modelInput"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  baseUrlField: document.getElementById("baseUrlField"),
  baseUrlInput: document.getElementById("baseUrlInput"),
  providerHint: document.getElementById("providerHint"),
  startButton: document.getElementById("startButton"),
  setupError: document.getElementById("setupError"),
  yearLabel: document.getElementById("yearLabel"),
  turnLabel: document.getElementById("turnLabel"),
  playerName: document.getElementById("playerName"),
  playerLeader: document.getElementById("playerLeader"),
  playerFlag: document.getElementById("playerFlag"),
  topIdentity: document.getElementById("topIdentity"),
  gauges: document.getElementById("gauges"),
  relations: document.getElementById("relations"),
  territoryCount: document.getElementById("territoryCount"),
  mapHost: document.getElementById("mapHost"),
  mapTooltip: document.getElementById("mapTooltip"),
  mapLegend: document.getElementById("mapLegend"),
  feed: document.getElementById("feed"),
  commandForm: document.getElementById("commandForm"),
  commandInput: document.getElementById("commandInput"),
  sendButton: document.getElementById("sendButton"),
  waitButton: document.getElementById("waitButton"),
  thinking: document.getElementById("thinking"),
  thinkingLabel: document.getElementById("thinkingLabel"),
  settingsButton: document.getElementById("settingsButton"),
  settingsDialog: document.getElementById("settingsDialog"),
  settingsProvider: document.getElementById("settingsProvider"),
  settingsModel: document.getElementById("settingsModel"),
  settingsKey: document.getElementById("settingsKey"),
  settingsBaseField: document.getElementById("settingsBaseField"),
  settingsBaseUrl: document.getElementById("settingsBaseUrl"),
  settingsSave: document.getElementById("settingsSave"),
  resetGame: document.getElementById("resetGame"),
  homeButton: document.getElementById("homeButton"),
  dossierPanel: document.getElementById("dossierPanel"),
  mapPanel: document.getElementById("mapPanel"),
  feedPanel: document.getElementById("feedPanel"),
  dossierTab: document.getElementById("dossierTab"),
  mapTab: document.getElementById("mapTab"),
  feedTab: document.getElementById("feedTab"),
};

const worldMap = new WorldMap(elements.mapHost, elements.mapTooltip);

let scenarios = [];
let selectedScenario = null;
let selectedNationCode = null;
let gameState = null;
let territoryCodes = [];
let regionCodes = [];
let mapReady = false;
let busy = false;
let availableModels = [];
let verifiedSignature = "";

function settingsSignature(current) {
  return [current.providerId, current.model, current.apiKey, current.baseUrl].join("|");
}

function showTestResult(message, state) {
  elements.testResult.hidden = false;
  elements.testResult.className = `test-result is-${state}`;
  elements.testResult.textContent = message;
}

function renderModelList(filter = "") {
  const needle = filter.trim().toLowerCase();
  const current = elements.modelInput.value.trim();
  const rows = availableModels.filter(
    (model) => !needle || model.id.toLowerCase().includes(needle) || model.name.toLowerCase().includes(needle)
  );
  elements.modelList.innerHTML = "";
  if (rows.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.style.padding = "12px";
    empty.textContent = t("modelsEmpty");
    elements.modelList.appendChild(empty);
    return;
  }
  rows.slice(0, 300).forEach((model) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `model-row${model.id === current ? " is-active" : ""}`;
    const identifier = document.createElement("span");
    identifier.className = "model-id";
    identifier.textContent = model.id;
    const price = document.createElement("span");
    price.className = "model-price";
    if (!model.known) {
      price.innerHTML = `<span class="model-tag">${t("modelsUnknown")}</span>`;
    } else if (model.free) {
      price.innerHTML = `<span class="model-tag is-free">${t("modelsFree")}</span>`;
    } else {
      const input = model.input === null ? "?" : model.input.toFixed(2);
      const output = model.output === null ? "?" : model.output.toFixed(2);
      price.innerHTML = `<span class="model-tag is-paid">${t("modelsPaid")}</span> $${input} / $${output}`;
    }
    row.appendChild(identifier);
    row.appendChild(price);
    row.addEventListener("click", () => {
      elements.modelInput.value = model.id;
      verifiedSignature = "";
      renderModelList(elements.modelSearch.value);
      refreshStartButton();
    });
    elements.modelList.appendChild(row);
  });
}

async function runTest() {
  const current = readSetupSettings();
  elements.testButton.disabled = true;
  showTestResult(t("testing"), "busy");
  try {
    availableModels = await listModels(current);
    renderModelList(elements.modelSearch.value);
    elements.modelPanel.hidden = availableModels.length === 0;
  } catch (error) {
    availableModels = [];
    elements.modelPanel.hidden = true;
    showTestResult(t("testFailed", { error: error.message }), "error");
    elements.testButton.disabled = false;
    refreshStartButton();
    return;
  }
  if (!current.model) {
    showTestResult(t("testKeyOk"), "ok");
    elements.testButton.disabled = false;
    refreshStartButton();
    return;
  }
  try {
    await verifyModel(current);
    verifiedSignature = settingsSignature(current);
    showTestResult(t("testOk"), "ok");
  } catch (error) {
    verifiedSignature = "";
    showTestResult(t("testFailed", { error: error.message }), "error");
  }
  elements.testButton.disabled = false;
  refreshStartButton();
}

let settings = readValue(SETTINGS_KEY, {
  providerId: "openrouter",
  model: PROVIDERS.openrouter.defaultModel,
  apiKey: "",
  baseUrl: "",
});

function fillProviderSelect(select, selectedId) {
  select.innerHTML = "";
  Object.values(PROVIDERS).forEach((provider) => {
    const option = document.createElement("option");
    option.value = provider.id;
    option.textContent = provider.labelKey ? t(provider.labelKey) : provider.label;
    if (provider.id === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function syncSetupProvider() {
  const provider = PROVIDERS[settings.providerId] || PROVIDERS.openrouter;
  elements.providerHint.textContent = t(provider.hintKey);
  elements.baseUrlField.hidden = !provider.requiresBaseUrl;
  elements.modelInput.value = settings.model || provider.defaultModel;
  elements.apiKeyInput.value = settings.apiKey || "";
  elements.baseUrlInput.value = settings.baseUrl || "";
}

function readSetupSettings() {
  const providerId = elements.providerSelect.value;
  const provider = PROVIDERS[providerId];
  return {
    providerId,
    model: elements.modelInput.value.trim(),
    apiKey: elements.apiKeyInput.value.trim(),
    baseUrl: elements.baseUrlInput.value.trim(),
  };
}

function refreshStartButton() {
  const current = readSetupSettings();
  const provider = PROVIDERS[current.providerId];
  const keyReady = provider.id === "custom" ? true : current.apiKey.length > 0;
  const baseReady = provider.requiresBaseUrl ? current.baseUrl.length > 0 : true;
  const modelReady = current.model.length > 0 && verifiedSignature === settingsSignature(current);
  elements.startButton.disabled = !(selectedScenario && selectedNationCode && keyReady && baseReady && modelReady);
}

function renderScenarioList() {
  elements.scenarioList.innerHTML = "";
  scenarios.forEach((scenario) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "scenario-card";
    card.dataset.id = scenario.id;
    if (selectedScenario && selectedScenario.id === scenario.id) {
      card.classList.add("is-active");
    }
    const year = document.createElement("span");
    year.className = "scenario-year";
    year.textContent = scenario.year;
    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = text(scenario.title).replace(/^\d+\s*—\s*/, "");
    const summary = document.createElement("p");
    summary.textContent = text(scenario.summary);
    const strip = document.createElement("div");
    strip.className = "scenario-flags";
    strip.innerHTML = scenario.nations
      .slice(0, 8)
      .map((nation) => flagMarkup(nation.flag, nation.color))
      .join("");
    body.appendChild(title);
    body.appendChild(summary);
    body.appendChild(strip);
    card.appendChild(year);
    card.appendChild(body);
    card.addEventListener("click", () => {
      selectedScenario = scenario;
      selectedNationCode = null;
      renderScenarioList();
      renderNationList();
      refreshStartButton();
    });
    elements.scenarioList.appendChild(card);
  });
}

function renderNationList() {
  elements.nationList.innerHTML = "";
  if (!selectedScenario) {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = t("pickScenarioFirst");
    elements.nationList.appendChild(note);
    return;
  }
  selectedScenario.nations.forEach((nation) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "nation-chip";
    if (selectedNationCode === nation.code) {
      chip.classList.add("is-active");
    }
    chip.innerHTML = flagMarkup(nation.flag, nation.color);
    const label = document.createElement("span");
    label.textContent = text(nation.name);
    chip.appendChild(label);
    chip.addEventListener("click", () => {
      selectedNationCode = nation.code;
      renderNationList();
      refreshStartButton();
    });
    elements.nationList.appendChild(chip);
  });
}

function gaugeClass(value) {
  if (value < 30) return "gauge-fill is-low";
  if (value < 60) return "gauge-fill is-mid";
  return "gauge-fill";
}

function renderDossier() {
  const player = gameState.nations[gameState.playerCode];
  elements.playerName.textContent = text(player.name);
  elements.playerLeader.textContent = `${text(player.leader)} · ${text(player.government)}`;
  elements.playerFlag.innerHTML = flagMarkup(player.flag, player.color, "flag flag-lg");
  elements.topIdentity.innerHTML = `${flagMarkup(player.flag, player.color, "flag flag-sm")}<span>${text(player.name)}</span>`;
  elements.yearLabel.textContent = gameState.year;
  elements.turnLabel.textContent = t("turnCount", { count: gameState.turn });

  const gauges = [
    { label: t("gaugeStability"), value: player.stability },
    { label: t("gaugeEconomy"), value: player.economy },
    { label: t("gaugeMilitary"), value: player.military },
  ];
  elements.gauges.innerHTML = "";
  gauges.forEach((gauge) => {
    const wrapper = document.createElement("div");
    const label = document.createElement("div");
    label.className = "gauge-label";
    const name = document.createElement("span");
    name.textContent = gauge.label;
    const value = document.createElement("span");
    value.textContent = gauge.value;
    label.appendChild(name);
    label.appendChild(value);
    const track = document.createElement("div");
    track.className = "gauge-track";
    const fill = document.createElement("div");
    fill.className = gaugeClass(gauge.value);
    fill.style.width = `${gauge.value}%`;
    track.appendChild(fill);
    wrapper.appendChild(label);
    wrapper.appendChild(track);
    elements.gauges.appendChild(wrapper);
  });

  elements.relations.innerHTML = "";
  Object.entries(player.relations)
    .filter(([code]) => gameState.nations[code])
    .sort((first, second) => second[1] - first[1])
    .forEach(([code, value]) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.className = "relation-name";
      name.innerHTML = flagMarkup(gameState.nations[code].flag, gameState.nations[code].color, "flag flag-sm");
      const nameText = document.createElement("span");
      nameText.textContent = text(gameState.nations[code].name);
      name.appendChild(nameText);
      const amount = document.createElement("span");
      amount.className = "relation-value";
      if (value >= 30) amount.classList.add("is-friendly");
      if (value <= -30) amount.classList.add("is-hostile");
      amount.textContent = value > 0 ? `+${value}` : String(value);
      item.appendChild(name);
      item.appendChild(amount);
      elements.relations.appendChild(item);
    });

  elements.territoryCount.textContent = t("territoryCount", { count: player.territories.length });
}

function renderLegend() {
  const nations = Object.values(gameState.nations)
    .sort((first, second) => second.territories.length - first.territories.length)
    .slice(0, 10);
  elements.mapLegend.innerHTML = "";
  nations.forEach((nation) => {
    const row = document.createElement("div");
    row.className = "legend-row";
    row.innerHTML = flagMarkup(nation.flag, nation.color, "flag flag-sm");
    const label = document.createElement("span");
    label.textContent = text(nation.name);
    row.appendChild(label);
    elements.mapLegend.appendChild(row);
  });
}

function addDispatch({ source, title, body, tone, year }) {
  const card = document.createElement("article");
  card.className = `dispatch tone-${tone}`;
  const head = document.createElement("div");
  head.className = "dispatch-head";
  const left = document.createElement("span");
  left.textContent = source;
  const right = document.createElement("span");
  right.textContent = year;
  head.appendChild(left);
  head.appendChild(right);
  const heading = document.createElement("h4");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = body;
  card.appendChild(head);
  card.appendChild(heading);
  card.appendChild(paragraph);
  elements.feed.prepend(card);
}

function setBusy(value, label) {
  busy = value;
  elements.thinking.hidden = !value;
  elements.sendButton.disabled = value;
  elements.waitButton.disabled = value;
  if (label) {
    elements.thinkingLabel.textContent = label;
  }
}

function persistGame() {
  if (gameState) {
    writeValue(SAVE_KEY, gameState);
  }
}

async function ensureMap() {
  if (mapReady) {
    return;
  }
  await worldMap.load("data/world.geo.json", "data/regions.geo.json");
  territoryCodes = Array.from(worldMap.paths.keys());
  regionCodes = Array.from(worldMap.regionPaths.keys());
  mapReady = true;
}

function repaintMap(changedTerritories = []) {
  worldMap.paint(gameState, buildOwnership(gameState), changedTerritories);
  renderLegend();
}

async function startGame(state, focusPlayer) {
  gameState = state;
  elements.setup.hidden = true;
  elements.game.hidden = false;
  setBusy(true, t("preparingMap"));
  try {
    await ensureMap();
  } catch (error) {
    setBusy(false);
    addDispatch({
      source: t("sourceSystem"),
      title: t("mapFailedTitle"),
      body: t("mapFailedBody", { error: error.message }),
      tone: "crisis",
      year: state.year,
    });
    return;
  }
  setBusy(false);
  repaintMap();
  renderDossier();
  if (focusPlayer) {
    worldMap.focusOn(gameState.nations[gameState.playerCode].territories);
  }
  persistGame();
}

async function submitAction(actionText) {
  if (busy || !gameState) {
    return;
  }
  const player = gameState.nations[gameState.playerCode];
  addDispatch({
    source: text(player.name),
    title: t("orderTitle"),
    body: actionText,
    tone: "player",
    year: gameState.year,
  });
  setBusy(true, t("thinking"));
  try {
    const raw = await requestCompletion({
      providerId: settings.providerId,
      apiKey: settings.apiKey,
      model: settings.model,
      baseUrl: settings.baseUrl,
      systemPrompt: buildSystemPrompt(territoryCodes, regionCodes),
      userPrompt: buildTurnPrompt(gameState, actionText),
    });
    const result = parseModelResponse(raw);
    const applied = applyTurn(gameState, result);
    if (applied.narrative) {
      addDispatch({
        source: t("sourceWorld"),
        title: t("reportTitle", { year: gameState.year }),
        body: applied.narrative,
        tone: "neutral",
        year: gameState.year,
      });
    }
    applied.dispatches.forEach(addDispatch);
    if (gameState.verdict !== "ongoing") {
      addDispatch({
        source: t("endTitle"),
        title: gameState.verdict === "victory" ? t("victory") : t("defeat"),
        body: applied.outcome?.reason || t("gameOver"),
        tone: gameState.verdict === "victory" ? "alliance" : "war",
        year: gameState.year,
      });
    }
    repaintMap(applied.changedTerritories);
    renderDossier();
    persistGame();
  } catch (error) {
    addDispatch({
      source: t("sourceSystem"),
      title: t("turnFailedTitle"),
      body: t("turnFailedBody", { error: error.message }),
      tone: "crisis",
      year: gameState.year,
    });
  } finally {
    setBusy(false);
  }
}

function showPanel(name) {
  const panels = {
    dossier: elements.dossierPanel,
    map: elements.mapPanel,
    feed: elements.feedPanel,
  };
  const tabs = {
    dossier: elements.dossierTab,
    map: elements.mapTab,
    feed: elements.feedTab,
  };
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle("is-visible", key === name);
  });
  Object.entries(tabs).forEach(([key, tab]) => {
    tab.classList.toggle("is-active", key === name);
  });
}

function openSettings() {
  fillProviderSelect(elements.settingsProvider, settings.providerId);
  elements.settingsModel.value = settings.model;
  elements.settingsKey.value = settings.apiKey;
  elements.settingsBaseUrl.value = settings.baseUrl;
  elements.settingsBaseField.hidden = !PROVIDERS[settings.providerId].requiresBaseUrl;
  elements.settingsDialog.showModal();
}

function bindEvents() {
  elements.testButton.addEventListener("click", runTest);
  elements.modelSearch.addEventListener("input", () => renderModelList(elements.modelSearch.value));

  elements.providerSelect.addEventListener("change", () => {
    const provider = PROVIDERS[elements.providerSelect.value];
    elements.modelInput.value = provider.defaultModel;
    availableModels = [];
    verifiedSignature = "";
    elements.modelPanel.hidden = true;
    elements.testResult.hidden = true;
    elements.baseUrlField.hidden = !provider.requiresBaseUrl;
    elements.providerHint.textContent = t(provider.hintKey);
    refreshStartButton();
  });

  [elements.modelInput, elements.apiKeyInput, elements.baseUrlInput].forEach((input) => {
    input.addEventListener("input", () => {
      verifiedSignature = "";
      refreshStartButton();
    });
  });

  elements.startButton.addEventListener("click", async () => {
    const current = readSetupSettings();
    if (!current.model) {
      showTestResult(t("modelRequired"), "error");
      return;
    }
    if (verifiedSignature !== settingsSignature(current)) {
      showTestResult(t("modelUnverified"), "error");
      return;
    }
    settings = current;
    writeValue(SETTINGS_KEY, settings);
    const state = createState(selectedScenario, selectedNationCode);
    await startGame(state, true);
    showPanel("map");
  });

  elements.commandForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = elements.commandInput.value.trim();
    if (!text) {
      return;
    }
    elements.commandInput.value = "";
    elements.commandInput.style.height = "auto";
    submitAction(text);
  });

  elements.commandInput.addEventListener("input", () => {
    elements.commandInput.style.height = "auto";
    elements.commandInput.style.height = `${Math.min(elements.commandInput.scrollHeight, 148)}px`;
  });

  elements.commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      elements.commandForm.requestSubmit();
    }
  });

  elements.waitButton.addEventListener("click", () => submitAction(waitAction()));

  document.querySelectorAll(".map-controls button").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.zoom;
      if (mode === "in") worldMap.zoom(1 / 1.35);
      if (mode === "out") worldMap.zoom(1.35);
      if (mode === "reset") worldMap.resetView();
    });
  });

  elements.dossierTab.addEventListener("click", () => showPanel("dossier"));
  elements.mapTab.addEventListener("click", () => showPanel("map"));
  elements.feedTab.addEventListener("click", () => showPanel("feed"));

  elements.settingsButton.addEventListener("click", openSettings);

  elements.settingsProvider.addEventListener("change", () => {
    const provider = PROVIDERS[elements.settingsProvider.value];
    elements.settingsModel.value = provider.defaultModel;
    elements.settingsBaseField.hidden = !provider.requiresBaseUrl;
  });

  elements.settingsSave.addEventListener("click", () => {
    settings = {
      providerId: elements.settingsProvider.value,
      model: elements.settingsModel.value.trim() || PROVIDERS[elements.settingsProvider.value].defaultModel,
      apiKey: elements.settingsKey.value.trim(),
      baseUrl: elements.settingsBaseUrl.value.trim(),
    };
    writeValue(SETTINGS_KEY, settings);
    elements.settingsDialog.close();
  });

  elements.resetGame.addEventListener("click", () => {
    removeValue(SAVE_KEY);
    gameState = null;
    elements.feed.innerHTML = "";
    elements.settingsDialog.close();
    elements.game.hidden = true;
    elements.setup.hidden = false;
  });

  elements.homeButton.addEventListener("click", () => {
    persistGame();
    elements.game.hidden = true;
    elements.setup.hidden = false;
  });
}

function renderResumeCard(savedState) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "scenario-card is-active";
  const year = document.createElement("span");
  year.className = "scenario-year";
  year.textContent = savedState.year;
  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = "Kaldığın yerden devam et";
  const summary = document.createElement("p");
  summary.textContent = `${savedState.title} · ${savedState.nations[savedState.playerCode].name} · tur ${savedState.turn}`;
  body.appendChild(title);
  body.appendChild(summary);
  card.appendChild(year);
  card.appendChild(body);
  card.addEventListener("click", async () => {
    await startGame(savedState, true);
    showPanel("map");
  });
  elements.scenarioList.prepend(card);
}

function refreshLanguageUi() {
  applyStaticTranslations();
  const other = LANGUAGES.find((code) => code !== getLanguage());
  elements.languageButton.textContent = other.toUpperCase();
  elements.langSwitch.innerHTML = "";
  LANGUAGES.forEach((code) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `lang-option${code === getLanguage() ? " is-active" : ""}`;
    button.textContent = code.toUpperCase();
    button.addEventListener("click", () => switchLanguage(code));
    elements.langSwitch.appendChild(button);
  });
  elements.thinkingLabel.textContent = t("thinking");
  fillProviderSelect(elements.providerSelect, settings.providerId);
  const provider = PROVIDERS[settings.providerId] || PROVIDERS.openrouter;
  elements.providerHint.textContent = t(provider.hintKey);
  renderScenarioList();
  renderNationList();
  if (gameState) {
    renderDossier();
    renderLegend();
  }
}

function switchLanguage(language) {
  if (language === getLanguage()) {
    return;
  }
  setLanguage(language);
  writeValue(LANGUAGE_KEY, language);
  refreshLanguageUi();
}

async function boot() {
  setLanguage(detectLanguage(readValue(LANGUAGE_KEY, null)));
  fillProviderSelect(elements.providerSelect, settings.providerId);
  syncSetupProvider();
  await loadFlagFiles();
  bindEvents();
  elements.languageButton.addEventListener("click", () => {
    switchLanguage(LANGUAGES.find((code) => code !== getLanguage()));
  });
  refreshLanguageUi();
  showPanel("map");
  try {
    const response = await fetch("data/scenarios.json");
    scenarios = await response.json();
    renderScenarioList();
  } catch (error) {
    elements.setupError.hidden = false;
    elements.setupError.textContent = t("scenariosFailed");
    return;
  }
  const savedState = readValue(SAVE_KEY, null);
  if (savedState && savedState.nations && savedState.nations[savedState.playerCode]) {
    renderResumeCard(savedState);
  }
  refreshStartButton();
}

boot();
