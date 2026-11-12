import { getZeroTrustLists, upsertZeroTrustDNSRule, upsertZeroTrustSNIRule } from "./lib/api.js";
import { BLOCK_BASED_ON_SNI, DRY_RUN } from "./lib/constants.js";
import { notifyWebhook } from "./lib/utils.js";

if (DRY_RUN) {
  console.log("DRY_RUN: skipping Cloudflare changes.");
  process.exit(0);
}

const { result: lists } = await getZeroTrustLists();

// Upsert DNS rules for all lists
await upsertZeroTrustDNSRule(lists, "CGPS Filter Lists");

// Optionally create a rule that matches the SNI.
// This only works for users who proxy their traffic through Cloudflare.
if (BLOCK_BASED_ON_SNI) {
  await upsertZeroTrustSNIRule(lists, "CGPS Filter Lists - SNI Based Filtering");
}

// Send a notification to the webhook
await notifyWebhook("CF Gateway Rule Create script finished running");
