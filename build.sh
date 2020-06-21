#!/bin/bash

# HARDLINK FILE ln -P edit only in `build-web-ext`

#type web-ext >/dev/null 2>&1
#RET=$?
#WEBEXT_CMD='web-ext build -s ./src/ -a . --overwrite-dest'
#if [ $RET -ne 0 ];
#then
#	echo "installing web-ext .. "
#	npm install web-ext --prefix $(pwd)
#	eval ./node_modules/.bin/$WEBEXT_CMD
#else
#	eval "$WEBEXT_CMD"
#fi

zip -j "${NAME}-$(grep '"version"' ./src/manifest.json  | cut -d'"' -f4).xpi" ./src/*
