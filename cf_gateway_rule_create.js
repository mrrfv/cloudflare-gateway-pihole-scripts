import { createZeroTrustRule, getZeroTrustLists } from './lib/api.js';

;(async() => {
    const { result: lists } = await getZeroTrustLists();
    const filtered_lists = lists.filter(list => list.name.startsWith('CGPS List'));

    let wirefilter_expression = '';

    // Build the wirefilter expression
    for (const list of filtered_lists) {
        wirefilter_expression += `any(dns.domains[*] in \$${list.id}) or `;
    }
    // Remove the trailing ' or '
    if (wirefilter_expression.endsWith(' or ')) {
        wirefilter_expression = wirefilter_expression.slice(0, -4);
    }
    wirefilter_expression = wirefilter_expression.trim().replace('\n', '');
    if (!process.env.CI) console.log(`Firewall expression contains ${wirefilter_expression.length} characters, and checks against ${filtered_lists.length} filter lists.`)

    await createZeroTrustRule(wirefilter_expression);
})();
