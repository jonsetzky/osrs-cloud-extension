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

// chrome.webRequest.onResponseStarted.addListener(
//     (details) => {

//     }
// )

// chrome.webRequest.onCompleted.addListener(
//     (details) => {
//         console.log(details.)
//     }
// )
