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
  const sum = price_series.reduce(
    /**
     * @param {[sumLow: number, numLow: number, sumHigh: number, numHigh: number]} prev
     */
    (prev, curr, i, arr) => {
      return [
        prev[0] + curr.avgLowPrice * curr.lowPriceVolume,
        prev[1] + curr.lowPriceVolume,
        prev[2] + curr.avgHighPrice * curr.highPriceVolume,
        prev[3] + curr.highPriceVolume,
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

export { averageLowAndHigh };
