const isBrowser = typeof window !== 'undefined';

if (isBrowser) {
  window.__appStorage = window.__appStorage || {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key)
  };
}

const safeParse = (value, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const getJson = async (key, fallbackValue = null) => {
  if (!isBrowser) return fallbackValue;
  const raw = window.__appStorage.getItem(key);
  return safeParse(raw, fallbackValue);
};

export const setJson = async (key, value) => {
  if (!isBrowser) return;
  window.__appStorage.setItem(key, JSON.stringify(value));
};

export const removeKey = async (key) => {
  if (!isBrowser) return;
  window.__appStorage.removeItem(key);
};
