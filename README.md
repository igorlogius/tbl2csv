# tbl2csv a firefox/chrome webextension add-on

## Details:
https://addons.mozilla.org/en-US/firefox/addon/tbl2csv/

## Usage:  
```
wget https://github.com/igorlogius/tbl2csv/archive/master.zip
unzip master.zip
zip -j "tbl2csv-$(grep '"version"' tbl2csv-master/src/manifest.json  | cut -d'"' -f4).xpi" ./tbl2csv-master/src/*
```
Import tbl2csv-x.y.z.zip into your browser (e.g. via `about:debugging`)
