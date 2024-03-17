import { React } from 'react';
import { injectExtraStats } from './ExtraStatistics';
import { printLine } from './modules/print';
import { setItemPriceHistory, updateAllItems, updateAllPrices } from './db.js';
import { REQ_SERIES_RESOLUTION } from './ExtraStatistics/ExtraStatistics.jsx';

/**
 * @typedef {object} ItemEntry
 * @property {string[]} aliases
 * @property {number} dailyVolume
 * @property {string} examine
 * @property {number} gePrice
 * @property {number} highalch
 * @property {string} icon
 * @property {number} id
 * @property {number} limit
 * @property {number} lowalch
 * @property {boolean} members
 * @property {string} name
 * @property {number[]} relatedItems
 * @property {number} value
 * @property {string} __typename
 */

const injectQueryListener = () => {
  var s = document.createElement('script');
  s.src = chrome.runtime.getURL('queryListener.js');
  s.onload = function () {
    this.remove();
  };
  // see also "Dynamic values in the injected code" section in this answer
  (document.head || document.documentElement).appendChild(s);

  printLine('Injected queryListener.js');
};

console.log('Content script works!');
console.log('Must reload extension for modifications to take effect.');

const id = parseInt(
  new URL(window.location.toString()).pathname.split('/').at(-1)
);
console.log('item id:', id);

document.addEventListener('queryIntercept', async (data) => {
  var query = data.detail;
  // console.log('query interception:', query);
  switch (query.operationName) {
    case 'getAllPrices':
      await updateAllPrices(query.data.price);
      break;
    case 'getAllItems':
      await updateAllItems(query.data.item);
      break;
    case 'getItemPriceHistory':
      await setItemPriceHistory(
        query.variables.itemId,
        REQ_SERIES_RESOLUTION[query.variables.timeSeries],
        query.data.price_series
      );
      break;
    default:
      console.warn('Unknown query operation name:', query.operationName);
  }
});
// chrome.storage.local.onChanged.addListener((changes) => {
//   console.log(changes);
// });
chrome.storage.local.clear();

injectQueryListener();
console.log('Injecting extra stats!');
injectExtraStats(id);

(async () => {
  console.log(
    'using',
    ((await chrome.storage.local.getBytesInUse()) / 1024 / 1024).toFixed(1),
    'MB of storage'
  );
})();

// window.addEventListener('afterload', async () =>
//   injectExtraStats(<ExtraStatistics {...{ avgLow, avgHigh }} />)
// );
// window.onload = async (e) => window.dispatchEvent(new CustomEvent('afterload'));
