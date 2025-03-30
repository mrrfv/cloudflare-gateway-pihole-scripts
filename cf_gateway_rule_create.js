import { getZeroTrustLists, upsertZeroTrustDNSRule, upsertZeroTrustSNIRule } from "./lib/api.js";
import { BLOCK_BASED_ON_SNI } from "./lib/constants.js";
import { notifyWebhook } from "./lib/utils.js";

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
