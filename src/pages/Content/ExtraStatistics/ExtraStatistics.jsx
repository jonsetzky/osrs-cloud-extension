import React, { Component } from 'react';
import Field from './Field';
import gpToString from '../../../../utils/gpToString';
import { calculateTax, meanTimesN } from './StatisticsUtil';
import { addElementListener } from '../dom';
// import Statistics from 'statistics.js';
// import CopyPlugin from 'copy-webpack-plugin';

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
        const SERIES_LENGTH = {
          'one day': 24 * 60 * 60,
          'one week': 7 * 24 * 60 * 60,
          'one month': 30 * 24 * 60 * 60,
          'six months': 6 * 30 * 24 * 60 * 60,
          'one year': 365 * 24 * 60 * 60,
          'five years': 5 * 365 * 24 * 60 * 60,
          all: 7 * 24 * 60 * 60,
        };
        const SERIES_RESOLUTION = {
          'one day': 5 * 60,
          'one week': 60 * 60,
          'one month': 6 * 60 * 60,
          'six months': 24 * 60 * 60,
          'one year': 24 * 60 * 60,
          'five years': 7 * 24 * 60 * 60,
          all: 7 * 24 * 60 * 60,
        };
        const newOption = records.find(
          (record) => record.target?.localName === 'option'
        )?.target.label;
        if (!newOption) return;

        this.currentSeriesLength = SERIES_LENGTH[newOption];
        this.currentSeriesResolution = SERIES_RESOLUTION[newOption];
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
    avgLow: 0,
    avgHigh: 0,
    avgMargin: 0,
    avgMarginRoi: 0,
    coefLow: 0,
    coefHigh: 0,
  };

  update = async () => {
    const idStr = this.props.id.toString();
    var item = await chrome.storage.local.get(idStr);
    if (Object.keys(item) < 1) return;
    item = item[idStr];
    console.log('scale', item);
    this.price_series = item.price_series;

    const avgLow = meanTimesN(
      this.price_series,
      'avgLowPrice',
      'lowPriceVolume'
    );
    const avgHigh = (this.avgHigh = meanTimesN(
      this.price_series,
      'avgHighPrice',
      'highPriceVolume'
    ));
    const avgMargin = avgHigh - avgLow - calculateTax(avgHigh);
    const avgMarginRoi = (avgMargin / avgHigh) * 100;

    this.setState({
      avgLow,
      avgHigh,
      avgMargin,
      avgMarginRoi,
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
        {/* <div className="col">
          <span>LoL</span>
        </div> */}
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
        />
        <Field
          label="Coefficent"
          value="todo"
          tooltip="Margin of avg. high and low after tax"
        />
      </>
    );
  }
}
