import React, { Component } from 'react';
import Field from './Field';
import { gpToString, gpToStringWithCommas } from '../../../../utils/gpToString';
import {
  calculateTax,
  dataSlope,
  meanTimesN,
  standardDeviation,
} from './StatisticsUtil';
import { addElementListener } from '../dom';
import { Column } from './Column';
import { getAllPrices } from '../db';

const GOOD_ROI = 0.5;
const BAD_ROI = 0;

const SERIES_LENGTH = {
  'one day': 24 * 60 * 60,
  'one week': 7 * 24 * 60 * 60,
  'one month': 30 * 24 * 60 * 60,
  'six months': 6 * 30 * 24 * 60 * 60,
  'one year': 365 * 24 * 60 * 60,
  'five years': 5 * 365 * 24 * 60 * 60,
  all: 7 * 24 * 60 * 60,
};
export const REQ_SERIES_RESOLUTION = {
  '5m': 5 * 60,
  '1h': 60 * 60,
  '6h': 6 * 60 * 60,
  '24h': 24 * 60 * 60,
  '1d': 24 * 60 * 60,
  '1w': 7 * 24 * 60 * 60,
};

const SERIES_RESOLUTION = {
  'one day': REQ_SERIES_RESOLUTION['5m'],
  'one week': 60 * 60,
  'one month': 6 * 60 * 60,
  'six months': 24 * 60 * 60,
  'one year': 24 * 60 * 60,
  'five years': 7 * 24 * 60 * 60,
  all: 7 * 24 * 60 * 60,
};

export default class ExtraStatistics extends Component {
  constructor(props) {
    super(props);
    this.id = props.id;
  }

  _onStoreChange = (changes) => {
    if (!changes) return;
    if (Object.keys(changes)[0] === 'prices') return;
    if (Object.keys(changes)[0] === 'items') return;
    if (
      Object.keys(changes[Object.keys(changes)[0]].newValue).includes(
        'price_series'
      )
    )
      this.update();
  };

  componentDidMount = () => {
    chrome.storage.local.onChanged.addListener(this._onStoreChange);

    addElementListener(
      '#__next > div:nth-child(3) > div.content > div > div > div > div.p-card.p-component > div.p-card-header > div > div.flex.align-items-center.justify-content-center > div > div.p-hidden-accessible.p-dropdown-hidden-select > select > option',
      (records) => {
        const newOption = records.find(
          (record) => record.target?.localName === 'option'
        )?.target.label;
        if (!newOption) return;

        this.currentSeriesLength = SERIES_LENGTH[newOption];
        this.currentSeriesResolution = SERIES_RESOLUTION[newOption];
        this.update();
      }
    );
    this.update();
  };
  componentWillUnmount = () => {
    chrome.storage.local.onChanged.removeListener(this._onStoreChange);
  };

  /**
   * @type {import('./StatisticsUtil').PriceEntry[] }
   */
  price_series = [];
  currentSeriesLength = 24 * 60 * 60; // 1d by default
  currentSeriesResolution = 5 * 60; // 5 min by default
  state = {
    avgLow6h: 0,
    avgHigh6h: 0,
    avgLow: 0,
    avgHigh: 0,
    avgMargin: 0,
    avgMarginRoi: 0,
    buyEstimate: 0,
    coefLow: 0,
    coefHigh: 0,
    slope: 0,
    stdev: 0,
  };

  update = async () => {
    const idStr = this.props.id.toString();
    var item = await chrome.storage.local.get(idStr);
    if (Object.keys(item) < 1) return;
    item = item[idStr];
    if (item.price_series.length < 1) return;
    if (
      !Object.keys(item.price_series).includes(
        this.currentSeriesResolution.toString()
      )
    )
      return; // ignore update if series data is not yet in
    // TODO rework around that

    this.price_series =
      item.price_series[this.currentSeriesResolution.toString()];
    var series6h = [...item.price_series[REQ_SERIES_RESOLUTION['5m']]];
    const endTimestamp = series6h.reduce(
      (prev, curr) => Math.max(prev, curr.timestamp),
      0
    );
    // console.log('6h series', series6h);
    series6h = series6h.filter((e) => e.timestamp > endTimestamp - 6 * 60 * 60);
    const avgLow6h = meanTimesN(series6h, 'avgLowPrice', 'lowPriceVolume');
    const avgHigh6h = meanTimesN(series6h, 'avgHighPrice', 'highPriceVolume');

    const avgLow = meanTimesN(
      this.price_series,
      'avgLowPrice',
      'lowPriceVolume'
    );
    const avgHigh = meanTimesN(
      this.price_series,
      'avgHighPrice',
      'highPriceVolume'
    );
    const avgMargin = avgHigh - avgLow - calculateTax(avgHigh);
    const avgMarginRoi = (avgMargin / avgHigh) * 100;
    const slope = dataSlope(
      series6h,
      'timestamp',
      'avgHighPrice',
      'highPriceVolume'
    );

    const price = (await getAllPrices()).prices.find((p) => p.id === this.id);

    const low = price.instasell;
    const high = price.instabuy;

    const stdevHigh = standardDeviation(
      this.price_series,
      'avgHighPrice',
      'highPriceVolume'
    );

    this.setState({
      low,
      high,
      avgLow,
      avgHigh,
      avgMargin,
      avgMarginRoi,
      avgLow6h,
      avgHigh6h,
      slope,
      stdevHigh,
    });

    // const firstEntryTime = price_series[0].timestamp;
    // const maxPrice = [...price_series].reduce(
    //   (prev, current) => Math.max(prev, current.avgHighPrice),
    //   0
    // );
    // const minPrice = [...price_series].reduce(
    //   (prev, current) =>
    //     current.avgHighPrice ? Math.min(prev, current.avgHighPrice) : prev,
    //   999999999999
    // );
    // console.log('minPrice', minPrice);
    // const d = maxPrice - minPrice;

    // const data = [...price_series].map((e) => {
    //   e.timestamp -= firstEntryTime;
    //   e.timestamp /= 60 * 60 * 24;
    //   //   e.avgHighPrice -= minPrice;
    //   e.avgHighPrice = (e.avgHighPrice - minPrice) / d;
    //   return e;
    // });
    // var stats = new Statistics(data, testVars);
    // console.log('data', data);

    // var regression = stats.linearRegression('timestamp', 'avgHighPrice');

    // this.setState({
    //   highCoef: regression.regressionFirst.beta2.toString(),
    //   ...avgLowNHi,
    // });
  };

  render() {
    return (
      <>
        <Column>
          <Field
            label="Price"
            value={
              <Column>
                <div>{gpToStringWithCommas(this.state.high) ?? 'Unknown'}</div>
                <div>{gpToStringWithCommas(this.state.low) ?? 'Unknown'}</div>
              </Column>
            }
            tooltip="The average low in the timeframe"
          />
        </Column>
        <Column>
          <Field
            label="Avg. High"
            value={gpToString(this.state.avgHigh) ?? 'Unknown'}
            tooltip="The average low in the timeframe"
          />
          <Field
            label="Avg. Low"
            value={gpToString(this.state.avgLow) ?? 'Unknown'}
            tooltip="The average low in the timeframe"
          />
          <Field
            label="Avg. Margin"
            value={`${gpToString(
              this.state.avgMargin
            )} (${this.state.avgMarginRoi.toFixed(2)}%)`}
            tooltip="Margin of avg. high and low after tax"
            color={
              this.state.avgMarginRoi > GOOD_ROI
                ? 'green'
                : this.state.avgMarginRoi < BAD_ROI
                ? 'red'
                : undefined
            }
          />
          <Field
            label="6h avg. high"
            value={gpToString(this.state.avgHigh6h) ?? 'Unknown'}
            tooltip="Avg high from the last 6 hours"
          />

          <Field
            label="6h avg. low"
            value={gpToString(this.state.avgLow6h) ?? 'Unknown'}
            tooltip="Avg low from the last 6 hours"
          />
          <Field
            label="Standard Deviation (High)"
            value={
              `${gpToString(this.state.stdevHigh)} (${(
                (this.state.stdevHigh / this.state.avgHigh) *
                100
              ).toFixed(2)}%)` ?? 'Unknown'
            }
            tooltip="The standard deviation for the time series. Also shown as percentage of the price. Higher is more volatility."
          />
        </Column>
      </>
    );
  }
}
