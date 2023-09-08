import {
  ACCOUNT_EMAIL,
  ACCOUNT_ID,
  API_HOST,
  API_TOKEN,
  FAST_MODE,
  LIST_ITEM_SIZE,
} from "./constants.js";
import { sleep } from "./utils.js";

const request = async (url, options) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
      "X-Auth-Email": ACCOUNT_EMAIL,
      "X-Auth-Key": API_TOKEN,
    },
    ...options,
  });

  return response.json();
};

const createZeroTrustList = (name, items) => {
  // https://developers.cloudflare.com/api/operations/zero-trust-lists-create-zero-trust-list

  return request(`${API_HOST}/accounts/${ACCOUNT_ID}/gateway/lists`, {
    method: "POST",
    body: JSON.stringify({
      name,
      type: "DOMAIN",
      items,
    }),
  });
};

const createZeroTrustListsOneByOne = async (items) => {
  let totalListNumber = Math.ceil(items.length / LIST_ITEM_SIZE);

  for (let i = 0, listNumber = 1; i < items.length; i += LIST_ITEM_SIZE) {
    const chunk = items
      .slice(i, i + LIST_ITEM_SIZE)
      .map((item) => ({ value: item }));
    const listName = `CGPS List - Chunk ${listNumber}`;

    try {
      const {
        result: { id },
      } = await createZeroTrustList(listName, chunk);

      totalListNumber--;
      listNumber++;
      console.log(
        `Created ${listName} with ID ${id} - ${totalListNumber} left`
      );
      await sleep();
    } catch (err) {
      console.error(`Could not create ${listName} - ${err.toString()}`);
    }
  }
};

const createZeroTrustListsAtOnce = async (items) => {
  let totalListNumber = Math.ceil(items.length / LIST_ITEM_SIZE);
  const requests = [];

  for (let i = 0, listNumber = 1; i < items.length; i += LIST_ITEM_SIZE) {
    const chunk = items
      .slice(i, i + LIST_ITEM_SIZE)
      .map((item) => ({ value: item }));
    const listName = `CGPS List - Chunk ${listNumber}`;

    requests.push(createZeroTrustList(listName, chunk));
    listNumber++;
  }

  await Promise.all(requests);
  console.log(`Created ${totalListNumber} lists`);
};

export const createZeroTrustLists = (items) => {
  if (FAST_MODE) {
    return createZeroTrustListsAtOnce(items);
  }

  return createZeroTrustListsOneByOne(items);
};
