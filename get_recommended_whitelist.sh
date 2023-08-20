#!/bin/bash
#  
# Use the provided lists or add you own
# https://oisd.nl/includedlists/whitelists
# by creating an empty whitelist.csv file
touch whitelist.csv

# declare an array of urls
urls=(
    https://raw.githubusercontent.com/im-sm/Pi-hole-Torrent-Blocklist/main/all-torrent-trackres.txt
    https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/banks.txt
    https://raw.githubusercontent.com/hagezi/dns-blocklists/main/whitelist.txt
    https://raw.githubusercontent.com/TogoFire-Home/AD-Settings/main/Filters/whitelist.txt
    https://raw.githubusercontent.com/freekers/whitelist/master/domains/whitelist.txt
    https://raw.githubusercontent.com/DandelionSprout/AdGuard-Home-Whitelist/master/whitelist.txt
    # Commented out because it looks suspicious
    # https://www.aadvantageeshopping.com/adBlockWhitelist.php
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
    https://raw.githubusercontent.com/nextdns/click-tracking-domains/main/domains

    
    # Commented out because it whitelists sites including doubleclick.net and ad.atdmt.com
    # https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/referral-sites.txt

)

# loop through the urls and download each file with curl
for url in "${urls[@]}"; do
  # get the file name from the url
  file=$(basename "$url")
  # download the file with curl and save it as file.txt
  curl -o "$file.txt" "$url"
  # append the file contents to whitelist.csv and add a newline
  cat "$file.txt" >> whitelist.csv
  echo "" >> whitelist.csv
  # remove the file.txt
  rm "$file.txt"
done

# print a message when done
echo "Done. The whitelist.csv file contains merged data from recommended whitelists."
