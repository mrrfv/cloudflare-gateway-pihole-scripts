import { deleteZeroTrustRule, getZeroTrustRules } from "./lib/api.js";
import { notifyWebhook } from "./lib/helpers.js";

const { result: rules } = await getZeroTrustRules();
const cgpsRule = rules.find(({ name }) => name === "CGPS Filter Lists");

(async () => {
  if (!cgpsRule) {
    console.warn(
      "No rule with matching name found - this is not an issue if you haven't run the create script yet. Exiting."
    );
    return;
  }

  console.log(`Deleting rule ${cgpsRule.name}...`);
  await deleteZeroTrustRule(cgpsRule.id);
})();
// Send a notification to the webhook
await notifyWebhook("CF Gateway Rule Delete script finished running");
