#!/bin/bash
#  
# Use the provided lists or add your own.
# There is no limit on the amount of whitelisted domains you can have.

source $(dirname "$0")/lib/helpers.sh

# declare an array of urls
urls=(
    https://raw.githubusercontent.com/im-sm/Pi-hole-Torrent-Blocklist/main/all-torrent-trackres.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/banks.txt
    https://raw.githubusercontent.com/hagezi/dns-blocklists/main/whitelist.txt
    https://raw.githubusercontent.com/TogoFire-Home/AD-Settings/main/Filters/whitelist.txt
    https://raw.githubusercontent.com/freekers/whitelist/master/domains/whitelist.txt
    https://raw.githubusercontent.com/DandelionSprout/AdGuard-Home-Whitelist/master/whitelist.txt
    https://raw.githubusercontent.com/AdguardTeam/AdGuardSDNSFilter/master/Filters/exclusions.txt
    https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/optional-list.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/issues.txt
    https://raw.githubusercontent.com/hagezi/dns-blocklists/main/whitelist-referral.txt
    https://raw.githubusercontent.com/mawenjian/china-cdn-domain-whitelist/master/china-cdn-domain-whitelist.txt
    https://raw.githubusercontent.com/notracking/hosts-blocklists-scripts/master/hostnames.whitelist.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/mac.txt
    https://raw.githubusercontent.com/boutetnico/url-shorteners/master/list.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/windows.txt
    https://raw.githubusercontent.com/Dogino/Discord-Phishing-URLs/main/official-domains.txt
    https://raw.githubusercontent.com/ookangzheng/blahdns/master/hosts/whitelist.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/android.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/sensitive.txt
    https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/whitelist.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/firefox.txt
    # Commented out because it whitelists sites including doubleclick.net and ad.atdmt.com
    # https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/referral-sites.txt
    # Uncomment the line below to use OISD's most commmonly whitelisted list
    # https://local.oisd.nl/extract/commonly_whitelisted.php

)

# download all files in parallel and append them to whitelist.csv
download_lists $urls 'whitelist.csv'

# print a message when done
echo "Done. The whitelist.csv file contains merged data from recommended whitelists."
