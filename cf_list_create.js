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
} from "./lib/constants.js";
import { normalizeDomain } from "./lib/helpers.js";
import { isComment, isValidDomain, readFile } from "./lib/utils.js";

const allowlistFilename = "whitelist.csv";
const blocklistFilename = "input.csv";
const allowlist = new Map();
const blocklist = new Map();
const domains = [];
let processedDomainCount = 0;
let duplicateDomainCount = 0;

// Read allowlist
console.log(`Processing ${allowlistFilename}`);
await readFile(resolve(allowlistFilename), (line) => {
  const _line = line.trim();

  if (!_line) return;

  if (isComment(_line)) return;

  const domain = normalizeDomain(_line, true);

  if (!isValidDomain(domain)) return;

  allowlist.set(domain, 1);
});

// Read blocklist
console.log(`Processing ${blocklistFilename}`);
await readFile(resolve(blocklistFilename), (line, rl) => {
  if (domains.length === LIST_ITEM_LIMIT) {
    return;
  }

  const _line = line.trim();

  if (!_line) return;

  if (isComment(_line)) return;

  const domain = normalizeDomain(_line);

  if (!isValidDomain(domain)) return;

  processedDomainCount++;

  if (blocklist.has(domain)) {
    console.log(`Found ${domain} in blocklist already - Skipping...`);
    duplicateDomainCount++;
    return;
  }

  if (allowlist.has(domain)) {
    console.log(`Found ${domain} in allowlist - Skipping...`);
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

console.log("\n\n");
console.log(`Number of processed domains: ${processedDomainCount}`);
console.log(`Number of blocked domains: ${domains.length}`);
console.log(`Number of allowed domains: ${allowlist.size}`);
console.log(`Number of duplicate domains: ${duplicateDomainCount}`);
console.log(
  `Number of lists which will be created: ${Math.ceil(
    domains.length / LIST_ITEM_SIZE
  )}`
);
console.log("\n\n");

(async () => {
  if (DRY_RUN) {
    console.log(
      "Dry run complete - no lists were created. If this was not intended, please remove the DRY_RUN environment variable and try again."
    );
    return;
  }

  if (FAST_MODE) {
    await createZeroTrustListsAtOnce(domains);
    return;
  }

  await createZeroTrustListsOneByOne(domains);
})();
