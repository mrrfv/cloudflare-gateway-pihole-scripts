import { getZeroTrustLists, upsertZeroTrustRule } from "./lib/api.js";
import { BLOCK_BASED_ON_SNI } from "./lib/constants.js";
import { notifyWebhook } from "./lib/utils.js";

const { result: lists } = await getZeroTrustLists();

// Create a Wirefilter expression to match DNS queries against all the lists
const wirefilterDNSExpression = lists.reduce((previous, current) => {
  if (!current.name.startsWith("CGPS List")) return previous;

  return `${previous} any(dns.domains[*] in \$${current.id}) or `;
}, "");

console.log("Creating DNS rule...");
// .slice removes the trailing ' or '
await upsertZeroTrustRule(wirefilterDNSExpression.slice(0, -4), "CGPS Filter Lists", ["dns"]);

// Optionally create a rule that matches the SNI.
// This only works for users who proxy their traffic through Cloudflare.
if (BLOCK_BASED_ON_SNI) {
  const wirefilterSNIExpression = lists.reduce((previous, current) => {
    if (!current.name.startsWith("CGPS List")) return previous;

    return `${previous} any(net.sni.domains[*] in \$${current.id}) or `;
  }, "");

  console.log("Creating SNI rule...");
  // .slice removes the trailing ' or '
  await upsertZeroTrustRule(wirefilterSNIExpression.slice(0, -4), "CGPS Filter Lists - SNI Based Filtering", ["l4"]);
}

// Send a notification to the webhook
await notifyWebhook("CF Gateway Rule Create script finished running");
