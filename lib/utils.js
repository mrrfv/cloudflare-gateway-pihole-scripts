import { once } from "node:events";
import { createReadStream, createWriteStream } from "node:fs";
import { basename } from "node:path";
import { createInterface } from "node:readline";
import { pipeline } from "node:stream/promises";
import { CLOUDFLARE_RATE_LIMITING_COOLDOWN_TIME, RATE_LIMITING_HTTP_ERROR_CODE } from "./constants.js";

if (!globalThis.fetch) {
  globalThis.fetch = (await import("node-fetch")).default;
}

/**
 * Checks if the value is a valid domain.
 * @param {string} value The value to be checked.
 */
export const isValidDomain = (value) =>
  /^\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b$/.test(
    value
  );

/**
 * Extracts all subdomains from a domain including itself.
 * @param {string} domain The domain to be extracted.
 * @returns {string[]}
 */
export const extractDomain = (domain) => {
  const parts = domain.split(".");
  const extractedDomains = [];

  for (let i = 0; i < parts.length; i++) {
    const subdomains = parts.slice(i).join(".");

    extractedDomains.unshift(subdomains);
  }

  return extractedDomains;
};

/**
 * Checks if the value is a comment.
 * @param {string} value The value to be checked.
 */
export const isComment = (value) =>
  value.startsWith("#") ||
  value.startsWith("//") ||
  value.startsWith("!") ||
  value.startsWith("/*") ||
  value.startsWith("*/");

/**
 * Downloads files and concatenates them into one file.
 * @param {string} filePath The path to the file being written to.
 * @param {string[]} urls The URLs to the files to be downloaded.
 */
export const downloadFiles = async (filePath, urls) => {
  // Note: This function used to download files in parallel using `Promise.all`.
  // This was changed to download files sequentially to avoid rate limiting and other issues (servers don't react well to 20+ separate requests in under 1 second).
  for (const url of urls) {
    const response = await fetch(url);
    const writeStream = createWriteStream(filePath, { flags: "a" });

    await pipeline(response.body, writeStream, { end: false });
    writeStream.end("\n");
  }
};

/**
 * @callback onLine
 * @param {string} line The current line.
 * @param {ReturnType<typeof createInterface>} rl The readline interface.
 */

/**
 * Asynchronously reads a file line by line.
 * @param {string} filePath The path to the file.
 * @param {onLine} onLine The callback executed on each line read.
 */
export const readFile = async (filePath, onLine) => {
  try {
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => onLine(line, rl));

    await once(rl, "close");
  } catch (err) {
    console.error(
      `Error occurred while reading ${basename(filePath)} - ${err.toString()}`
    );
    throw err;
  }
};

/**
 * Memoizes a function
 * @template T The argument type of the function.
 * @template R The return type of the function.
 * @param {(...fnArgs: T[]) => R} fn The function to be memoized.
 */
export const memoize = (fn) => {
  const cache = new Map();

  return (...args) => {
    const key = args.join("-");

    if (cache.has(key)) return cache.get(key);

    const result = fn(...args);

    cache.set(key, result);
    return result;
  };
};

/**
 * Waits for a period of time
 * @param {number} ms The time to wait in milliseconds.
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a message to a Discord-compatible webhook.
 * @param {url|string} url The webhook URL.
 * @param {string} message The message to be sent.
 * @returns {Promise}
 */
async function sendMessageToWebhook(url, message) {
  // Create the payload object with the message
  // The message is provided as 2 different properties to improve compatibility with webhook servers outside Discord
  const payload = { content: message, body: message };

  // Send a POST request to the webhook url with the payload as JSON
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    } else {
      return true;
    }
  } catch (error) {
    console.error('Error sending message to webhook:', error);
    return false;
  }
}

/**
 * Sends a CGPS notification to a Discord-compatible webhook.
 * Automatically checks if the webhook URL exists.
 * @param {string} msg The message to be sent.
 * @returns {Promise}
 */
export async function notifyWebhook(msg) {
  // Check if the webhook URL exists
  const webhook_url = process.env.DISCORD_WEBHOOK_URL;

  if (webhook_url && webhook_url.startsWith('http')) {
    // Send the message to the webhook
    try {
      await sendMessageToWebhook(webhook_url, `CGPS: ${msg}`);
    } catch (e) {
      console.error('Error sending message to Discord webhook:', e);
    }
  }
  // Not logging the lack of a webhook URL since it's not a feature everyone would use
}

/**
 * Fetches with retry
 * @param  {Parameters<typeof fetch>} args
 */
export const fetchRetry = async (...args) => {
  let attempts = 0;
  let maxAttempts = 50;
  let response;

  while (attempts < maxAttempts) {
    try {
      response = await fetch(...args);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return response;
    } catch (error) {
      attempts++;
      console.warn(`An error occured while making a web request: "${error}", retrying. Attempt ${attempts} of ${maxAttempts}.\nTHIS IS NORMAL IN MOST CIRCUMSTANCES. Refrain from reporting this as a bug unless the script doesn't automatically recover after several attempts.`);

      if (attempts >= maxAttempts) {
        // Send a message to the Discord webhook if it exists
        await notifyWebhook(`An HTTP error has occurred (${response ? response.status : "unknown status"}) while making a web request. Please check the logs for further details.`);
        throw error;
      }

      if (response.status === RATE_LIMITING_HTTP_ERROR_CODE) {
        console.log(`Waiting for ${CLOUDFLARE_RATE_LIMITING_COOLDOWN_TIME / 1000 / 60} minutes to avoid rate limiting.`);
        await wait(CLOUDFLARE_RATE_LIMITING_COOLDOWN_TIME);
      }
    }
  }
}
