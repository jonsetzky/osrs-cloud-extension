/**
 * @typedef {object} PriceEntry
 * @property {number} timestamp
 * @property {number|null} lowest
 * @property {number|null} highest
 * @property {number|null} avgLowPrice
 * @property {number|null} avgHighPrice
 * @property {number|null} gePrice
 * @property {number|null} geVolume
 * @property {number|null} lowPriceVolume
 * @property {number|null} highPriceVolume
 */

import { isNumber } from 'mathjs';

const calculateTax = (price) => {
  return price < 100 ? 0 : Math.min(price * 0.01, 5_000_000);
};

/**
 * NOTE: skips null fields and multipliers
 * @param {{[key: string]: number}[]} data
 * @param {string} field Value field name
 * @param {string} multiplier Multiplier field name
 * @returns Returns the avg of sum(field*multiplier)/n
 */
const meanTimesN = (data, field, multiplier) => {
  var n = 0;
  return (
    data.reduce((prev, curr, i, arr) => {
      if (!isNumber(curr[field]) || !isNumber(curr[multiplier])) return prev;
      n += curr[multiplier];
      return prev + curr[field] * curr[multiplier];
    }, 0) / n
  );
};

/**
 *
 * @param {PriceEntry[]} price_series
 * @returns {{
 *  avgLow: number,
 *  avgHigh: number,
 * }}
 */
const averageLowAndHigh = (price_series) => {
  console.log('going to calc price series', price_series);
  const sum = [...price_series].reduce(
    /**
     * @param {[sumLow: number, numLow: number, sumHigh: number, numHigh: number]} prev
     */
    (prev, curr, i, arr) => {
      return [
        prev[0] + (curr.avgLowPrice * curr.lowPriceVolume ?? 0),
        prev[1] + (curr.lowPriceVolume ?? 0),
        prev[2] + (curr.avgHighPrice * curr.highPriceVolume ?? 0),
        prev[3] + (curr.highPriceVolume ?? 0),
      ];
    },
    [0, 0, 0, 0]
  );
  const out = {
    avgLow: sum[0] / sum[1],
    avgHigh: sum[2] / sum[3],
  };
  console.log('price series are', out);
  return out;
};

export { averageLowAndHigh, calculateTax, meanTimesN };
