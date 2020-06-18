# tbl2csv

## Description
Save tables or lists as a comma seperated values (csv) file which can be opened with any spreadsheet processor (e.g. excel, libreoffice-calc) to do further processing and conversion (e.g. to xls or ods).

## Website
https://addons.mozilla.org/en-US/firefox/addon/tbl2csv/

## Requirements

- web-ext (https://github.com/mozilla/web-ext)

## Development / Testing
```bash
git clone https://github.com/igorlogius/tbl2csv.git
cd tbl2csv/
node_modules/.bin/web-ext run
```

## Build Ext. Package

```bash
git clone https://github.com/igorlogius/tbl2csv.git
cd tbl2csv/
npm install web-ext
node_modues/.bin/web-ext build -a .
```

Import tbl2csv-x.y.z.zip into your your browser

