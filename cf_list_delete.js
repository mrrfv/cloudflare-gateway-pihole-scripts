import { deleteZeroTrustListsAtOnce, deleteZeroTrustListsOneByOne, getZeroTrustLists } from "./lib/api.js";
import { FAST_MODE } from "./lib/constants.js";

;(async() => {
    const { result: lists } = await getZeroTrustLists();
    if (!lists) return console.warn("No file lists found - this is not an issue if it's your first time running this script. Exiting.");
    const cgps_lists = lists.filter(list => list.name.startsWith('CGPS List'));
    if (!cgps_lists.length) return console.warn("No lists with matching name found - this is not an issue if you haven't created any filter lists before. Exiting.");

    if (!process.env.CI) console.log(`Got ${lists.length} lists, ${cgps_lists.length} of which are CGPS lists that will be deleted.`);

    if (FAST_MODE) {
      await deleteZeroTrustListsAtOnce(cgps_lists);
      return;
    }

    await deleteZeroTrustListsOneByOne(cgps_lists);
})();
