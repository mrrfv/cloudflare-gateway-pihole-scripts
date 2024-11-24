import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { createZeroTrustListsOneByOne } from "./lib/api.js";
import {
  DEBUG,
  DRY_RUN,
  LIST_ITEM_LIMIT,
  LIST_ITEM_SIZE,
  PROCESSING_FILENAME,
} from "./lib/constants.js";
import { normalizeDomain } from "./lib/helpers.js";
import {
  extractDomain,
  isComment,
  isValidDomain,
  memoize,
  notifyWebhook,
  readFile,
} from "./lib/utils.js";

const allowlistFilename = existsSync(PROCESSING_FILENAME.OLD_ALLOWLIST)
  ? PROCESSING_FILENAME.OLD_ALLOWLIST
  : PROCESSING_FILENAME.ALLOWLIST;
const blocklistFilename = existsSync(PROCESSING_FILENAME.OLD_BLOCKLIST)
  ? PROCESSING_FILENAME.OLD_BLOCKLIST
  : PROCESSING_FILENAME.BLOCKLIST;
const allowlist = new Map();
const blocklist = new Map();
const domains = [];
let processedDomainCount = 0;
let unnecessaryDomainCount = 0;
let duplicateDomainCount = 0;
let allowedDomainCount = 0;
const memoizedNormalizeDomain = memoize(normalizeDomain);

// Check if the blocklist.txt and allowlist.txt files exist
for (const filename of [allowlistFilename, blocklistFilename]) {
  if (!existsSync(filename)) {
    console.error(`File not found: ${filename}. Please create a block/allowlist first, or run download_lists.js to download the recommended lists.`);
    process.exit(1);
  }
}

// Read allowlist
console.log(`Processing ${allowlistFilename}`);
await readFile(resolve(`./${allowlistFilename}`), (line) => {
  const _line = line.trim();

  if (!_line) return;

  if (isComment(_line)) return;

  const domain = memoizedNormalizeDomain(_line, true);

  if (!isValidDomain(domain)) return;

  allowlist.set(domain, 1);
});

// Read blocklist
console.log(`Processing ${blocklistFilename}`);
await readFile(resolve(`./${blocklistFilename}`), (line, rl) => {
  if (domains.length === LIST_ITEM_LIMIT) {
    return;
  }

  const _line = line.trim();

  if (!_line) return;

  // Check if the current line is a comment in any format
  if (isComment(_line)) return;

  // Remove prefixes and suffixes in hosts, wildcard or adblock format
  const domain = memoizedNormalizeDomain(_line);

  // Check if it is a valid domain which is not a URL or does not contain
  // characters like * in the middle of the domain
  if (!isValidDomain(domain)) return;

  processedDomainCount++;

  if (allowlist.has(domain)) {
    if (DEBUG) console.log(`Found ${domain} in allowlist - Skipping`);
    allowedDomainCount++;
    return;
  }

  if (blocklist.has(domain)) {
    if (DEBUG) console.log(`Found ${domain} in blocklist already - Skipping`);
    duplicateDomainCount++;
    return;
  }

  // Get all the levels of the domain and check from the highest
  // because we are blocking all subdomains
  // Example: fourth.third.example.com => ["example.com", "third.example.com", "fourth.third.example.com"]
  for (const item of extractDomain(domain).slice(1)) {
    // Check for any higher level domain matches in the allowlist
    if (allowlist.has(item)) {
      if (DEBUG) console.log(`Found parent domain ${item} in allowlist - Skipping ${domain}`);
      allowedDomainCount++;
      return;
    }

    if (!blocklist.has(item)) continue;

    // The higher-level domain is already blocked
    // so it's not necessary to block this domain
    if (DEBUG) console.log(`Found ${item} in blocklist already - Skipping ${domain}`);
    unnecessaryDomainCount++;
    return;
  }

  blocklist.set(domain, 1);
  domains.push(domain);

  if (domains.length === LIST_ITEM_LIMIT) {
    console.log(
      "Maximum number of blocked domains reached - Stopping processing blocklist..."
    );
    rl.close();
  }
});

const numberOfLists = Math.ceil(domains.length / LIST_ITEM_SIZE);

console.log("\n\n");
console.log(`Number of processed domains: ${processedDomainCount}`);
console.log(`Number of duplicate domains: ${duplicateDomainCount}`);
console.log(`Number of unnecessary domains: ${unnecessaryDomainCount}`);
console.log(`Number of allowed domains: ${allowedDomainCount}`);
console.log(`Number of blocked domains: ${domains.length}`);
console.log(`Number of lists to be created: ${numberOfLists}`);
console.log("\n\n");

(async () => {
  if (DRY_RUN) {
    console.log(
      "Dry run complete - no lists were created. If this was not intended, please remove the DRY_RUN environment variable and try again."
    );
    return;
  }

  console.log(
    `Creating ${numberOfLists} lists for ${domains.length} domains...`
  );

  await createZeroTrustListsOneByOne(domains);
  await notifyWebhook(
    `CF List Create script finished running (${domains.length} domains, ${numberOfLists} lists)`
  );
})();
