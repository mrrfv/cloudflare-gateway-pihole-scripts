#!/bin/bash

# create an empty input.csv file
touch input.csv

# declare an array of urls
urls=(
   https://raw.githubusercontent.com/AdguardTeam/AdGuardSDNSFilter/master/Filters/exclusions.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/whitelist.txt
   https://raw.githubusercontent.com/nextdns/click-tracking-domains/main/domains
   # Commented out because it looks suspicious
   https://raw.githubusercontent.com/AdguardTeam/HttpsExclusions/master/exclusions/issues.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/whitelist-referral.txt
   # https://raw.githubusercontent.com/anudeepND/whitelist/master/domains/referral-sites.txt
)

# loop through the urls and download each file with curl
for url in "${urls[@]}"; do
  # get the file name from the url
  file=$(basename "$url")
  # download the file with curl and save it as file.txt
  curl -o "$file.txt" "$url"
  # append the file contents to input.csv and add a newline
  cat "$file.txt" >> input.csv
  echo "" >> input.csv
  # remove the file.txt
  rm "$file.txt"
done

# print a message when done
echo "Done. The input.csv file contains merged data from recommended filter lists."
