const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = WEEK * 4;
const YEAR = DAY * 365;

const durationToString = (seconds: number) => {
  const s = seconds;
  const PADDING = 1.2;
  if (s < MINUTE * PADDING) return `${s} seconds ago`;
  if (s < HOUR * PADDING) return `${s / MINUTE} minutes ago`;
  if (s < DAY * PADDING) return `${s / HOUR} hours ago`;
  if (s < WEEK * PADDING) return `${s / DAY} days ago`;
  if (s < MONTH * PADDING) return `${s / WEEK} weeks ago`;
  if (s < YEAR * PADDING) return `${s / MONTH} months ago`;
  return `${s / YEAR} year(s) ago`;
};

const durationSince = (timestamp: number) => {
  return durationToString(Date.now() / 1000 - timestamp);
};

export { durationSince };
