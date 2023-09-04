#!/bin/bash

download_lists() {
  urls=$1
  output=$2
  
  curl -sSfL --parallel --parallel-max 10 --retry 3 ${urls[@]} > $output
}
