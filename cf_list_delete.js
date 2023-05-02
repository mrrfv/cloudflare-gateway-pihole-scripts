require("dotenv").config();
const axios = require('axios');

const API_TOKEN = process.env.CLOUDFLARE_API_KEY;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL;

// Function to read Cloudflare Zero Trust lists
async function getZeroTrustLists() {
  const response = await axios.get(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/lists`,
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
    const lists = await getZeroTrustLists();
    if (!lists) return console.warn("No file lists found - this is not an issue if it's your first time running this script. Exiting.");
    const cgps_lists = lists.filter(list => list.name.startsWith('CGPS List'));
    if (!cgps_lists.length) return console.warn("No lists with matching name found - this is not an issue if you haven't created any filter lists before. Exiting.");

    if (!process.env.CI) console.log(`Got ${lists.length} lists, ${cgps_lists.length} of which are CGPS lists that will be deleted.`);

    for (const list of cgps_lists) {
        console.log(`Deleting list`, process.env.CI ? "(redacted, running in CI)" : `${list.name} with ID ${list.id}`);
        const resp = await axios.request({
            method: 'DELETE',
            url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/lists/${list.id}`,
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Auth-Email': ACCOUNT_EMAIL,
                'X-Auth-Key': API_TOKEN,
              },
        });
        console.log('Success:', resp.data.success);
        await sleep(350); // Cloudflare API rate limit is 1200 requests per 5 minutes, so we sleep for 350ms to be safe
    }
})();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}