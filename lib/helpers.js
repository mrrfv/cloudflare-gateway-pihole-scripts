import {
  ACCOUNT_EMAIL,
  ACCOUNT_ID,
  API_HOST,
  API_KEY,
  API_TOKEN,
} from "./constants.js";

if (!globalThis.fetch) {
  console.warn(
    "\nIMPORTANT: Your Node.js version doesn't have native fetch support and may not be supported in the future. Please update to v18 or later.\n"
  );
  // Advise what to do if running in GitHub Actions
  if (process.env.GITHUB_WORKSPACE)
    console.warn(
      "Since you're running in GitHub Actions, you should update your Actions workflow configuration to use Node v18 or higher."
    );
  // Import node-fetch since there's no native fetch in this environment
  globalThis.fetch = (await import("node-fetch")).default;
}

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
 * Fires request to the specified URL.
 * @param {string} url The URL to which the request will be fired.
 * @param {RequestInit} options The options to be passed to `fetch`.
 * @returns {Promise}
 */
const request = async (url, options) => {
  if (!(API_TOKEN || API_KEY) || !ACCOUNT_ID) {
    throw new Error(
      "The following secrets are required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID"
    );
  }

  const headers = API_TOKEN
    ? {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      }
    : {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "X-Auth-Email": ACCOUNT_EMAIL,
        "X-Auth-Key": API_KEY,
      };

  /*
	Due to the undocumented Cloudflare API rate limit, the request will be retried until Cloudflare accepts it.
  */
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let response;
  let data;
  let attempts = 0;
  let maxAttempts = 50;

  while(attempts < 50) {
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...headers,
        },
      });

      data = await response.json();

      if (!response.ok) {
        throw new Error('Response not OK');
      }
      return data;
    } catch (error) {
      attempts++;
      console.warn(`An error occured while making a web request: "${error}", retrying. Attempt ${attempts} of ${maxAttempts}.\nTHIS IS NORMAL IN MOST CIRCUMSTANCES. Refrain from reporting this as a bug unless the script doesn't automatically recover after several attempts.`);
      if(attempts >= maxAttempts) {
        // Send a message to the Discord webhook if it exists
        await notifyWebhook(`An HTTP error has occurred (${response ? response.status : "unknown status"}) while making a web request. Please check the logs for further details.`);
        throw new Error(`HTTP error! Status: ${response.status} - ${ (data && 'errors' in data) ? data.errors[0].message : data } - ${error}`);
      }
      await wait(8000);
    }
  }
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
 * @param {boolean} isAllowlisting Whether the value is to be allowlisted.
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
