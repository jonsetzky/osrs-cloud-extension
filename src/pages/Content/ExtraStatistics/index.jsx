import { createRoot } from 'react-dom/client';
import { waitForElm } from '../injector';
import ExtraStatistics from './ExtraStatistics';
import React from 'react';

const injectElement = async (selector, element) => {
  const root = createRoot(await waitForElm(selector));
  root.render(element);
};

const injectExtraStats = (id) => {
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
};

export { injectExtraStats };
