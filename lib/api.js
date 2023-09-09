import { LIST_ITEM_SIZE } from "./constants.js";
import { requestGateway } from "./helpers.js";

/**
 * Creates a Zero Trust list.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-create-zero-trust-list
 * @param {string} name The name of the list.
 * @param {Object[]} items The domains in the list.
 * @param {string} items[].value The domain of an entry.
 * @returns {Promise}
 */
const createZeroTrustList = (name, items) =>
  requestGateway(`/lists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      type: "DOMAIN",
      items,
    }),
  });

/**
 * Creates Zero Trust lists sequentially.
 * @param {string[]} items The domains.
 */
export const createZeroTrustListsOneByOne = async (items) => {
  let totalListNumber = Math.ceil(items.length / LIST_ITEM_SIZE);

  for (let i = 0, listNumber = 1; i < items.length; i += LIST_ITEM_SIZE) {
    const chunk = items
      .slice(i, i + LIST_ITEM_SIZE)
      .map((item) => ({ value: item }));
    const listName = `CGPS List - Chunk ${listNumber}`;

    try {
      await createZeroTrustList(listName, chunk);
      await sleep();
      totalListNumber--;
      listNumber++;
      console.log(`Created ${listName} list - ${totalListNumber} left`);
    } catch (err) {
      console.error(`Could not create ${listName} - ${err.toString()}`);
    }
  }
};

/**
 * Creates all Zero Trust lists at once.
 * @param {string[]} items The domains.
 */
export const createZeroTrustListsAtOnce = async (items) => {
  const totalListNumber = Math.ceil(items.length / LIST_ITEM_SIZE);
  const requests = [];

  for (let i = 0, listNumber = 1; i < items.length; i += LIST_ITEM_SIZE) {
    const chunk = items
      .slice(i, i + LIST_ITEM_SIZE)
      .map((item) => ({ value: item }));
    const listName = `CGPS List - Chunk ${listNumber}`;

    requests.push(createZeroTrustList(listName, chunk));
    listNumber++;
  }

  try {
    await Promise.all(requests);
    console.log(`Created ${totalListNumber} lists`);
  } catch (err) {
    console.error(`Error occurred while creating lists - ${err.toString()}`);
  }
};
