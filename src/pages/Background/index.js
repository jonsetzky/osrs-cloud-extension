console.log('This is the background page.');
console.log('Put the background scripts here.');

// block repeated requests and use stored data instead
chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    console.log(details.url);
  },
  {
    urls: ['*://query.osrs.cloud/v1/graphql'],
  }
);

const fetchPlayerCount = async () => {
  const now = Math.floor(Date.now() / 1000);
  // the html page contains recent player data
  const recentCountResp = await (
    await fetch('https://www.misplaceditems.com/rs_tools/graph/')
  ).text();
  const re = new RegExp(
    '(?<=var\\s+db_data\\s*=\\s*)(\\{[\\s\\S]+\\})(?=\\;)',
    'g'
  );

  // the "api" contans older data https://www.misplaceditems.com/rs_tools/graph/?ajax=getYear&display=avg
  const oldCountResp = await (
    await fetch(
      'https://www.misplaceditems.com/rs_tools/graph/?ajax=getYear&display=avg'
    )
  ).json();

  // console.log('fetching player count');
  var recentPlayerCount = JSON.parse(recentCountResp.match(re)[0]).osrs;
  var oldPlayerCount = oldCountResp.osrs;

  const oldestRecent = recentPlayerCount.reduce(
    (p, c) => Math.min(p, c[0]),
    999999999999999
  );
  oldPlayerCount = oldPlayerCount.filter((e) => e[0] < oldestRecent);
  console.log(oldestRecent, oldPlayerCount);

  await chrome.storage.local.set({
    player_count: {
      cacheSet: now,
      data: recentPlayerCount.concat(oldPlayerCount),
    },
  });
};

(async () => {
  fetchPlayerCount();
  setInterval(fetchPlayerCount, 1000 * 60 * 5); // get player count every 6 minutes
})();

// chrome.webRequest.onResponseStarted.addListener(
//     (details) => {

//     }
// )

// chrome.webRequest.onCompleted.addListener(
//     (details) => {
//         console.log(details.)
//     }
// )
