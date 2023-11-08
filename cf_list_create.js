import { existsSync } from "fs";
import { resolve } from "path";

import {
  createZeroTrustListsAtOnce,
  createZeroTrustListsOneByOne,
} from "./lib/api.js";
import {
  DRY_RUN,
  FAST_MODE,
  LIST_ITEM_LIMIT,
  LIST_ITEM_SIZE,
  PROCESSING_FILENAME,
} from "./lib/constants.js";
import { normalizeDomain, notifyWebhook } from "./lib/helpers.js";
import {
  extractDomain,
  isComment,
  isValidDomain,
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

// Read allowlist
console.log(`Processing ${allowlistFilename}`);
await readFile(resolve(`./${allowlistFilename}`), (line) => {
  const _line = line.trim();

  if (!_line) return;

  if (isComment(_line)) return;

  const domain = normalizeDomain(_line, true);

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
  const domain = normalizeDomain(_line);

  // Check if it is a valid domain which is not a URL or does not contain
  // characters like * in the middle of the domain
  if (!isValidDomain(domain)) return;

  processedDomainCount++;

  // Get all the levels of the domain and check from the highest
  // because we are blocking all subdomains
  // Example: fourth.third.example.com => ["example.com", "third.example.com", "fourth.third.example.com"]
  const anyDomainExists = extractDomain(domain)
    .reverse()
    .some((item) => {
      if (blocklist.has(item)) {
        if (item === domain) {
          // The exact domain is already blocked
          console.log(`Found ${item} in blocklist already - Skipping`);
          duplicateDomainCount++;
        } else {
          // The higher-level domain is already blocked
          // so it's not necessary to block this domain
          console.log(
            `Found ${item} in blocklist already - Skipping ${domain}`
          );
          unnecessaryDomainCount++;
        }

        return true;
      }

      return false;
    });

  if (anyDomainExists) return;

  if (allowlist.has(domain)) {
    console.log(`Found ${domain} in allowlist - Skipping`);
    allowedDomainCount++;
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
console.log(`Number of blocked domains: ${domains.length}`);
console.log(`Number of allowed domains: ${allowedDomainCount}`);
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

  if (FAST_MODE) {
    await createZeroTrustListsAtOnce(domains);
    // TODO: make this less repetitive
    await notifyWebhook(`CF List Create script finished running (${domains.length} domains, ${numberOfLists} lists)`);
    return;
  }

  await createZeroTrustListsOneByOne(domains);

  await notifyWebhook(`CF List Create script finished running (${domains.length} domains, ${numberOfLists} lists)`);
})();
