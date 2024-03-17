const mergePriceSeries = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  let merged = [];

  for (let i = 0; i < a.length; i++) {
    merged.push({
      ...a[i],
      ...b.find((itmInner) => itmInner.timestamp === a[i].timestamp),
    });
  }
};

/**
 * Updates db timestamp for a key
 */
const updateDbTimestamp = async (key) => {
  const now = Date.now() / 1000;
  var oldTimestamps = await chrome.storage.local.get('timestamps');
  if (Object.keys(oldTimestamps).length < 1) oldTimestamps = { timestamps: {} };
  oldTimestamps.timestamps[key] = now;
  await chrome.storage.local.set(oldTimestamps);
};

const getItemPriceHistory = async (id) => {
  return await chrome.storage.local.get(id.toString());
};

// TODO add data minimization when it gets old
// -> keep high resolution data only for the last day
const appendItemPriceHistory = async (id, new_series) => {
  var old = chrome.storage.local.get(id.toString());
  if (Object.keys(old).length < 1) old[id] = {};
  old.price_series = mergePriceSeries(new_series, old.price_series);

  var db = {};
  db[id.toString()] = old;
  await chrome.storage.local.set(db);
  await updateDbTimestamp(id);
  return;
};

const updateAllItems = async (items) => {
  await chrome.storage.local.set({ items });
  await updateDbTimestamp('items');
};

const updateAllPrices = async (prices) => {
  await chrome.storage.local.set({ prices });
  await updateDbTimestamp('prices');
};

const getDbTimestamp = async (key) => {
  var data = await chrome.storage.local.get('timestamps');
  if (Object.keys(data).length < 1) data = { timestamps: {} };
  return data.timestamps[key];
};

export {
  getItemPriceHistory,
  appendItemPriceHistory,
  updateAllItems,
  updateAllPrices,
  getDbTimestamp,
};
