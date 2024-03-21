import React from 'react';
import gpToString, { gpToStringWithCommas } from '../../../../utils/gpToString';

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 
 * props: {
      price: number | undefined;
      secondPrice: number | undefined;
      shorten: boolean;
      priceTooltip: string | undefined;
      secondPriceTooltip: string | undefined;
    }
 */
export const PriceSpan = ({ props }) => {
  return (
    <div className="_id__header-section__w8YMj">
      <div data-pr-tooltip={props.priceTooltip}>
        {props.shorten
          ? gpToString(props.price)
          : gpToStringWithCommas(Math.round(props.price))}
      </div>
      {props.secondPrice === undefined ? undefined : (
        <div data-pr-tooltip={props.secondPriceTooltip}>
          {props.shorten
            ? gpToString(props.secondPrice)
            : gpToStringWithCommas(Math.round(props.secondPrice))}
        </div>
      )}
    </div>
  );
};
