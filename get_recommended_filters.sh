#!/bin/bash

# create an empty input.csv file
touch input.csv

# declare an array of urls
urls=(
https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_adblock.txt
https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_gambling.txt
https://raw.githubusercontent.com/mullvad/dns-blocklists/main/output/doh/doh_privacy.txt
https://raw.githubusercontent.com/FadeMind/hosts.extras/master/add.Risk/hosts
https://raw.githubusercontent.com/DandelionSprout/adfilt/master/Alternate%20versions%20Anti-Malware%20List/AntiMalwareHosts.txt
https://adaway.org/hosts.txt
https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
https://raw.githubusercontent.com/bigdargon/hostsVN/master/option/domain.txt
https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt
https://abpvn.com/vip/hiepchau96.txt
https://abpvn.com/android/abpvn.txt
https://raw.githubusercontent.com/abpvn/abpvn/master/filter/abpvn.txt
https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/MobileFilter/sections/adservers.txt
https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/ChineseFilter/sections/adservers_firstparty.txt
https://raw.githubusercontent.com/easylist/easylistchina/master/easylistchina.txt
https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_thirdparty.txt
https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/SpywareFilter/sections/tracking_servers.txt
https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/SpywareFilter/sections/tracking_servers_firstparty.txt
https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/SpywareFilter/sections/mobile.txt
https://raw.githubusercontent.com/easylist/easylist/master/easyprivacy/easyprivacy_trackingservers.txt
https://raw.githubusercontent.com/easylist/easylist/master/easyprivacy/easyprivacy_trackingservers_international.txt
https://raw.githubusercontent.com/easylist/easylist/master/easyprivacy/easyprivacy_thirdparty_international.txt
https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_adservers.txt
https://gitlab.com/kowith337/PersonalFilterListCollection/raw/master/hosts/hosts_google_hotword.txt
https://gitlab.com/kowith337/PersonalFilterListCollection/raw/master/hosts/hosts_leftover.txt
https://hostfiles.frogeye.fr/firstparty-only-trackers.txt
https://raw.githubusercontent.com/bogachenko/fuckfuckadblock/master/fuckfuckadblock.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/multi.txt
https://raw.githubusercontent.com/adv247/IOS/master/ZALO_Block_All.txt
https://raw.githubusercontent.com/notracking/hosts-blocklists-scripts/master/hostnames.dead.txt
https://gitlab.com/quidsup/notrack-blocklists/-/raw/master/notrack-blocklist.txt
https://raw.githubusercontent.com/adv247/Block-OTA-ADS/master/tiktok.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.apple.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.tiktok.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.tiktok.extended.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.winoffice.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.amazon.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.huawei.txt
https://cdn.jsdelivr.net/gh/bogachenko/fuckfuckadblock@master/fuckfuckadblock.txt
https://raw.githubusercontent.com/notracking/hosts-blocklists/master/dnscrypt-proxy/dnscrypt-proxy.blacklist.txt
https://raw.githubusercontent.com/jerryn70/GoodbyeAds/master/Hosts/GoodbyeAds.txt
https://raw.githubusercontent.com/ethan-xd/ethan-xd.github.io/master/fb.txt
https://cdn.iblockads.net/iblockads.net.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/gambling.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/native.lgwebos.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/anti.piracy-onlydomains.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/hoster.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/nosafesearch.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/nosafesearch-onlydomains.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/doh.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/doh.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/doh-vpn-proxy-bypass.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/doh-vpn-proxy-bypass-onlydomains.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/tif.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/fake-onlydomains.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/fake.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.txt
https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/multi.txt
https://gitlab.com/hagezi/mirror/-/raw/main/dns-blocklists/wildcard/multi-onlydomains.txt
https://raw.githubusercontent.com/ligyxy/Blocklist/master/BLOCKLIST
https://raw.githubusercontent.com/deathbybandaid/piholeparser/master/Subscribable-Lists/ParsedBlacklists/Mayvs-Private-Adblock-Filters.txt
https://raw.githubusercontent.com/PoorPocketsMcNewHold/steamscamsites/master/steamscamsite.txt
https://raw.githubusercontent.com/mtxadmin/ublock/master/hosts.txt
https://raw.githubusercontent.com/VeleSila/yhosts/master/hosts.txt
https://raw.githubusercontent.com/ZYX2019/host-block-list/master/Custom.txt
https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/xiaomi
https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/apple
https://raw.githubusercontent.com/nextdns/native-tracking-domains/main/domains/alexa

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
