import { createRoot } from 'react-dom/client';
import { waitForElm } from '../injector';
import ExtraStatistics from './ExtraStatistics';
import React from 'react';
import { Chart } from 'chart.js/auto';
import { getItemPriceHistory } from '../db';
import 'chartjs-adapter-moment';
import annotationPlugin from 'chartjs-plugin-annotation';
import { seriesIndicators } from './StatisticsUtil';

Chart.register(annotationPlugin);

const injectElement = async (selector, element) => {
  const root = createRoot(await waitForElm(selector));
  root.render(element);
};

const GREEN = 'rgb(60, 133, 74)';
const DARK_GREEN = 'rgba(45, 100, 60)';
const RED = 'rgb(233, 30, 99)';
const DARK_RED = 'rgb(150, 10, 60)';
const LIGHT_BLUE = 'rgb(0, 188, 212)';
const ORANGE = 'rgb(245, 124, 0)';
const PURPLE = 'rgb(156, 39, 176)';
const YELLOW = 'rgb(212, 212, 40)';

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
      data: indicators.mean.map((row) => ({
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
const updateGraph = async function (canvas, id, chart = null) {
  // todo: only gets 5m time series, find a way to display the current time series
  const data = await getItemPriceHistory(id);
  if (chart === null) {
    chart = new Chart(canvas, {});
  }
  if (data?.[id] === undefined) return chart;

  const endTimestamp = Date.now() / 1000;
  const startTimestamp = endTimestamp - 60 * 60 * 24;

  const priceSeries = data[id].price_series['300'];
  const indicators = seriesIndicators(priceSeries);

  chart.data.datasets = createDataset(priceSeries);
  const pcount = [...(await fetchPlayerCount())]
    .filter((e) => e[0] / 1000 <= endTimestamp && e[0] / 1000 >= startTimestamp)
    .map((row) => ({
      x: row[0],
      y: row[1],
    }));
  const i = chart.data.datasets.findIndex((e) => e.label === 'Online players');
  console.log('pcount', pcount);
  if (i >= 0) chart.data.datasets[i].data = pcount;
  else
    chart.data.datasets.push({
      hidden: false,
      type: 'line',
      label: 'Online players',
      data: pcount,
      backgroundColor: YELLOW,
      borderColor: YELLOW,
      borderWidth: 1,
      pointRadius: 0,
      yAxisID: 'y2',
    });

  chart.options = {
    animation: false,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'x',
    },
    spanGaps: true,
    responsive: true,
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
  chart.update('none');
  return chart;
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

  const chart = await updateGraph(canvas, id);
  // document.addEventListener('playerCountUpdated', async () =>
  //   updateGraph(canvas, id)
  // );

  chrome.storage.local.onChanged.addListener(async () => {
    updateGraph(canvas, id, chart);
  });
};

export { injectExtraStats };
