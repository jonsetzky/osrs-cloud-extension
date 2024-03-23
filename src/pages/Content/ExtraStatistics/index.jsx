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
const DARK_GREEN = 'rgb(60, 133, 74, 128)';
const RED = 'rgb(233, 30, 99)';

const createDataset = (priceSeries) => {
  return [
    {
      type: 'line',
      label: 'Instabuy',
      data: priceSeries.map((row) => ({
        x: row.timestamp * 1000, // takes input as milliseconds
        y: row.avgHighPrice,
      })),
      backgroundColor: GREEN,
      borderColor: DARK_GREEN,
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
      yAxisID: 'y1',
    },
    {
      type: 'line',
      label: 'Instasell',
      data: priceSeries.map((row) => ({
        x: row.timestamp * 1000,
        y: row.avgLowPrice,
      })),
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
      yAxisID: 'y1',
    },
  ];
};

/**
 *
 * @param {Chart} chart
 * @returns
 */
const updateGraph = async function (canvas, id, chart = null) {
  // todo: only gets 5m time series, find a way to display the current time series
  const data = await getItemPriceHistory(id);
  if (data === undefined) return;
  const priceSeries = (await getItemPriceHistory(id))[id].price_series['300'];
  const indicators = seriesIndicators(priceSeries);

  if (chart === null) {
    chart = new Chart(canvas, {});
  }
  console.log('priceSeries', priceSeries);
  chart.data.datasets = createDataset(priceSeries);
  chart.options = {
    animation: false,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
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
    },
    plugins: {
      annotation: {
        annotations: [
          {
            type: 'line',
            mode: 'horizontal',
            yMin: indicators.meanHigh,
            yMax: indicators.meanHigh,
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 2,
            label: {
              content: 'Test label',
            },
          },
        ],
      },
    },
  };
  console.log('datasets', chart.data.datasets);
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

  chrome.storage.local.onChanged.addListener(async () => {
    updateGraph(canvas, id, chart);
  });
};

export { injectExtraStats };
