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
    const filtered_lists = lists.filter(list => list.name.startsWith('CGPS List'));

    let wirefilter_expression = '';

    // Build the wirefilter expression
    for (const list of filtered_lists) {
        wirefilter_expression += `any(dns.domains[*] in \$${list.id}) or `;
    }
    // Remove the trailing ' or '
    if (wirefilter_expression.endsWith(' or ')) {
        wirefilter_expression = wirefilter_expression.slice(0, -4);
    }
    wirefilter_expression = wirefilter_expression.trim().replace('\n', '');
    if (!process.env.CI) console.log(`Firewall expression contains ${wirefilter_expression.length} characters, and checks against ${filtered_lists.length} filter lists.`)

    const resp = await axios.request({
        method: 'POST',
        url: `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/rules`,
        headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Auth-Email': ACCOUNT_EMAIL,
            'X-Auth-Key': API_TOKEN,
        },
        data: {
            "name": "CGPS Filter Lists",
            "description": "Filter lists created by Cloudflare Gateway Pi-hole Scripts. Avoid editing this rule. Changing the name of this rule will break the script.",
            "enabled": true,
            "action": "block",
            "filters": ["dns"],
            "traffic": wirefilter_expression,
        }
    });
    console.log('Success:', resp.data.success);
})();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
