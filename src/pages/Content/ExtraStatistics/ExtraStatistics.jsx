import React, { Component } from 'react';
import Field from './Field';
import gpToString from '../../../../utils/gpToString';
import { calculateTax, meanTimesN } from './StatisticsUtil';
// import Statistics from 'statistics.js';
// import CopyPlugin from 'copy-webpack-plugin';

export default class ExtraStatistics extends Component {
  constructor(props) {
    super(props);
    this.id = props.id;
    chrome.storage.local.onChanged.addListener((changes) => {
      if (!changes) return;
      if (Object.keys(changes)[0] === 'prices') return;
      if (Object.keys(changes)[0] === 'items') return;
      if (
        Object.keys(changes[Object.keys(changes)[0]].newValue).includes(
          'price_series'
        )
      )
        this.update();
    });
    this.update();
  }

  /**
   * @type {{ price_series: import('./StatisticsUtil').PriceEntry[] }}
   */
  state = {
    price_series: [],
  };

  avgLow = 0;
  avgHigh = 0;
  avgMargin = 0;
  avgMarginRoi = 0;
  coefLow = 0;
  coefHigh = 0;

  update = async () => {
    const idStr = this.props.id.toString();
    const item = await chrome.storage.local.get(idStr);
    if (Object.keys(item) < 1) return;

    this.setState(
      {
        price_series: item[idStr].price_series,
      },
      () => {
        if (Object.keys(this.state.price_series) < 1) return;

        this.avgLow = meanTimesN(
          this.state.price_series,
          'avgLowPrice',
          'lowPriceVolume'
        );
        console.log('avglow', this.avgLow);
        this.avgHigh = meanTimesN(
          this.state.price_series,
          'avgHighPrice',
          'highPriceVolume'
        );

        this.avgMargin =
          this.avgHigh - this.avgLow - calculateTax(this.avgHigh);
        this.avgMarginRoi = (this.avgMargin / this.avgHigh) * 100;

        this.forceUpdate();
      }
    );
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
        <Field
          label="Avg. High"
          value={gpToString(this.avgHigh) ?? 'Unknown'}
          tooltip="The average low in the timeframe"
        />
        <Field
          label="Avg. Low"
          value={gpToString(this.avgLow) ?? 'Unknown'}
          tooltip="The average low in the timeframe"
        />
        <Field
          key={Object.keys(this.state.price_series)[0]}
          label="Avg. Margin"
          value={`${gpToString(this.avgMargin)} (${this.avgMarginRoi.toFixed(
            2
          )}%)`}
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
