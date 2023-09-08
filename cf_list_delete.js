import 'dotenv/config';
import fetch from 'node-fetch';

const API_TOKEN = process.env.CLOUDFLARE_API_KEY;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL;

// Function to read Cloudflare Zero Trust lists
async function getZeroTrustLists() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/lists`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Auth-Email': ACCOUNT_EMAIL,
      'X-Auth-Key': API_TOKEN,
    },
  });

  const data = await response.json();
  return data.result;
}

;(async() => {
    const lists = await getZeroTrustLists();
    if (!lists) return console.warn("No file lists found - this is not an issue if it's your first time running this script. Exiting.");
    const cgps_lists = lists.filter(list => list.name.startsWith('CGPS List'));
    if (!cgps_lists.length) return console.warn("No lists with matching name found - this is not an issue if you haven't created any filter lists before. Exiting.");

    if (!process.env.CI) console.log(`Got ${lists.length} lists, ${cgps_lists.length} of which are CGPS lists that will be deleted.`);

    let lists_processed = 0;
    for (const list of cgps_lists) {
        console.log(`Deleting list`, process.env.CI ? "(info redacted, running in CI)" : `${list.name} with ID ${list.id}, ${cgps_lists.length - lists_processed - 1} left`);
        
        const resp = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/lists/${list.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'X-Auth-Email': ACCOUNT_EMAIL,
                'X-Auth-Key': API_TOKEN,
            },
        });
    
        const data = await resp.json();
        console.log('Success:', data.success);
        lists_processed++;
        
        await sleep(350); // Cloudflare API rate limit is 1200 requests per 5 minutes, so we sleep for 350ms to be safe
    }    
})();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}