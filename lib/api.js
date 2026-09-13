import { BLOCK_PAGE_ENABLED, DEBUG, LIST_ITEM_SIZE } from "./constants.js";
import { requestGateway } from "./helpers.js";

const NOW_STR = new Date().toISOString();

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
 * Gets Zero Trust list items
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-zero-trust-list-items
 * @param {string} id The id of the list.
 * @returns {Promise<Object>}
 */
const getZeroTrustListItems = (id) =>
  requestGateway(`/lists/${id}/items?per_page=${LIST_ITEM_SIZE}`, {
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
 * Patches an existing list. Remove/append entries to the list.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-lists-patch-zero-trust-list
 * @param {string} listId The ID of the list to patch
 * @param {Object} patch The changes to make
 * @param {string[]} patch.remove A list of the item values you want to remove.
 * @param {Object[]} patch.append Items to add to the list.
 * @param {string} patch.append[].value The domain of an entry.
 * @returns
 */
const patchExistingList = (listId, patch) =>
  requestGateway(`/lists/${listId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

/**
 * Synchronize Zero Trust lists.
 * Inspects existing lists starting with "CGPS List"
 * Compares the entries in the lists with the desired domains in the items.
 * Removes any entries in the lists that are not in the items.
 * Adds any entries that are in the items and not in the lists.
 * Uses available capacity in existing lists prior to creating a new list.
 * @param {string[]} items The domains.
 */
export const synchronizeZeroTrustLists = async (items) => {
  const itemSet = new Set(items);

  console.log("Checking existing lists...");
  const { result: lists } = await getZeroTrustLists();
  const cgpsLists = lists?.filter(({ name }) => name.startsWith("CGPS List")) || [];
  console.log(`Found ${cgpsLists.length} existing lists. Calculating diffs...`);

  const domainsByList = {};
  // Do this sequentially to avoid rate-limits
  for (const list of cgpsLists) {
    const { result: listItems, result_info } = await getZeroTrustListItems(list.id);
    if (result_info.total_count > LIST_ITEM_SIZE) {
      console.log(`List ${list.name} contains more entries that LIST_ITEM_SIZE. Checking only the first ${LIST_ITEM_SIZE} entires. You may want to delete this list and recreate using the same size limit.`);
    }
    domainsByList[list.id] = listItems?.map(item => item.value) || [];
  }

  // Extract all the list entries into a map, keyed by domain, pointing to the list.
  const existingDomains = Object.fromEntries(
    Object.entries(domainsByList).flatMap(([id, domains]) => domains.map(d => [d, id]))
  );

  // Create a list of entries to remove.
  // Iterate the existing list(s) removing anything that's in the new list.
  // Resulting in entries that are in the existing list(s) and not in the new list.
  const toRemove = Object.fromEntries(
    Object.entries(existingDomains).filter(([domain]) => !itemSet.has(domain))
  );

  // Create a list of entries to add.
  // Iterate the new list keeping only entries not in the existing list(s).
  // Resulting in entries that need to be added.
  const toAdd = items.filter(domain => !existingDomains[domain]);

  console.log(`${Object.keys(toRemove).length} removals, ${toAdd.length} additions to make`);

  // Group the removals by list id, so we can make a patch request.
  const removalPatches = Object.entries(toRemove).reduce((acc, [domain, listId]) => {
    acc[listId] = acc[listId] || { remove: [] };
    acc[listId].remove.push(domain);
    return acc;
  }, {});

  // Fill any "gaps" in the lists made by the removals with any additions.
  // If we can fit all the additions into the same lists that we're processing removals
  // we can minimize the number of lists that need to be edited.
  const patches = Object.fromEntries(
    Object.entries(removalPatches).map(([listId, patch]) => {
      // Work out how much "space" is in the list by looking at
      // how many entries there were and how many we're removing.
      const spaceInList = LIST_ITEM_SIZE - (domainsByList[listId].length - patch.remove.length);
      // Take upto spaceInList entries from the additions into this list.
      // Use the current timestamp as the description to track when we first see this domain.
      // This can be used to defragment the lists later and consolidate more stable entries.
      const append = Array(spaceInList)
        .fill(0)
        .map(() => toAdd.shift())
        .filter(Boolean)
        .map(domain => ({ value: domain, description: NOW_STR }));
      return [listId, { ...patch, append }];
    })
  );

  // Are there any more appends remaining?
  if (toAdd.length) {
    // Is there any space in any existing lists, other than those we're already patching?
    const unpatchedListIds = Object.keys(domainsByList).filter(listId => !patches[listId]);
    unpatchedListIds.forEach(listId => {
      const spaceInList = LIST_ITEM_SIZE - domainsByList[listId].length;
      if (spaceInList > 0) {
        // Take upto spaceInList entries from the additions into this list.
        const append = Array(spaceInList)
          .fill(0)
          .map(() => toAdd.shift())
          .filter(Boolean)
          .map(domain => ({ value: domain, description: NOW_STR }));

        // Add this list edit to the patches
        if (append.length) {
          patches[listId] = { append };
        }
      }
    });
  }

  // Process all the patches. Sequentially to avoid rate limits.
  for(const [listId, patch] of Object.entries(patches)) {
    const appends = !!patch.append ? patch.append.length : 0;
    const removals = !!patch.remove ? patch.remove.length : 0;
    console.log(`Updating list "${cgpsLists.find(list => list.id === listId).name}"${appends ? `, ${appends} additions` : ''}${removals ? `, ${removals} removals` : ''}`);
    await patchExistingList(listId, patch);
  }

  // Are there any more appends remaining?
  if (toAdd.length) {
    // We'll need to create new list(s)
    const nextListNumber = Math.max(0, ...cgpsLists.map(list => parseInt(list.name.replace('CGPS List - Chunk ', ''))).filter(x => Number.isInteger(x))) + 1;
    await createZeroTrustListsOneByOne(toAdd, nextListNumber);
  }
};

/**
 * Defragment Zero Trust lists.
 * Inspects existing lists starting with "CGPS List - Chunk <number>"
 * Compacts them by pulling entries out of the back of the highest-numbered
 * lists to fill any spare capacity in the lowest-numbered lists.
 * This only touches lists that actually have spare capacity, or are being
 * drained to fill one - a list that's already full is left completely alone.
 * That keeps a single early removal from cascading into edits on every list
 * that follows it: we don't require entries to sit in any particular global
 * order, so filling a gap never requires reshuffling everything after it.
 * @returns {Promise<Object>} A object that include the now empty and non-empty lists
 */
export const defragmentZeroTrustLists = async () => {
  console.log("Checking existing lists...");
  const { result: lists } = await getZeroTrustLists();
  const cgpsLists = lists?.filter(({ name }) => name.startsWith("CGPS List - Chunk ")) || [];
  console.log(`Found ${cgpsLists.length} existing lists. Downloading...`);

  // Sort the lists by the natural number order in the name
  cgpsLists.sort((a, b) => {
    const aNum = parseInt(a.name.replace("CGPS List - Chunk ", ""));
    const bNum = parseInt(b.name.replace("CGPS List - Chunk ", ""));
    return aNum - bNum;
  });

  // Fetch all the items in the lists, keeping them grouped by the list they
  // came from rather than merging into one big sorted sequence.
  const entriesByList = new Map();
  let allEntriesCount = 0;
  for (const list of cgpsLists) {
    const { result: listItems } = await getZeroTrustListItems(list.id);
    // Ensure the description is a valid timestamp, or set it to the current time.
    // We use the description as the list addition time because the API does not allow setting the created_at time.
    const items = listItems?.map(item => ({
      value: item.value,
      description: isNaN(new Date(item.description)) ? NOW_STR : item.description,
    })) || [];
    entriesByList.set(list.id, items);
    allEntriesCount += items.length;
  }

  console.log(`Found ${allEntriesCount} entries in ${cgpsLists.length} lists`);

  // Compact in place: walk from the front looking for lists with spare
  // capacity ("deficits"), and fill each one using entries pulled off the
  // back of the highest-numbered lists that still have entries. A list keeps
  // its number and its existing entries untouched unless it's the one being
  // topped up or the one being drained.
  const patches = {};
  const getPatch = (listId) => {
    if (!patches[listId]) patches[listId] = { append: [], remove: [] };
    return patches[listId];
  };

  let entriesMoved = 0;
  let lowIndex = 0;
  let highIndex = cgpsLists.length - 1;

  while (lowIndex < highIndex) {
    const lowList = cgpsLists[lowIndex];
    const lowEntries = entriesByList.get(lowList.id);
    const deficit = LIST_ITEM_SIZE - lowEntries.length;

    if (deficit <= 0) {
      lowIndex++;
      continue;
    }

    const highList = cgpsLists[highIndex];
    const highEntries = entriesByList.get(highList.id);

    if (highEntries.length === 0) {
      highIndex--;
      continue;
    }

    const moveCount = Math.min(deficit, highEntries.length);
    const moved = highEntries.splice(highEntries.length - moveCount, moveCount);
    lowEntries.push(...moved);
    entriesMoved += moveCount;

    for (const entry of moved) {
      getPatch(lowList.id).append.push(entry);
      getPatch(highList.id).remove.push(entry.value);
    }
  }

  console.log(`Found ${Object.keys(patches).length} patches to make, moving ${entriesMoved} entries...`);

  // Apply every addition before any removal. A list is only ever a source or
  // a destination within a single compaction pass, never both, so doing all
  // the appends first guarantees each moved entry is safely living in its new
  // list before it's taken out of its old one - a domain blocked by two lists
  // for a moment is harmless, but a domain blocked by neither is not.
  for (const list of cgpsLists) {
    const appends = patches[list.id]?.append;
    if (!appends?.length) continue;
    console.log(`Updating list "${list.name}", ${appends.length} additions`);
    await patchExistingList(list.id, { append: appends });
  }
  for (const list of cgpsLists) {
    const removals = patches[list.id]?.remove;
    if (!removals?.length) continue;
    console.log(`Updating list "${list.name}", ${removals.length} removals`);
    await patchExistingList(list.id, { remove: removals });
  }

  // Any lists left with no entries are now empty and can be deleted
  const emptyLists = cgpsLists.filter(list => entriesByList.get(list.id).length === 0);
  // Gather the non-empty lists, using the original list not just the chunked ones
  // This is important to capture any manually created lists starting with "CGPS List"
  // and not just the ones created by this script
  const nonEmptyLists = lists.filter(list => !emptyLists.some(emptyList => emptyList.id === list.id));

  return {
    emptyLists,
    nonEmptyLists,
    stats: {
      assignedLists: cgpsLists.length - emptyLists.length,
      emptyLists: emptyLists.length,
      nonEmptyLists: nonEmptyLists.length,
      entriesToMove: entriesMoved,
      patches: Object.keys(patches).length,
      allEntries: allEntriesCount,
      chunks: cgpsLists.length,
    }
  };
}

/**
 * Creates Zero Trust lists sequentially.
 * @param {string[]} items The domains.
 * @param {Number} [startingListNumber] The chunk number to start from when naming lists.
 */
export const createZeroTrustListsOneByOne = async (items, startingListNumber = 1) => {
  let totalListNumber = Math.ceil(items.length / LIST_ITEM_SIZE);

  for (let i = 0, listNumber = startingListNumber; i < items.length; i += LIST_ITEM_SIZE) {
    // We use the description as the list addition time because the API does not allow setting the created_at time.
    const chunk = items
      .slice(i, i + LIST_ITEM_SIZE)
      .map((item) => ({ value: item, description: NOW_STR }));
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
 * Gets Zero Trust rules.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-list-zero-trust-gateway-rules
 * @returns {Promise<Object>}
 */
export const getZeroTrustRules = () =>
  requestGateway("/rules", { method: "GET" });

/**
 * Upserts a Zero Trust rule.
 * If a rule with the same name exists, will update it. Otherwise create a new rule.
 * @param {string} wirefilterExpression The expression to be used for the rule.
 * @param {string} name The name of the rule.
 * @param {string[]} filters The filters to be used for the rule. Default is ["dns"]. Possible values are ["dns", "http", "l4", "egress"].
 * @returns {Promise<Object>}
 */
export const upsertZeroTrustRule = async (wirefilterExpression, name = "CGPS Filter Lists", filters = ["dns"]) => {
  const { result: existingRules} = await getZeroTrustRules();
  const existingRule = existingRules.find(rule => rule.name === name);
  if (existingRule) {
    if (DEBUG) console.log(`Found "${existingRule.name}" in rules, updating...`);
    return updateZeroTrustRule(existingRule.id, wirefilterExpression, name, filters);
  }
  if (DEBUG) console.log(`No existing rule named "${existingRule.name}", creating...`);
  return createZeroTrustRule(wirefilterExpression, name, filters);
}

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
 * Updates a Zero Trust rule.
 *
 * API docs: https://developers.cloudflare.com/api/operations/zero-trust-gateway-rules-update-zero-trust-gateway-rule
 * @param {number} id The ID of the rule to be updated.
 * @param {string} wirefilterExpression The expression to be used for the rule.
 * @param {string} name The name of the rule.
 * @param {string[]} filters The filters to be used for the rule.
 * @returns {Promise<Object>}
 */
export const updateZeroTrustRule = async (id, wirefilterExpression, name = "CGPS Filter Lists", filters = ["dns"]) => {
  try {
    await requestGateway(`/rules/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        // Name and action are required fields, even if they haven't changed.
        // And enabled must always be set to true, otherwise the rule will be disabled if omitted.
        name,
        description:
          "Filter lists created by Cloudflare Gateway Pi-hole Scripts. Avoid editing this rule. Changing the name of this rule will break the script.",
        action: "block",
        enabled: true,
        rule_settings: { "block_page_enabled": BLOCK_PAGE_ENABLED, "block_reason": "Blocked by CGPS, check your filter lists if this was a mistake." },
        filters,
        traffic: wirefilterExpression,
      }),
    });

    console.log("Updated existing rule successfully");
  } catch (err) {
    console.error(`Error occurred while updating rule - ${err.toString()}`);
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

/**
 * Creates or Updates Zero Trust DNS rule for a given array of lists.
 * @param {object[]} lists The lists to be used for the rule.
 * @param {string} lists[].id The ID of the list.
 * @param {string} lists[].name The name of the list.
 * @param {string} listName The name of the list.
 */
export const upsertZeroTrustDNSRule = async (lists, listName) => {
  // Create a Wirefilter expression to match DNS queries against all the lists
  const wirefilterDNSExpression = lists
    .filter(({ name }) => name.startsWith("CGPS List"))
    .map(({ id }) => `any(dns.domains[*] in \$${id})`)
    .join(" or ");
  console.log("Checking DNS rule...");
  await upsertZeroTrustRule(wirefilterDNSExpression, listName, ["dns"]);
};

/**
 * Creates or Updates Zero Trust SNI rule for a given array of lists.
 * @param {object[]} lists The lists to be used for the rule.
 * @param {string} lists[].id The ID of the list.
 * @param {string} lists[].name The name of the list.
 * @param {string} listName The name of the list.
 */
export const upsertZeroTrustSNIRule = async (lists, listName) => {
  // Create a Wirefilter expression to match SNI queries against all the lists
  const wirefilterSNIExpression = lists
    .filter(({ name }) => name.startsWith("CGPS List"))
    .map(({ id }) => `any(net.sni.domains[*] in \$${id})`)
    .join(" or ");
  console.log("Creating SNI rule...");
  await upsertZeroTrustRule(wirefilterSNIExpression, listName, ["l4"]);
};
