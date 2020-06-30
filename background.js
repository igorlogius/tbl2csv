
const extId = 'tbl2csv';

let hlexportables = {};

function onError(e,msg){console.log(`${extId}::onError error: ${e}, stack: ${e.stack}, message: ${msg}`);}

async function onUpdated(tabId, changeInfo, tabInfo) { 
	if(typeof tabId !== 'undefined' ) {
		try {
			await browser.tabs.sendMessage(tabId, {"isOn": true}).then( () => {  // activeTab permission
				hlexportables[tabId] = true; 
				browser.browserAction.setBadgeText({"text": "on", "tabId": tabId}); // menus permission
			});
		}catch(err) {
			browser.browserAction.setBadgeText({"text": "", "tabId": tabId}); // menus permission
			delete hlexportables[tabId];
		}
	}
}

async function onBrowserActionClicked(tab) { 

	if(typeof tab.id !== 'undefined' ) {
		try { 
			await browser.tabs.executeScript({file: 'content-script.js'}); // activeTab permission
		}catch(e){
			onError(e, 'failed executeScript');
			return;
		}
		if(typeof hlexportables[tab.id] === 'undefined') { 
				browser.browserAction.setBadgeText({"text": "on", "tabId": tab.id}); // menu permission
				hlexportables[tab.id] = true; 
		}else { 
				browser.browserAction.setBadgeText({"text": "", "tabId": tab.id}); // menu permission
				delete hlexportables[tab.id];
		}

		try { 
			await browser.tabs.sendMessage(tab.id, {"hlDivTbls": true, "hlToggle": hlexportables[tab.id]}); // activeTab permission
		}catch(e){
			onError(e, 'failed sendMessage');
			return;
		}
	}

}

async function onMenuClicked(clickData, tab) { 
	if (typeof clickData.menuItemId === 'string' 
		&& clickData.menuItemId.startsWith(extId)) {
		try {
			await browser.tabs.sendMessage(tab.id, {  // activeTab permission 
				"targetElementId": clickData.targetElementId, 
				"mode": clickData.menuItemId,
			});
		}catch(e){
			onError(e, 'failed sendMessage');
		}
	}
}

['HTML', 'TEXT'].forEach( (val) => {
	browser.menus.create({   // menus permission
		id: extId + val.toLowerCase(),
		title: "Export as " + val.toUpperCase(),
		documentUrlPatterns: [ "https://*/*", "http://*/*" ],
		contexts: ["page", "link", "image", "editable" ],
	});
});

// set Badge Background Color 
browser.browserAction.setBadgeBackgroundColor({color: "green"}); // menu permission
// Register Listeners 
browser.tabs.onUpdated.addListener(onUpdated); // activeTab permission
browser.menus.onClicked.addListener(onMenuClicked); // menu permission
browser.browserAction.onClicked.addListener(onBrowserActionClicked); // menu permission

