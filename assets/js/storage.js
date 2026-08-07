const memoryStore = new Map();

function hasLocalStorage() {
  try {
    const probe = "__nx_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch (error) {
    return false;
  }
}

const localStorageAvailable = hasLocalStorage();

export function readValue(key, fallbackValue = null) {
  try {
    const raw = localStorageAvailable
      ? window.localStorage.getItem(key)
      : memoryStore.get(key);
    if (raw === null || raw === undefined) {
      return fallbackValue;
    }
    return JSON.parse(raw);
  } catch (error) {
    return fallbackValue;
  }
}

export function writeValue(key, value) {
  const raw = JSON.stringify(value);
  try {
    if (localStorageAvailable) {
      window.localStorage.setItem(key, raw);
    } else {
      memoryStore.set(key, raw);
    }
  } catch (error) {
    memoryStore.set(key, raw);
  }
}

export function removeValue(key) {
  try {
    if (localStorageAvailable) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    void error;
  }
  memoryStore.delete(key);
}
