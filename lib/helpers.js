import { ACCOUNT_EMAIL, ACCOUNT_ID, API_HOST, API_TOKEN } from "./constants.js";

if (!globalThis.fetch) {
  globalThis.fetch = (await import("node-fetch")).default;
}

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

  const data = await response.json();

  console.log(`HTTP request succeeded: ${data.success}`);

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

/**
 * Normalizes a domain.
 * @param {string} value The value to be normalized.
 * @param {boolean} isAllowlisting Whether the value is to be whitelisted.
 * @returns {string}
 */
export const normalizeDomain = (value, isAllowlisting) => {
  const normalized = value
    .replace(/(0\.0\.0\.0|127\.0\.0\.1|::1|::)\s+/, "")
    .replace("||", "")
    .replace("^$important", "")
    .replace("*.", "")
    .replace("^", "");

  if (isAllowlisting) return normalized.replace("@@||", "");

  return normalized;
};
