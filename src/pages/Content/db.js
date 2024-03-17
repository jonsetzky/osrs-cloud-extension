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
const setItemPriceHistory = async (id, resolution, new_series) => {
  var old = await chrome.storage.local.get(id.toString());
  if (Object.keys(old).length < 1) old[id] = { price_series: {} };
  if (Object.keys(old[id]).length < 1) old[id] = { price_series: {} };

  old[id].price_series[resolution.toString()] = new_series;

  await chrome.storage.local.set(old);
  await updateDbTimestamp(id.toString() + resolution.toString());
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
  setItemPriceHistory,
  updateAllItems,
  updateAllPrices,
  getDbTimestamp,
};
