#!/bin/bash

source $(dirname "$0")/lib/helpers.sh

# declare an array of urls
urls=(
  https://abpvn.com/android/abpvn.txt
  https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/light-onlydomains.txt
  https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_gambling.txt
  https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_privacy.txt
  https://raw.githubusercontent.com/Yhonay/antipopads/master/hosts
  https://malware-filter.gitlab.io/malware-filter/vn-badsite-filter-hosts.txt
)

# download all files in parallel and append them to input.csv
download_lists $urls 'input.csv'

# print a message when done
echo "Done. The input.csv file contains merged data from recommended filter lists."
