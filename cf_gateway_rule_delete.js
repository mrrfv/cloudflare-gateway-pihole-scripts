import { deleteZeroTrustRule, getZeroTrustRules } from './lib/api.js';

;(async() => {
    const { result: rules } = await getZeroTrustRules();
    const [filtered_rule] = rules.filter(rule => rule.name === "CGPS Filter Lists");

    if (!filtered_rule) return console.warn("No rule with matching name found - this is not an issue if you haven't run the create script yet. Exiting.");

    console.log(`Deleting rule`, process.env.CI ? "(redacted, running in CI)" : `"${filtered_rule.name}" with ID ${filtered_rule.id}`);

    await deleteZeroTrustRule(filtered_rule.id);
})();
