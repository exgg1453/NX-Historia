import { PROVIDERS, requestCompletion } from "./providers.js";
import { buildSystemPrompt, buildTurnPrompt, WAIT_ACTION } from "./prompts.js";
import { createState, applyTurn, parseModelResponse, buildOwnership } from "./engine.js";
import { WorldMap } from "./map.js";
import { readValue, writeValue, removeValue } from "./storage.js";

const SETTINGS_KEY = "nx-historia-settings";
const SAVE_KEY = "nx-historia-save";

const elements = {
  setup: document.getElementById("setup"),
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
  playerSwatch: document.getElementById("playerSwatch"),
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
let mapReady = false;
let busy = false;

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
    option.textContent = provider.label;
    if (provider.id === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function syncSetupProvider() {
  const provider = PROVIDERS[settings.providerId] || PROVIDERS.openrouter;
  elements.providerHint.textContent = provider.hint;
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
    model: elements.modelInput.value.trim() || provider.defaultModel,
    apiKey: elements.apiKeyInput.value.trim(),
    baseUrl: elements.baseUrlInput.value.trim(),
  };
}

function refreshStartButton() {
  const current = readSetupSettings();
  const provider = PROVIDERS[current.providerId];
  const keyReady = provider.id === "custom" ? true : current.apiKey.length > 0;
  const baseReady = provider.requiresBaseUrl ? current.baseUrl.length > 0 : true;
  elements.startButton.disabled = !(selectedScenario && selectedNationCode && keyReady && baseReady);
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
    title.textContent = scenario.title.replace(/^\d+\s*—\s*/, "");
    const summary = document.createElement("p");
    summary.textContent = scenario.summary;
    body.appendChild(title);
    body.appendChild(summary);
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
    note.textContent = "Önce bir senaryo seç.";
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
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = nation.color;
    chip.appendChild(swatch);
    chip.appendChild(document.createTextNode(nation.name));
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
  elements.playerName.textContent = player.name;
  elements.playerLeader.textContent = `${player.leader} · ${player.government}`;
  elements.playerSwatch.style.background = player.color;
  elements.yearLabel.textContent = gameState.year;
  elements.turnLabel.textContent = `Tur ${gameState.turn}`;

  const gauges = [
    { label: "İstikrar", value: player.stability },
    { label: "Ekonomi", value: player.economy },
    { label: "Ordu", value: player.military },
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
      name.textContent = gameState.nations[code].name;
      const amount = document.createElement("span");
      amount.className = "relation-value";
      if (value >= 30) amount.classList.add("is-friendly");
      if (value <= -30) amount.classList.add("is-hostile");
      amount.textContent = value > 0 ? `+${value}` : String(value);
      item.appendChild(name);
      item.appendChild(amount);
      elements.relations.appendChild(item);
    });

  elements.territoryCount.textContent = `${player.territories.length} bölge`;
}

function renderLegend() {
  const nations = Object.values(gameState.nations)
    .sort((first, second) => second.territories.length - first.territories.length)
    .slice(0, 10);
  elements.mapLegend.innerHTML = "";
  nations.forEach((nation) => {
    const row = document.createElement("div");
    row.className = "legend-row";
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = nation.color;
    const label = document.createElement("span");
    label.textContent = nation.name;
    row.appendChild(swatch);
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
  await worldMap.load("data/world.geo.json");
  territoryCodes = Array.from(worldMap.paths.keys());
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
  setBusy(true, "Harita hazırlanıyor…");
  try {
    await ensureMap();
  } catch (error) {
    setBusy(false);
    addDispatch({
      source: "Sistem",
      title: "Harita yüklenemedi",
      body: `${error.message} Sayfayı yenile veya bağlantını denetle.`,
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
    source: `${player.name} · emir`,
    title: gameState.year,
    body: actionText,
    tone: "player",
    year: gameState.year,
  });
  setBusy(true, "Kançılaryalar toplanıyor…");
  try {
    const raw = await requestCompletion({
      providerId: settings.providerId,
      apiKey: settings.apiKey,
      model: settings.model,
      baseUrl: settings.baseUrl,
      systemPrompt: buildSystemPrompt(territoryCodes),
      userPrompt: buildTurnPrompt(gameState, actionText),
    });
    const result = parseModelResponse(raw);
    const applied = applyTurn(gameState, result);
    if (applied.narrative) {
      addDispatch({
        source: "Dünya",
        title: `${gameState.year} raporu`,
        body: applied.narrative,
        tone: "neutral",
        year: gameState.year,
      });
    }
    applied.dispatches.forEach(addDispatch);
    if (gameState.verdict !== "ongoing") {
      addDispatch({
        source: "Son",
        title: gameState.verdict === "victory" ? "Zafer" : "Yenilgi",
        body: applied.outcome?.reason || "Oyun bitti.",
        tone: gameState.verdict === "victory" ? "alliance" : "war",
        year: gameState.year,
      });
    }
    repaintMap(applied.changedTerritories);
    renderDossier();
    persistGame();
  } catch (error) {
    addDispatch({
      source: "Sistem",
      title: "Emir işlenemedi",
      body: `${error.message} Ayarlardan modeli veya anahtarı denetle, sonra emri tekrar gönder.`,
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
  elements.providerSelect.addEventListener("change", () => {
    const provider = PROVIDERS[elements.providerSelect.value];
    elements.modelInput.value = provider.defaultModel;
    elements.baseUrlField.hidden = !provider.requiresBaseUrl;
    elements.providerHint.textContent = provider.hint;
    refreshStartButton();
  });

  [elements.modelInput, elements.apiKeyInput, elements.baseUrlInput].forEach((input) => {
    input.addEventListener("input", refreshStartButton);
  });

  elements.startButton.addEventListener("click", async () => {
    settings = readSetupSettings();
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

  elements.waitButton.addEventListener("click", () => submitAction(WAIT_ACTION));

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

async function boot() {
  fillProviderSelect(elements.providerSelect, settings.providerId);
  syncSetupProvider();
  bindEvents();
  renderNationList();
  showPanel("map");
  try {
    const response = await fetch("data/scenarios.json");
    scenarios = await response.json();
    renderScenarioList();
  } catch (error) {
    elements.setupError.hidden = false;
    elements.setupError.textContent = "Senaryolar yüklenemedi. Sayfayı yenile.";
    return;
  }
  const savedState = readValue(SAVE_KEY, null);
  if (savedState && savedState.nations && savedState.nations[savedState.playerCode]) {
    renderResumeCard(savedState);
  }
  refreshStartButton();
}

boot();
