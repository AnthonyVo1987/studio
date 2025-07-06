
'use server';

/**
 * @fileOverview A temporary validation file to demonstrate the existence and
 * usage of the `listOptionsContracts` method from the `@polygon.io/client-js` library.
 * This file serves as a functional proof that the method is available in the version
 * of the library used by this project. It can be safely deleted after review.
 */

import { restClient, type IRestClient } from '@polygon.io/client-js';

/**
 * An isolated function to demonstrate a call to `listOptionsContracts`.
 * 
 * If this function is valid and the project compiles, it proves that
 * `client.reference.listOptionsContracts` exists and is a callable method.
 * 
 * @param apiKey A valid Polygon.io API key.
 * @param tickerSymbol The stock ticker to query, e.g., "AAPL".
 * @returns A promise that resolves to the number of option contracts found.
 */
export async function validateListOptionsContractsMethod(apiKey: string, tickerSymbol: string): Promise<number> {
  // 1. Initialize the official Polygon.io rest client.
  const client: IRestClient = restClient(apiKey);
  
  // 2. This is the method call in question. We are calling the `listOptionsContracts`
  //    function, which is part of the `reference` endpoint group on the client instance.
  //    The library returns an async iterator (paginator) to handle large result sets.
  const contractsIterator = client.reference.listOptionsContracts({
    underlying_ticker: tickerSymbol,
    limit: 10, // We only need a few results to prove the method works.
  });

  let contractCount = 0;

  // 3. We use a `for await...of` loop, which is the standard way to consume
  //    the async iterator returned by the library method.
  for await (const contract of contractsIterator) {
    contractCount++;
    console.log(`Found contract: ${contract.ticker}`);
  }

  // 4. Return the count as proof of successful execution.
  return contractCount;
}
