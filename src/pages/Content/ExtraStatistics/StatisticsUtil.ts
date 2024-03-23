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
import { durationSince } from '../duration';
// import Statistics from 'statistics.js';

type PriceEntry = {
  timestamp: number;
  lowest: number | null;
  highest: number | null;
  avgLowPrice: number | null;
  avgHighPrice: number | null;
  gePrice: number | null;
  geVolume: number | null;
  lowPriceVolume: number | null;
  highPriceVolume: number | null;
};

const calculateTax = (price: number) => {
  return price < 100 ? 0 : Math.min(price * 0.01, 5_000_000);
};

/**
 * NOTE: skips null fields and multipliers
 * @param {{[key: string]: number}[]} data
 * @param {string} field Value field name
 * @param {string} multiplier Multiplier field name
 * @returns Returns the avg of sum(field*multiplier)/n
 */
const meanTimesN = (
  data: PriceEntry[],
  field: keyof PriceEntry,
  multiplier: keyof PriceEntry
) => {
  var n = 0;
  return (
    data.reduce((prev, curr, i, arr) => {
      if (!isNumber(curr[field]) || !isNumber(curr[multiplier])) return prev;
      n += curr[multiplier] ?? 0;
      return prev + (curr[field] ?? 0) * (curr[multiplier] ?? 0);
    }, 0) / n
  );
};

/**
 * TODO: doesn't take multiplier fully into account yet
 * @param {*} data
 * @param {*} field
 * @param {*} multiplier
 * @returns
 */
const standardDeviation = (
  data: PriceEntry[],
  field: keyof PriceEntry,
  multiplier: keyof PriceEntry
) => {
  const mean = meanTimesN(data, field, multiplier);
  const n = [...data].reduce((p, c) => (c[multiplier] ?? 0) + p, 0);
  const sum = [...data].reduce((prev, curr) => {
    return (
      prev +
      (Math.pow((curr[field] ?? 0) - mean, 2) * (curr[multiplier] ?? 0)) / n
    );
  }, 0);
  return Math.sqrt(sum);
};

// const dataSlope = (
//   data: PriceEntry[],
//   x: keyof PriceEntry,
//   y: keyof PriceEntry,
//   yMultiplier: keyof PriceEntry
// ) => {
//   var stats = new Statistics([...data], {
//     timestamp: 'metric',
//   });
//   const yMean = meanTimesN([...data], y, yMultiplier);
//   const xRange = stats.range([...data].map((e) => e[x]));
//   const d = xRange[1] - xRange[0];

//   // data = [...data].map((e) => {
//   //   e[y] -= yMean;
//   //   e[x] = (e[x] - xRange[0]) / d;
//   //   return e;
//   // });
//   return 0;
// };

/**
 *
 * @param {PriceEntry[]} price_series
 * @returns {{
 *  avgLow: number,
 *  avgHigh: number,
 * }}
 */
const averageLowAndHigh = (price_series: PriceEntry[]) => {
  // console.log('going to calc price series', price_series);
  const sum = [...price_series].reduce(
    /**
     * @param {[sumLow: number, numLow: number, sumHigh: number, numHigh: number]} prev
     */
    (prev, curr, i, arr) => {
      return [
        prev[0] + (curr.avgLowPrice ?? 0) * (curr.lowPriceVolume ?? 0),
        prev[1] + (curr.lowPriceVolume ?? 0),
        prev[2] + (curr.avgHighPrice ?? 0) * (curr.highPriceVolume ?? 0),
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

function interpolate(a: number, b: number, f: number) {
  return a + (b - a) * Math.min(Math.max(0, f), 1);
}

function getInterpSeries<
  T extends { timestamp: number; [key: string]: number },
  K extends keyof T
>(series: T[], timestamp: number, property: K): number | null {
  const first = series.find(
    (e) => e.timestamp <= timestamp && e[property] !== null
  );
  const second = series.find(
    (e) => e.timestamp >= timestamp && e[property] !== null
  );

  if (first === undefined || second === undefined) return null;
  if (first === second) return first[property];

  // f = value [0.0, 1.0] equalling to the value between first and second
  const f =
    (timestamp - first.timestamp) / (second.timestamp - first.timestamp);

  return interpolate(first[property], second[property], f);
}

const seriesIndicators = (series: PriceEntry[]) => {
  const lowVolume = [...series].reduce(
    (p, c) => p + (c.lowPriceVolume ?? 0),
    0
  );
  const highVolume = [...series].reduce(
    (p, c) => p + (c.highPriceVolume ?? 0),
    0
  );
  const meanHigh = meanTimesN(series, 'avgHighPrice', 'highPriceVolume');
  const meanLow = meanTimesN(series, 'avgLowPrice', 'lowPriceVolume');
  const meanMargin = meanHigh - meanLow - calculateTax(meanHigh);
  const meanMarginRoi = (meanMargin / meanLow) * 100;
  const sdHigh = standardDeviation(series, 'avgHighPrice', 'highPriceVolume');
  const sdLow = standardDeviation(series, 'avgLowPrice', 'lowPriceVolume');

  const mean = [...series].map((e) => ({
    timestamp: e.timestamp,
    value: (() => {
      const hi = getInterpSeries(series as any, e.timestamp, 'avgHighPrice');
      const lo = getInterpSeries(series as any, e.timestamp, 'avgLowPrice');

      if (hi === null || lo === null) return null;
      return (hi + lo) / 2;
    })(),
  }));

  return {
    mean,
    lowVolume,
    highVolume,
    meanHigh,
    meanLow,
    meanMargin,
    meanMarginRoi,
    sdHigh,
    sdLow,
  };
};

export type Indicators = ReturnType<typeof seriesIndicators>;

export {
  averageLowAndHigh,
  calculateTax,
  meanTimesN,
  // dataSlope,
  standardDeviation,
  seriesIndicators,
};
