export const addElementListener = (selector, callback) => {
  const observer = new MutationObserver(callback);
  console.log('created observer');
  observer.observe(document.querySelector(selector), {
    characterData: false,
    childList: true,
    attributes: true,
    subtree: true,
  });

  return observer;
};

/**
 *
 * @param {MutationObserver} listener
 */
export const removeElementListener = (listener) => {
  listener.disconnect();
};
