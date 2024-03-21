const gpToString = (gp) => {
  if (!gp) return null;
  if (Math.abs(gp) > 1_000_000_000)
    return (gp / 1_000_000_000).toFixed(4) + 'B';
  if (Math.abs(gp) > 1_000_000) return (gp / 1_000_000).toFixed(3) + 'M';
  if (Math.abs(gp) > 1_000) return (gp / 1000).toFixed(1) + 'K';
  return Math.round(gp);
};

function gpToStringWithCommas(gp) {
  if (!gp) return null;
  return gp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export { gpToStringWithCommas, gpToString };
