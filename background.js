
const extId = 'tbl2csv';

let hlexportables = {};

function onError(e){
	console.log(`${extId}::onError: ${e}`);
}

// changeInfo req. tabs permissions
browser.tabs.onUpdated.addListener( async (tabId, changeInfo, tabInfo) => {  // tabs permission
	// reset icon badge when tab changes to something we dont know yet
	if( tabId && changeInfo.url && hlexportables[tabId] ){
		browser.browserAction.setBadgeText({text: "", tabId: tabInfo.id});
		delete hlexportables[tabId];
	}
});

browser.browserAction.setBadgeBackgroundColor({color: "green"});

browser.browserAction.onClicked.addListener( async (tab) => {
	
	if(typeof tab.id !== 'undefined') {
		
		await browser.tabs.executeScript({file: 'content-script.js'});

		if(typeof hlexportables[tab.id] === 'undefined') { 
		        browser.browserAction.setBadgeText({text: "on", tabId: tab.id});
			hlexportables[tab.id] = true; 

		}else { 
		        browser.browserAction.setBadgeText({text: "", tabId: tab.id});
			delete hlexportables[tab.id];
		}
		browser.tabs.sendMessage(tab.id, {"hlDivTbls": true, "hlToggle": hlexportables[tab.id]});
	}

});

['HTML', 'TEXT'].forEach( (val) => {
	browser.menus.create({   // menus permission
		id: extId + val.toLowerCase(),
		title: "Export as " + val.toUpperCase(),
		documentUrlPatterns: [ "https://*/*", "http://*/*" ],
		contexts: ["page", "link", "image", "editable" ],
	},() => {
		if(browser.runtime.lastError !== null){
			onError(browser.runtime.lastError);
		}
	});
});


browser.menus.onClicked.addListener(async (onClickData, tab) => { // menus permission
	if (onClickData.menuItemId.startsWith(extId)) {
		browser.tabs.sendMessage(tab.id, { 
			 "targetElementId": onClickData.targetElementId, 
				    "mode": onClickData.menuItemId,
		});
	}
});


