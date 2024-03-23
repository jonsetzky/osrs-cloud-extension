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
  const pcountResp = await (
    await fetch('https://www.misplaceditems.com/rs_tools/graph/')
  ).text();
  const re = new RegExp(
    '(?<=var\\s+db_data\\s*=\\s*)(\\{[\\s\\S]+\\})(?=\\;)',
    'g'
  );
  // console.log('fetching player count');
  const playerCount = JSON.parse(pcountResp.match(re)[0]).osrs;
  await chrome.storage.local.set({
    player_count: {
      cacheSet: now,
      data: playerCount,
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
