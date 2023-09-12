import fs from 'fs';
import { DRY_RUN, FAST_MODE, LIST_ITEM_LIMIT } from './lib/constants.js';
import { createZeroTrustListsAtOnce, createZeroTrustListsOneByOne } from './lib/api.js';
import { truncateArray } from './lib/utils.js';

if (!process.env.CI) console.log(`List item limit set to ${LIST_ITEM_LIMIT}`);

let whitelist = []; // Define an empty array for the whitelist

// Read whitelist.csv and parse
fs.readFile('whitelist.csv', 'utf8', async (err, data) => {
  if (err) {
    console.warn('Error reading whitelist.csv:', err);
    console.warn('Assuming whitelist is empty.')
  } else {
    // Convert into array and cleanup whitelist
    const domainValidationPattern = /^(?!-)[A-Za-z0-9-]+([\-\.]{1}[a-z0-9]+)*\.[A-Za-z]{2,6}$/;
    whitelist = data.split('\n').filter(domain => {
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
        .replace('||', '')
        .replace('@@||', '')
        .replace('^$important', '')
        .replace('*.', '')
        .replace('^', '');
    }).filter(domain => {
      return domainValidationPattern.test(domain);
    });
    console.log(`Found ${whitelist.length} valid domains in whitelist.`);
  }  
});


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
      .replace('^', '')
      .replace('||', '')
      .replace('@@||', '')
      .replace('^$important', '')
      .replace('*.', '')
      .replace('^', '');
  }).filter(domain => {
    return domainValidationPattern.test(domain);
  });

  // Check for duplicates in domains array
  let duplicateDomainCount = 0;
  let uniqueDomains = [];
  let seen = new Set(); // Use a set to store seen values
  for (let domain of domains) {
    if (!seen.has(domain)) { // If the domain is not in the set
      seen.add(domain); // Add it to the set
      uniqueDomains.push(domain); // Push the domain to the uniqueDomains array
    } else { // If the domain is in the set
      duplicateDomainCount++; // Increment the duplicateDomainCount
    }
  }
  if (duplicateDomainCount > 0) console.warn(`Found ${duplicateDomainCount} duplicate domains in input.csv - removing`);

  // Replace domains array with uniqueDomains array
  domains = uniqueDomains;

  // Remove domains from the domains array that are present in the whitelist array
  let whitelistedDomainCount = 0;
  domains = domains.filter(domain => {
    if (whitelist.includes(domain)) {
      whitelistedDomainCount++;
      return false;
    }
    return true;
  });
  if (whitelistedDomainCount > 0) console.warn(`Found ${whitelistedDomainCount} domains in input.csv that are present in the whitelist - removing them`);

  // Trim array to 300,000 domains if it's longer than that
  if (domains.length > LIST_ITEM_LIMIT) {
    console.warn(`${domains.length} domains found in input.csv - input has to be trimmed to ${LIST_ITEM_LIMIT} domains`);
    domains = truncateArray(domains, LIST_ITEM_LIMIT);
  }

  const listsToCreate = Math.ceil(domains.length / 1000);

  if (!process.env.CI) console.log(`Found ${domains.length} valid domains in input.csv after cleanup - ${listsToCreate} list(s) will be created`);

  // If we are dry-running, stop here because we don't want to create lists
  // TODO: we should probably continue, just without making any real requests to Cloudflare
  if (DRY_RUN) return console.log('Dry run complete - no lists were created. If this was not intended, please remove the DRY_RUN environment variable and try again.');

  if (FAST_MODE) {
    await createZeroTrustListsAtOnce(domains);
    return;
  }

  await createZeroTrustListsOneByOne(domains);
});
