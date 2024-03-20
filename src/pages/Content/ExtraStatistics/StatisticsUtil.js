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
import Statistics from 'statistics.js';

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

const standardDeviation = (data, field, multiplier) => {
  const mean = meanTimesN(data, field, multiplier);
  const n = [...data].reduce((p, c) => (c[multiplier] ?? 0) + p, 0);
  const sum = [...data].reduce((prev, curr) => {
    return prev + (Math.pow(curr[field] - mean, 2) * curr[multiplier]) / n;
  }, 0);
  return Math.sqrt(sum);
};

const dataSlope = (data, x, y, yMultiplier) => {
  var stats = new Statistics([...data], {
    timestamp: 'metric',
  });
  const yMean = meanTimesN([...data], y, yMultiplier);
  const xRange = stats.range([...data].map((e) => e[x]));
  const d = xRange[1] - xRange[0];

  // data = [...data].map((e) => {
  //   e[y] -= yMean;
  //   e[x] = (e[x] - xRange[0]) / d;
  //   return e;
  // });
  return 0;
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
  // console.log('going to calc price series', price_series);
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
  // console.log('price series are', out);
  return out;
};

export {
  averageLowAndHigh,
  calculateTax,
  meanTimesN,
  dataSlope,
  standardDeviation,
};
