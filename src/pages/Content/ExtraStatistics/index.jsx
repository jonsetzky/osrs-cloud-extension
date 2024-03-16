import { createRoot } from 'react-dom/client';
import { waitForElm } from '../injector';
import ExtraStatistics from './ExtraStatistics';
import React from 'react';

const injectExtraStats = (id) => {
  return waitForElm(
    '#__next > div:nth-child(3) > div.content > div > div > div > div.align-items-center.justify-content-center.flex > div'
  ).then((statsContainer) => {
    var container;
    container = document.createElement('div');
    container.className = statsContainer.firstChild.className;
    statsContainer.appendChild(container);

    const root = createRoot(container);
    console.log('id', id);
    root.render(React.createElement(ExtraStatistics, { id: id }, null));
  });
};

export { injectExtraStats };
