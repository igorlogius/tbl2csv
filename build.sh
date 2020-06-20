#!/bin/bash
type web-ext >/dev/null
RET=$?
WEBEXT_CMD='web-ext build -s ./src/ -a . --overwrite-dest'
if [ $RET -ne 0 ];
then
	npm install web-ext --prefix $(pwd)
	eval ./node_modules/.bin/$WEBEXT_CMD
else
	eval "$WEBEXT_CMD"
fi
