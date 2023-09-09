import { ACCOUNT_EMAIL, ACCOUNT_ID, API_HOST, API_TOKEN } from "./constants.js";

/**
 * Fires request to the specified URL.
 * @param {string} url The URL to which the request will be fired.
 * @param {RequestInit} options The options to be passed to `fetch`.
 * @returns {Promise}
 */
const request = async (url, options) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      "X-Auth-Email": ACCOUNT_EMAIL,
      "X-Auth-Key": API_TOKEN,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = response.json();

  console.log(data.success);

  return data;
};

/**
 * Fires request to the Zero Trust gateway.
 * @param {string} path The path which will be appended to the request URL.
 * @param {RequestInit} options The options to be passed to `fetch`.
 * @returns {Promise}
 */
export const requestGateway = (path, options) =>
  request(`${API_HOST}/accounts/${ACCOUNT_ID}/gateway${path}`, options);
