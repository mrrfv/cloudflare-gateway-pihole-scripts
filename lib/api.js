import { BLOCK_PAGE_ENABLED, LIST_ITEM_SIZE } from "./constants.js";
import { requestGateway } from "./helpers.js";

/**
 * Gets Zero Trust lists.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-list-zero-trust-lists
 * @returns {Promise<Object>}
 */
export const getZeroTrustLists = () =>
  requestGateway("/lists", {
    method: "GET",
  });

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
      totalListNumber--;
      listNumber++;
      console.log(`Created "${listName}" list - ${totalListNumber} left`);
    } catch (err) {
      console.error(`Could not create "${listName}" - ${err.toString()}`);
      throw err;
    }
  }
};

/**
 * Creates all Zero Trust lists at once.
 * @param {string[]} items The domains.
 */
export const createZeroTrustListsAtOnce = async (items) => {
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
    console.log("Created lists successfully");
  } catch (err) {
    console.error(`Error occurred while creating lists - ${err.toString()}`);
    throw err;
  }
};

/**
 * Deletes a Zero Trust list.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-delete-zero-trust-list
 * @param {number} id The ID of the list.
 * @returns {Promise<any>}
 */
const deleteZeroTrustList = (id) =>
  requestGateway(`/lists/${id}`, { method: "DELETE" });

/**
 * Deletes Zero Trust lists sequentially.
 * @param {Object[]} lists The lists to be deleted.
 * @param {number} lists[].id The ID of a list.
 * @param {string} lists[].name The name of a list.
 */
export const deleteZeroTrustListsOneByOne = async (lists) => {
  let totalListNumber = lists.length;

  for (const { id, name } of lists) {
    try {
      await deleteZeroTrustList(id);
      totalListNumber--;
      console.log(`Deleted ${name} list - ${totalListNumber} left`);
    } catch (err) {
      console.error(`Could not delete ${name} - ${err.toString()}`);
      throw err;
    }
  }
};

/**
 * Deletes all Zero Trust lists at once.
 * @param {Object[]} lists The lists to be deleted.
 * @param {number} lists[].id The ID of a list.
 * @param {string} lists[].name The name of a list.
 */
export const deleteZeroTrustListsAtOnce = async (lists) => {
  const requests = lists.map(({ id }) => deleteZeroTrustList(id));

  try {
    await Promise.all(requests);
    console.log("Deleted lists successfully");
  } catch (err) {
    console.error(`Error occurred while deleting lists - ${err.toString()}`);
    throw err;
  }
};

/**
 * Gets Zero Trust rules.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-list-zero-trust-gateway-rules
 * @returns {Promise<Object>}
 */
export const getZeroTrustRules = () =>
  requestGateway("/rules", { method: "GET" });

/**
 * Creates a Zero Trust rule.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-create-zero-trust-gateway-rule
 * @param {string} wirefilterExpression The expression to be used for the rule.
 * @param {string} name The name of the rule.
 * @param {string[]} filters The filters to be used for the rule. Default is ["dns"]. Possible values are ["dns", "http", "l4", "egress"].
 * @returns {Promise<Object>}
 */
export const createZeroTrustRule = async (wirefilterExpression, name = "CGPS Filter Lists", filters = ["dns"]) => {
  try {
    await requestGateway("/rules", {
      method: "POST",
      body: JSON.stringify({
        name,
        description:
          "Filter lists created by Cloudflare Gateway Pi-hole Scripts. Avoid editing this rule. Changing the name of this rule will break the script.",
        enabled: true,
        action: "block",
        rule_settings: { "block_page_enabled": BLOCK_PAGE_ENABLED, "block_reason": "Blocked by CGPS, check your filter lists if this was a mistake." },
        filters,
        traffic: wirefilterExpression,
      }),
    });

    console.log("Created rule successfully");
  } catch (err) {
    console.error(`Error occurred while creating rule - ${err.toString()}`);
    throw err;
  }
};

/**
 * Deletes a Zero Trust rule.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-delete-zero-trust-gateway-rule
 * @param {number} id The ID of the rule to be deleted.
 * @returns {Promise<Object>}
 */
export const deleteZeroTrustRule = async (id) => {
  try {
    await requestGateway(`/rules/${id}`, {
      method: "DELETE",
    });

    console.log("Deleted rule successfully");
  } catch (err) {
    console.error(`Error occurred while deleting rule - ${err.toString()}`);
    throw err;
  }
};
