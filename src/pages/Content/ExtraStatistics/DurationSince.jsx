import React, { useEffect, useState } from 'react';
import { durationSince } from '../duration';

export const DurationSince = (args) => {
  const [text, setText] = useState('');

  useEffect(() => {
    setInterval(() => {
      setText(durationSince(args.props.timestamp));
    }, 1000);
  }, []);

  return <span {...args}>{text}</span>;
};
