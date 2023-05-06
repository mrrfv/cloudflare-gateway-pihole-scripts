require("dotenv").config();
const fs = require('fs');
const axios = require('axios');

const API_TOKEN = process.env.CLOUDFLARE_API_KEY;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL;
const LIST_ITEM_LIMIT = Number.isSafeInteger(Number(process.env.CLOUDFLARE_LIST_ITEM_LIMIT)) ? Number(process.env.CLOUDFLARE_LIST_ITEM_LIMIT) : 300000;

if (!process.env.CI) console.log(`List item limit set to ${LIST_ITEM_LIMIT}`);

// Read input.csv and parse domains
fs.readFile('input.csv', 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading input.csv:', err);
    return;
  }

  // Convert into array and cleanup input
  const domainValidationPattern = /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/;
  let domains = data.split('\n').filter(domain => {
    // Remove entire lines starting with "127.0.0.1" or "::1", empty lines or comments
    return domain && !domain.startsWith('#') && !domain.startsWith('//') && !domain.startsWith('/*') && !domain.startsWith('*/') && !(domain === '\r');
  }).map(domain => {
    // Remove "\r", "0.0.0.0 ", "127.0.0.1 ", "::1 " and similar from domain items
    return domain
    .replace('\r', '')
    .replace('0.0.0.0 ', '')
    .replace('127.0.0.1 ', '')
    .replace('::1 ', '')
    .replace(':: ', '')
    .replace('|| ', '')
    .replace('^ ', '')
    .replace(/^\|\|/, '')  // Remove leading '||'
    .replace(/\^$/, '');   // Remove trailing '^'
  }).filter(domain => {
    return domainValidationPattern.test(domain);
  });
  
  // Trim array to 300,000 domains if it's longer than that
  if (domains.length > LIST_ITEM_LIMIT) {
    domains = trimArray(domains, LIST_ITEM_LIMIT);
    console.warn(`More than ${LIST_ITEM_LIMIT} domains found in input.csv - input has to be trimmed`);
  }

  // Check for duplicates in domains array
  let uniqueDomains = [];
  let seen = new Set(); // Use a set to store seen values
  for (let domain of domains) {
    if (!seen.has(domain)) { // If the domain is not in the set
      seen.add(domain); // Add it to the set
      uniqueDomains.push(domain); // Push the domain to the uniqueDomains array
    } else { // If the domain is in the set
      console.warn(`Duplicate domain found: ${domain} - removing`); // Log the duplicate domain
    }
  }

  // Replace domains array with uniqueDomains array
  domains = uniqueDomains;

  const listsToCreate = Math.ceil(domains.length / 1000);

  if (!process.env.CI) console.log(`Found ${domains.length} valid domains in input.csv after cleanup - ${listsToCreate} list(s) will be created`);

  // Separate domains into chunks of 1000 (Cloudflare list cap)
  const chunks = chunkArray(domains, 1000);

  // Create Cloudflare Zero Trust lists
  for (const [index, chunk] of chunks.entries()) {
    const listName = `CGPS List - Chunk ${index}`;

    let properList = [];

    chunk.forEach(domain => {
        properList.push({ "value": domain })
    });

    try {
      await createZeroTrustList(listName, properList, (index+1), listsToCreate);
      await sleep(350); // Sleep for 350ms between list additions
    } catch (error) {
      console.error(`Error creating list `, process.env.CI ? "(redacted on CI)" :  `"${listName}": ${error.response.data}`);
    }
  }
});

function trimArray(arr, size) {
  return arr.slice(0, size);
}

// Function to check if a domain is valid
function isValidDomain(domain) {
    const regex = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/;
    return regex.test(domain);
}

// Function to split an array into chunks
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to create a Cloudflare Zero Trust list
async function createZeroTrustList(name, items, currentItem, totalItems) {
  const response = await axios.post(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/gateway/lists`,
    {
      name,
      type: 'DOMAIN', // Set list type to DOMAIN
      items,
    },
    {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Auth-Email': ACCOUNT_EMAIL,
        'X-Auth-Key': API_TOKEN,
      },
    }
  );

  const listId = response.data.result.id;
  console.log(`Created Zero Trust list`, process.env.CI ? "(redacted on CI)" : `"${name}" with ID ${listId} - ${totalItems - currentItem} left`);
}

function percentage(percent, total) {
  return Math.round((percent / 100) * total);
}

// Function to sleep for a specified duration
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
