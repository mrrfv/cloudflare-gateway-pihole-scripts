import 'dotenv/config';
import fetch from 'node-fetch';

const API_TOKEN = process.env.CLOUDFLARE_API_KEY;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL;

// Function to read Cloudflare Zero Trust rules
async function getZeroTrustRules() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/rules`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Auth-Email': ACCOUNT_EMAIL,
      'X-Auth-Key': API_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
}

;(async() => {
    const rules = await getZeroTrustRules();
    const [filtered_rule] = rules.filter(rule => rule.name === "CGPS Filter Lists");

    if (!filtered_rule) return console.warn("No rule with matching name found - this is not an issue if you haven't run the create script yet. Exiting.");

    console.log(`Deleting rule`, process.env.CI ? "(redacted, running in CI)" : `${filtered_rule.name} with ID ${filtered_rule.id}`);

    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/rules/${filtered_rule.id}`;

    const resp = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Auth-Email': ACCOUNT_EMAIL,
            'X-Auth-Key': API_TOKEN,
        },
    });
    
    const data = await resp.json();
    
    console.log('Success: ', data.success);
    await sleep(350); // Cloudflare API rate limit is 1200 requests per 5 minutes, so we sleep for 350ms to be safe
})();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}