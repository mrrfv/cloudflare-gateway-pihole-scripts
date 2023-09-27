#!/bin/bash

# create an empty input.csv file
touch input.csv

# declare an array of urls
urls=(
   https://raw.githubusercontent.com/bigdargon/hostsVN/master/option/domain.txt
   https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/popupads-onlydomains.txt
   https://raw.githubusercontent.com/funxiun/oisd/main/small_oisd.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/multi-onlydomains.txt
   https://raw.githubusercontent.com/nextdns/dns-bypass-methods/main/encrypted-dns
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.apple.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.tiktok.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.tiktok.extended.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.winoffice.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.amazon.txt
   https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.huawei.txt
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/samsung
   https://raw.githubusercontent.com/nextdns/click-tracking-domains/main/domains
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/huawei
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/roku
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/sonos
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/windows
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/xiaomi
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/apple
   https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/alexa
   https://raw.githubusercontent.com/adv247/IOS/master/ZALO_Block_All.txt
  
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
