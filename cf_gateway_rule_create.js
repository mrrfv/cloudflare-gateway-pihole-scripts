import { createZeroTrustRule, getZeroTrustLists } from "./lib/api.js";

const { result: lists } = await getZeroTrustLists();
const wirefilterExpression = lists.reduce((previous, current) => {
  if (!current.name.startsWith("CGPS List")) return previous;

  return `${previous} any(dns.domains[*] in \$${current.id}) or `;
}, "");

console.log("Creating rule...");
// Remove the trailing ' or '
await createZeroTrustRule(wirefilterExpression.slice(0, -4));
