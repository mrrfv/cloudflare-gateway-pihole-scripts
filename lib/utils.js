/**
 * Sleeps for a specified amount of time.
 * @param {number} [ms=350] The amount of time in ms.
 */
export const sleep = (ms = 350) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Truncates an array to the specified size.
 * @param {any[]} arr The array to be truncated.
 * @param {number} size The size to which the array will be truncated.
 * @returns {any[]}
 */
export const truncateArray = (arr, size) => arr.slice(0, size);
