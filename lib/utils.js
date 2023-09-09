/**
 * Sleeps for a specified amount of time.
 * @param {number} [ms=350] The amount of time in ms.
 */
export const sleep = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));
