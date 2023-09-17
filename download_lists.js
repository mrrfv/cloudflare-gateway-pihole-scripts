import { resolve } from "path";

import { LIST_TYPE, PROCESSING_FILENAME } from "./lib/constants.js";
import { downloadFiles } from "./lib/utils.js";

const allowlistUrls = [
  "https://raw.githubusercontent.com/im-sm/Pi-hole-Torrent-Blocklist/main/all-torrent-trackres.txt",
  "https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/banks.txt",
  "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/whitelist.txt",
  "https://raw.githubusercontent.com/TogoFire-Home/AD-Settings/main/Filters/whitelist.txt",
  "https://raw.githubusercontent.com/freekers/whitelist/master/domains/whitelist.txt",
  "https://raw.githubusercontent.com/DandelionSprout/AdGuard-Home-Whitelist/master/whitelist.txt",
  "https://raw.githubusercontent.com/AdguardTeam/AdGuardSDNSFilter/master/Filters/exclusions.txt",
  "https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/optional-list.txt",
  "https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/issues.txt",
  "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/whitelist-referral.txt",
  "https://raw.githubusercontent.com/mawenjian/china-cdn-domain-whitelist/master/china-cdn-domain-whitelist.txt",
  "https://raw.githubusercontent.com/notracking/hosts-blocklists-scripts/master/hostnames.whitelist.txt",
  "https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/mac.txt",
  "https://raw.githubusercontent.com/boutetnico/url-shorteners/master/list.txt",
  "https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/windows.txt",
  "https://raw.githubusercontent.com/Dogino/Discord-Phishing-URLs/main/official-domains.txt",
  "https://raw.githubusercontent.com/ookangzheng/blahdns/master/hosts/whitelist.txt",
  "https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/android.txt",
  "https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/sensitive.txt",
  "https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/whitelist.txt",
  "https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/firefox.txt",
  // Commented out because it whitelists sites including doubleclick.net and ad.atdmt.com
  // https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/referral-sites.txt,
  // Uncomment the line below to use OISD's most commmonly whitelisted list
  // https://local.oisd.nl/extract/commonly_whitelisted.php,
];
const blocklistUrls = [
  "https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_adblock.txt",
  "https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_gambling.txt",
  "https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_privacy.txt",
  "https://raw.githubusercontent.com/FadeMind/hosts.extras/master/add.Risk/hosts",
  "https://adaway.org/hosts.txt",
  "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
];
const listType = process.argv[2];

const downloadAllowlists = async () => {
  await downloadFiles(
    resolve(`./${PROCESSING_FILENAME.ALLOWLIST}`),
    allowlistUrls
  );
  console.log(
    `Done. The ${PROCESSING_FILENAME.ALLOWLIST} file contains merged data from recommended allowlists.`
  );
};

const downloadBlocklists = async () => {
  await downloadFiles(
    resolve(`./${PROCESSING_FILENAME.BLOCKLIST}`),
    blocklistUrls
  );
  console.log(
    `Done. The ${PROCESSING_FILENAME.BLOCKLIST} file contains merged data from recommended blocklists.`
  );
};

switch (listType) {
  case LIST_TYPE.ALLOWLIST: {
    await downloadAllowlists();
    break;
  }
  case LIST_TYPE.BLOCKLIST: {
    await downloadBlocklists();
    break;
  }
  default:
    await Promise.all([downloadAllowlists(), downloadBlocklists()]);
}
