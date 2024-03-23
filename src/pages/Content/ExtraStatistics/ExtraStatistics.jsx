import React, { Component } from 'react';
import Field from './Field';
import { gpToString, gpToStringWithCommas } from '../../../../utils/gpToString';
import {
  calculateTax,
  dataSlope,
  meanTimesN,
  seriesIndicators,
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

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;
const YEAR = DAY * 365;

const durationToString = (seconds) => {
  const PADDING = 1.2;
  if (seconds < MINUTE * PADDING) return 'less than a minute ago';
  if (seconds < HOUR * PADDING)
    return `${(seconds / MINUTE).toFixed(0)} minutes ago`;
  if (seconds < DAY * PADDING)
    return `${(seconds / HOUR).toFixed(0)} hours ago`;
  if (seconds < WEEK * PADDING) return `${(seconds / DAY).toFixed(0)} days ago`;
  if (seconds < MONTH * PADDING)
    return `${(seconds / WEEK).toFixed(0)} weeks ago`;
  if (seconds < YEAR * PADDING)
    return `${(seconds / MONTH).toFixed(0)} months ago`;
  return `${(seconds / YEAR).toFixed(0)} year(s) ago`;
};

const durationSince = (timestamp) => {
  return durationToString(Date.now() / 1000 - timestamp);
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
    /** @type {import('./StatisticsUtil').Indicators} */
    indicators: {},
    /** @type {import('./StatisticsUtil').Indicators} */
    indicators6h: {},
    low: 0,
    high: 0,
    latestHighTimestamp: 0,
    latestLowTimestamp: 0,
    margin: 0,
    marginRoi: 0,
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

    const indicators = seriesIndicators(this.price_series);

    var series6h = [...item.price_series[REQ_SERIES_RESOLUTION['5m']]];
    const endTimestamp = series6h.reduce(
      (prev, curr) => Math.max(prev, curr.timestamp),
      0
    );
    series6h = series6h.filter((e) => e.timestamp > endTimestamp - 6 * 60 * 60);
    const indicators6h = seriesIndicators(series6h);

    const price = (await getAllPrices()).prices.find((p) => p.id === this.id);
    const low = price.instasell;
    const high = price.instabuy;
    const latestHighTimestamp = price.instabuyTime;
    const latestLowTimestamp = price.instasellTime;
    const margin = high - low - calculateTax(high);
    const marginRoi = (margin / low) * 100;

    this.setState({
      low,
      high,
      latestHighTimestamp,
      latestLowTimestamp,
      margin,
      marginRoi,
      indicators,
      indicators6h,
    });
  };

  render() {
    return (
      <>
        <Column>
          <Field
            label="Latest prices"
            value={
              <Column>
                <div>
                  <span
                    data-pr-tooltip={
                      'Instabuy ' +
                      durationSince(this.state.latestHighTimestamp)
                    }
                  >
                    {gpToStringWithCommas(this.state.high) ?? 'Unknown'}
                  </span>
                </div>
                <div
                  style={{
                    position: 'relative',
                    // float: 'left',
                    textUnderlineOffset: '0.5em',
                    textDecoration: 'underline',
                    textDecorationThickness: '0.05em',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      // float: 'left',
                      left: '-0.9em',
                    }}
                  >
                    &#8211;
                  </div>
                  <span
                    data-pr-tooltip={
                      'Instasell ' +
                      durationSince(this.state.latestLowTimestamp)
                    }
                  >
                    {gpToStringWithCommas(this.state.low) ?? 'Unknown'}
                  </span>
                </div>
                <div
                  style={{
                    position: 'relative',
                    marginTop: '0.5em',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      // float: 'left',
                      left: '-0.9em',
                    }}
                  >
                    =
                  </div>
                  <span data-pr-tooltip="Margin (ROI)">
                    {`${gpToStringWithCommas(
                      this.state.margin.toFixed(0)
                    )} (${this.state.marginRoi.toFixed(2)}%)`}
                  </span>
                </div>
              </Column>
            }
          />
        </Column>
        <Column>
          <Field
            label="Avg. High"
            value={gpToString(this.state.indicators.meanHigh) ?? 'Unknown'}
            tooltip="The average low in the timeframe"
          />
          <Field
            label="Avg. Low"
            value={gpToString(this.state.indicators.meanLow) ?? 'Unknown'}
            tooltip="The average low in the timeframe"
          />
          <Field
            label="Avg. Margin"
            value={`${gpToString(this.state.indicators.meanMargin)} (${(
              this.state.indicators.meanMarginRoi ?? 0
            ).toFixed(2)}%)`}
            tooltip="Margin of avg. high and low after tax"
            color={
              this.state.indicators.meanMarginRoi > GOOD_ROI
                ? 'green'
                : this.state.indicators.meanMarginRoi < BAD_ROI
                ? 'red'
                : undefined
            }
          />
          <Field
            label="6h avg. high"
            value={gpToString(this.state.indicators6h.meanHigh) ?? 'Unknown'}
            tooltip="Avg high from the last 6 hours"
          />

          <Field
            label="6h avg. low"
            value={gpToString(this.state.indicators6h.meanLow) ?? 'Unknown'}
            tooltip="Avg low from the last 6 hours"
          />
          <Field
            label="Standard Deviation (High)"
            value={
              `${gpToString(this.state.indicators.sdHigh)} (${(
                (this.state.indicators.sdHigh /
                  this.state.indicators.meanHigh) *
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
