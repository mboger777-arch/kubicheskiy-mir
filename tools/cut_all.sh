#!/bin/bash
# каждый вырез — отдельный процесс (onnxruntime не копит память)
cd "$(dirname "$0")/.."
PY=/home/box/rbvenv/bin/python
for n in bloki gran pixel krivo zombie spider; do ONLY=$n $PY tools/cut.py heroes || echo FAIL $n; done
for n in b_left b_right b_up b_dig b_place b_bow b_home b_ok chest chest_open diamond heart armor prot_small torch arrow cart star board tab_grey tab_sand tab_purple protractor anvil stick iron beam sword rotate; do ONLY=$n $PY tools/cut.py ui || echo FAIL $n; done
ONLY=none $PY tools/cut.py tiles; ONLY=none $PY tools/cut.py bg
