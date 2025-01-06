import {
  deleteZeroTrustListsOneByOne,
  getZeroTrustLists,
} from "./lib/api.js";
import { notifyWebhook } from "./lib/utils.js";

(async () => {
  const { result: lists } = await getZeroTrustLists();

  if (!lists) {
    console.warn(
      "No file lists found - this is not an issue if it's your first time running this script. Exiting."
    );
    return;
  }

  const cgpsLists = lists.filter(({ name }) => name.startsWith("CGPS List"));

  if (!cgpsLists.length) {
    console.warn(
      "No lists with matching name found - this is not an issue if you haven't created any filter lists before. Exiting."
    );
    return;
  }

  console.log(
    `Got ${lists.length} lists, ${cgpsLists.length} of which are CGPS lists that will be deleted.`
  );

  console.log(`Deleting ${cgpsLists.length} lists...`);

  await deleteZeroTrustListsOneByOne(cgpsLists);
  await notifyWebhook(`CF List Delete script finished running (${cgpsLists.length} lists)`);
})();
