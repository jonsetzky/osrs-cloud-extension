import React, { Component } from 'react';
import Field from './Field';
import gpToString from '../../../../utils/gpToString';
import { averageLowAndHigh } from './Statistics';

const TAX = 0.01;

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

  state = {
    avgLow: 0,
    avgHigh: 0,
  };

  update = async () => {
    const item = await chrome.storage.local.get(this.props.id.toString());
    if (Object.keys(item) > 0)
      this.setState(
        averageLowAndHigh(item[this.props.id.toString()].price_series),
        () => console.log('state is set', this.state)
      );
  };

  render() {
    return (
      <>
        <Field
          label="Avg. High"
          value={gpToString(this.state.avgHigh) ?? 'Unknown'}
          tooltip="The average low in the timeframe."
        />
        <Field
          label="Avg. Low"
          value={gpToString(this.state.avgLow) ?? 'Unknown'}
          tooltip="The average low in the timeframe."
        />
        <Field
          label="Avg. Margin"
          value={
            gpToString(
              this.state.avgHigh - this.state.avgLow - this.state.avgHigh * TAX
            ) ?? 'Unknown'
          }
          tooltip="Margin of avg. high and low after tax."
        />
      </>
    );
  }
}
