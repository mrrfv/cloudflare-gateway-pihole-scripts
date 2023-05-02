require("dotenv").config();
const axios = require('axios');

const API_TOKEN = process.env.CLOUDFLARE_API_KEY;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL;

// Function to read Cloudflare Zero Trust rules
async function getZeroTrustRules() {
  const response = await axios.get(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/rules`,
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Auth-Email': ACCOUNT_EMAIL,
        'X-Auth-Key': API_TOKEN,
      },
    }
  );

  return response.data.result;
}

;(async() => {
    const rules = await getZeroTrustRules();
    const [filtered_rule] = rules.filter(rule => rule.name === "CGPS Filter Lists");

    if (!filtered_rule) return console.warn("No rule with matching name found - this is not an issue if you haven't run the create script yet. Exiting.");

    console.log(`Deleting rule ${filtered_rule.name} with ID ${filtered_rule.id}`);

    const resp = await axios.request({
        method: 'DELETE',
        url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/rules/${filtered_rule.id}`,
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Auth-Email': ACCOUNT_EMAIL,
            'X-Auth-Key': API_TOKEN,
        },
    });

    console.log('Success: ', resp.data.success);
    await sleep(350); // Cloudflare API rate limit is 1200 requests per 5 minutes, so we sleep for 350ms to be safe
})();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}