const { fetch: origFetch } = window;
window.fetch = async (...args) => {
  const response = await origFetch(...args);

  var query = {
    url: args[0],
    ...JSON.parse(args[1].body),
  };

  // console.log('query called:', query);

  /**
   * query operations:
   *    getItemPriceHistory
   *        returns the price history of the current item
   *    getAllPrices
   *        returns the prices for all items on the website
   *    getAllItems
   *        returns basic information about all items including:
   *            - daily volume
   *            - name, aliases, examine
   *            - id,
   *            - limit
   *            - ge and alch prices
   */

  /* work with the cloned response in a separate promise
     chain -- could use the same chain with `await`. */
  response
    .clone()
    .json()
    .then((data) => {
      query.data = data.data;
      // console.log('intercepted a query:', query);
      document.dispatchEvent(
        new CustomEvent('queryIntercept', { detail: query })
      );
    })
    .catch((err) => console.error(err));

  /* the original response can be resolved unmodified: */
  return response;

  /* or mock the response: */
  //   return new Response(JSON.stringify({
  //     userId: 1,
  //     id: 1,
  //     title: "Mocked!!",
  //     completed: false
  //   }));
};
