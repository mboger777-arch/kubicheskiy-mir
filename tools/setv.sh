#!/bin/bash
# новая версия для сброса кэша: tools/setv.sh 20261018k1
cd "$(dirname "$0")/.."; V=${1:-$(date +%Y%m%d%H%M)}
sed -E -i "s/(\?v=)[A-Za-z0-9_]+/\1$V/g; s/window.V=\"[A-Za-z0-9_]+\"/window.V=\"$V\"/; s/__V__/$V/g" index.html; echo V=$V
