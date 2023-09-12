import { createZeroTrustRule, getZeroTrustLists } from "./lib/api.js";

const { result: lists } = await getZeroTrustLists();
const wirefilterExpression = lists.reduce((previous, current, index) => {
  if (!current.name.startsWith("CGPS List")) return previous;

  // Remove the trailing ' or '
  if (index === lists.length - 1) return previous.slice(0, -4);

  return `${previous} any(dns.domains[*] in \$${current.id}) or `;
}, "");

await createZeroTrustRule(wirefilterExpression);
