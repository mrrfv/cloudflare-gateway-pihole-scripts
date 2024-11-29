import { deleteZeroTrustRule, getZeroTrustRules } from "./lib/api.js";
import { notifyWebhook } from "./lib/utils.js";

const { result: rules } = await getZeroTrustRules();
const cgpsRules = rules.filter(({ name }) => name.startsWith("CGPS Filter Lists"));

(async () => {
  if (!cgpsRules.length) {
    console.warn(
      "No rule(s) with matching name found - this is not an issue if you haven't run the create script yet. Exiting."
    );
    return;
  }

  for (const cgpsRule of cgpsRules) {
    console.log(`Deleting rule ${cgpsRule.name}...`);
    await deleteZeroTrustRule(cgpsRule.id);
  }
})();

// Send a notification to the webhook
await notifyWebhook("CF Gateway Rule Delete script finished running");
