function clampStat(value, fallbackValue) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function clampRelation(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(-100, Math.min(100, Math.round(parsed)));
}

export function createState(scenario, playerCode) {
  const nations = {};
  scenario.nations.forEach((nation) => {
    nations[nation.code] = {
      code: nation.code,
      name: nation.name,
      color: nation.color,
      flag: nation.flag || null,
      leader: nation.leader,
      government: nation.government,
      stability: clampStat(nation.stability, 50),
      economy: clampStat(nation.economy, 50),
      military: clampStat(nation.military, 50),
      territories: [...nation.territories],
      relations: {},
    };
  });
  (scenario.relations || []).forEach((relation) => {
    const first = nations[relation.a];
    const second = nations[relation.b];
    if (!first || !second) {
      return;
    }
    const value = clampRelation(relation.value);
    first.relations[relation.b] = value;
    second.relations[relation.a] = value;
  });
  return {
    scenarioId: scenario.id,
    title: scenario.title,
    year: scenario.year,
    turn: 0,
    playerCode,
    nations,
    log: [],
    dispatches: [],
    verdict: "ongoing",
  };
}

export function buildOwnership(state) {
  const ownership = {};
  Object.values(state.nations).forEach((nation) => {
    nation.territories.forEach((territory) => {
      ownership[territory] = nation.code;
    });
  });
  return ownership;
}

export function parseModelResponse(rawText) {
  let text = String(rawText || "").trim();
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Motor okunabilir bir yanıt döndürmedi.");
  }
  const candidate = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(candidate);
}

export function applyTurn(state, result) {
  const changes = result.changes || {};
  const changedTerritories = [];

  const yearAdvance = Number(changes.yearAdvance);
  state.year += Number.isFinite(yearAdvance) ? Math.max(0, Math.min(50, Math.round(yearAdvance))) : 1;
  state.turn += 1;

  if (Array.isArray(changes.newNations)) {
    changes.newNations.forEach((nation) => {
      if (!nation || !nation.code || state.nations[nation.code]) {
        return;
      }
      state.nations[nation.code] = {
        code: nation.code,
        name: nation.name || nation.code,
        color: nation.color || "#7a5c3e",
        flag: null,
        leader: nation.leader || "Bilinmiyor",
        government: nation.government || "Bilinmiyor",
        stability: clampStat(nation.stability, 50),
        economy: clampStat(nation.economy, 50),
        military: clampStat(nation.military, 50),
        territories: Array.isArray(nation.territories) ? [...nation.territories] : [],
        relations: {},
      };
      (state.nations[nation.code].territories || []).forEach((territory) => {
        changedTerritories.push(territory);
      });
    });
  }

  if (changes.nations && typeof changes.nations === "object") {
    Object.entries(changes.nations).forEach(([code, update]) => {
      const nation = state.nations[code];
      if (!nation || !update) {
        return;
      }
      if (update.stability !== undefined) nation.stability = clampStat(update.stability, nation.stability);
      if (update.economy !== undefined) nation.economy = clampStat(update.economy, nation.economy);
      if (update.military !== undefined) nation.military = clampStat(update.military, nation.military);
      if (update.leader) nation.leader = String(update.leader);
      if (update.government) nation.government = String(update.government);
      if (update.name) nation.name = String(update.name);
    });
  }

  if (Array.isArray(changes.relations)) {
    changes.relations.forEach((relation) => {
      if (!relation || !relation.a || !relation.b || relation.a === relation.b) {
        return;
      }
      const first = state.nations[relation.a];
      const second = state.nations[relation.b];
      if (!first || !second) {
        return;
      }
      const value = clampRelation(relation.value);
      first.relations[relation.b] = value;
      second.relations[relation.a] = value;
    });
  }

  if (Array.isArray(changes.territoryTransfers)) {
    changes.territoryTransfers.forEach((transfer) => {
      if (!transfer || !transfer.code || !transfer.to) {
        return;
      }
      const receiver = state.nations[transfer.to];
      if (!receiver) {
        return;
      }
      Object.values(state.nations).forEach((nation) => {
        const index = nation.territories.indexOf(transfer.code);
        if (index !== -1) {
          nation.territories.splice(index, 1);
        }
      });
      receiver.territories.push(transfer.code);
      changedTerritories.push(transfer.code);
    });
  }

  Object.values(state.nations).forEach((nation) => {
    if (nation.territories.length === 0 && nation.code !== state.playerCode) {
      delete state.nations[nation.code];
    }
  });

  Object.values(state.nations).forEach((nation) => {
    Object.keys(nation.relations).forEach((code) => {
      if (!state.nations[code]) {
        delete nation.relations[code];
      }
    });
  });

  const narrative = String(result.narrative || "").trim();
  if (narrative) {
    state.log.push({ year: state.year, text: narrative });
  }

  const dispatches = Array.isArray(result.dispatches) ? result.dispatches : [];
  const preparedDispatches = dispatches
    .filter((dispatch) => dispatch && (dispatch.title || dispatch.body))
    .map((dispatch) => ({
      source: String(dispatch.source || "Kançılarya"),
      title: String(dispatch.title || "Sevk"),
      body: String(dispatch.body || ""),
      tone: ["war", "alliance", "crisis", "economy", "neutral"].includes(dispatch.tone)
        ? dispatch.tone
        : "neutral",
      year: state.year,
    }));

  const verdict = result.outcome?.verdict;
  if (verdict === "victory" || verdict === "defeat") {
    state.verdict = verdict;
  }

  return {
    narrative,
    dispatches: preparedDispatches,
    changedTerritories,
    outcome: result.outcome || null,
  };
}
