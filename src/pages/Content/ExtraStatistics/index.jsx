import { createRoot } from 'react-dom/client';
import { waitForElm } from '../injector';
import ExtraStatistics from './ExtraStatistics';
import React from 'react';
import { Chart } from 'chart.js/auto';
import { getItemPriceHistory } from '../db';
import 'chartjs-adapter-moment';
import annotationPlugin from 'chartjs-plugin-annotation';
import { seriesIndicators } from './StatisticsUtil';
import { addElementListener } from '../dom';

Chart.register(annotationPlugin);

const injectElement = async (selector, element) => {
  const root = createRoot(await waitForElm(selector));
  root.render(element);
};

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

const GREEN = 'rgb(60, 133, 74)';
const DARK_GREEN = 'rgba(45, 100, 60)';
const RED = 'rgb(233, 30, 99)';
const DARK_RED = 'rgb(150, 10, 60)';
const LIGHT_BLUE = 'rgb(0, 188, 212)';
const ORANGE = 'rgb(245, 124, 0)';
const PURPLE = 'rgb(156, 39, 176)';
const YELLOW = 'rgb(212, 212, 40)';

/**
 *
 */
var context = {
  /** @type {Chart} */
  chart: undefined,
};

const createDataset = (priceSeries) => {
  const indicators = seriesIndicators(priceSeries);

  return [
    {
      type: 'line',
      label: 'Instabuy',
      data: priceSeries.map((row) => ({
        x: row.timestamp * 1000, // takes input as milliseconds
        y: row.avgHighPrice,
      })),
      backgroundColor: GREEN,
      borderColor: GREEN,
      borderWidth: 2,
      pointRadius: 1.5,
      tension: 0.4,
      yAxisID: 'y',
    },
    {
      hidden: true,
      type: 'bar',
      label: 'Instabuy volume',
      data: priceSeries.map((row) => ({
        x: row.timestamp * 1000,
        y: row.highPriceVolume,
      })),
      backgroundColor: LIGHT_BLUE,
      yAxisID: 'y1',
    },
    {
      hidden: true,
      type: 'line',
      label: 'Average price',
      data: indicators.meanTotal.map((row) => ({
        x: row.timestamp * 1000,
        y: row.value,
      })),
      backgroundColor: PURPLE,
      borderColor: PURPLE,
      borderWidth: 1,
      pointRadius: 1,
      yAxisID: 'y',
    },
    {
      type: 'line',
      label: 'Moving average',
      data: indicators.movingMean.map((row) => ({
        x: row.timestamp * 1000,
        y: row.mean,
      })),
      backgroundColor: PURPLE,
      borderColor: PURPLE,
      borderWidth: 1,
      pointRadius: 0,
      yAxisID: 'y',
    },
    {
      type: 'line',
      label: 'Instasell',
      data: priceSeries.map((row) => ({
        x: row.timestamp * 1000,
        y: row.avgLowPrice,
      })),
      borderWidth: 2,
      pointRadius: 1.5,
      backgroundColor: RED,
      borderColor: RED,
      tension: 0.4,
      yAxisID: 'y',
    },
    {
      hidden: true,
      type: 'bar',
      label: 'Instasell volume',
      data: priceSeries.map((row) => ({
        x: row.timestamp * 1000,
        y: row.lowPriceVolume,
      })),
      backgroundColor: ORANGE,
      yAxisID: 'y1',
    },
  ];
};

const PLAYER_COUNT_UPDATE_INTERVAL = 60; // seconds
const fetchPlayerCount = async () => {
  const now = Math.floor(Date.now() / 1000);

  const { cacheSet, data } = (await chrome.storage.local.get('player_count'))
    ?.player_count ?? { cacheSet: null, data: null };

  if (data !== null && cacheSet + PLAYER_COUNT_UPDATE_INTERVAL > now)
    return data;

  return data;
};

/**
 *
 * @param {Chart} chart
 * @returns
 */
const updateGraph = async function (canvas, id) {
  // todo: only gets 5m time series, find a way to display the current time series
  const data = await getItemPriceHistory(id);
  if (context.chart === undefined) {
    context.chart = new Chart(canvas, {});
  }
  if (data?.[id] === undefined) return;

  const endTimestamp = Date.now() / 1000;
  const startTimestamp = endTimestamp - context.currentSeriesLength;

  console.log('context updated', context);

  const priceSeries = data[id].price_series[context.currentSeriesResolution];
  if (priceSeries === undefined) return;
  const indicators = seriesIndicators(priceSeries);

  context.chart.data.datasets = createDataset(priceSeries);
  const pcount = [...(await fetchPlayerCount())]
    .filter((e) => e[0] / 1000 <= endTimestamp && e[0] / 1000 >= startTimestamp)
    .map((row) => ({
      x: row[0],
      y: row[1],
    }));
  const i = context.chart.data.datasets.findIndex(
    (e) => e.label === 'Online players'
  );
  // console.log('pcount', pcount);
  if (i >= 0) context.chart.data.datasets[i].data = pcount;
  else
    context.chart.data.datasets.push({
      hidden: true,
      type: 'line',
      label: 'Online players',
      data: pcount,
      backgroundColor: YELLOW,
      borderColor: YELLOW,
      borderWidth: 1,
      pointRadius: 0,
      yAxisID: 'y2',
    });

  context.chart.options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'x',
    },
    spanGaps: true,
    scales: {
      x: {
        type: 'time',
        time: {
          // unit: 'hour',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',

        // grid line settings
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      },
      y2: {
        type: 'linear',
        display: true,
        position: 'right',

        // grid line settings
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      },
    },
    plugins: {
      annotation: {
        annotations: [
          {
            type: 'line',
            mode: 'horizontal',
            yMin: indicators.meanHigh,
            yMax: indicators.meanHigh,
            borderColor: DARK_GREEN,
            borderWidth: 0.5,
            label: {
              content: 'Test label',
            },
          },
          {
            type: 'line',
            mode: 'horizontal',
            yMin: indicators.meanLow,
            yMax: indicators.meanLow,
            borderColor: DARK_RED,
            borderWidth: 0.5,
            label: {
              content: 'Test label',
            },
          },
        ],
      },
    },
  };
  // console.log('datasets', chart.data.datasets);
  context.chart.update('none');
};

const injectExtraStats = async (id) => {
  // make the container for all stats wired so it fits the extra column
  waitForElm(
    '#__next > div:nth-child(3) > div.content > div > div > div > div.align-items-center.justify-content-center.flex > div'
  ).then((statsContainer) => {
    statsContainer.style = 'max-width:1147px';
  });

  // use this to hide elements
  //   waitForElm(
  //     '#__next > div:nth-child(3) > div.content > div > div > div > div.align-items-center.justify-content-center.flex > div > div:nth-child(3)'
  //   ).then((e) => (e.style.display = 'none'));

  injectElement(
    '#__next > div:nth-child(3) > div.content > div > div > div > div.align-items-center.justify-content-center.flex > div',
    <ExtraStatistics id={id} />
  );

  const canvas = await waitForElm(
    '#__next > div:nth-child(3) > div.content > div > div > div > div.p-card.p-component'
  ).then((elm) => {
    const newDiv = document.createElement('div');
    newDiv.style = 'position: relative; height: 400px;';
    elm.appendChild(newDiv);
    const newElm = document.createElement('canvas', {
      id: 'acquisitions',
    });
    newDiv.appendChild(newElm);
    return newElm;
  });
  await waitForElm(
    '#__next > div:nth-child(3) > div.content > div > div > div > div.p-card.p-component > div.p-card-body > div'
  ).then((elm) => (elm.style = 'display: none'));
  // await injectElement(
  //   '#__next > div:nth-child(3) > div.content > div > div > div > div.p-card.p-component',
  //   <div>
  //     <canvas id="acquisitions"></canvas>
  //   </div>
  // );

  context.currentSeriesLength = SERIES_LENGTH['one day'];
  context.currentSeriesResolution = SERIES_RESOLUTION['one day'];
  await updateGraph(canvas, id);

  // document.addEventListener('playerCountUpdated', async () =>
  //   updateGraph(canvas, id)
  // );

  addElementListener(
    '#__next > div:nth-child(3) > div.content > div > div > div > div.p-card.p-component > div.p-card-header > div > div.flex.align-items-center.justify-content-center > div > div.p-hidden-accessible.p-dropdown-hidden-select > select > option',
    (records) => {
      const newOption = records.find(
        (record) => record.target?.localName === 'option'
      )?.target.label;
      if (!newOption) return;

      context.currentSeriesLength = SERIES_LENGTH[newOption];
      context.currentSeriesResolution = SERIES_RESOLUTION[newOption];
      updateGraph(canvas, id);
    }
  );

  chrome.storage.local.onChanged.addListener(async (c) => {
    console.log('changed', Object.keys(c)[0]);
    if (Object.keys(c)[0] === id.toString()) updateGraph(canvas, id);
  });
};

export { injectExtraStats };
