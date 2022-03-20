
const extId = 'tbl2csv';

let hlexportables = {};

async function showNotification(title,message){
	const options = {
		"type": "basic",
		"iconUrl": browser.runtime.getURL("icon.png"),
		"title": extId + ": " + title,
		"message": message
	};
	try {
		const nid = await browser.notifications.create(extId, options);
		return nid;
	}catch(err){
		onError(err, 'failed notificationId.create');
	}
	return null;
}

function onError(e, msg){
	console.log(`${extId}::onError error: ${e}, message: ${msg}`);
}

async function onUpdated(tabId, changeInfo, tabInfo) {

	if(typeof tabId === 'undefined' ) { return; }

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

async function onBrowserActionClicked(tab) {

	if(typeof tab.id === 'undefined' ) { return; }

	try {
		await browser.tabs.executeScript(tab.id, {file: 'content-script.js'}); // activeTab permission
        console.log("Script injected");
	}catch(e){
		onError(e, 'failed background.js::onBrowserActionClicked()::browser.tabs.executeScript()');
		await showNotification('failed to execute', 'Execution failed, some mozilla sites are protected, navigate somewhere else!\n Reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts');
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
		onError(e, 'failed background.js::onBrowserActionClicked()::browser.tabs.sendMessage()');
	}

}

async function onMenuClicked(clickData, tab) {

	if ( typeof clickData.menuItemId !== 'string' ) { return; }
	if ( !clickData.menuItemId.startsWith(extId) ) { return; }

	try {
		await browser.tabs.sendMessage(tab.id, {  // activeTab permission
			"targetElementId": clickData.targetElementId,
			"mode": clickData.menuItemId,
		});
	}catch(e){
		onError(e, 'failed background.js::onMenuClicked()::browser.tabs.sendMessage()');
	}
}

['HTML', 'TEXT'].forEach( (val) => {
	browser.menus.create({   // menus permission
		id: extId + val.toLowerCase(),
		title: "Export as " + val.toUpperCase(),
		documentUrlPatterns: [ "<all_urls>" ],
		contexts: ["page", "link", "image", "editable" ],
	},function(e){
		onError(e,"failed background.js::browser.menus.create()");
	});
});

// set Badge Background Color
browser.browserAction.setBadgeBackgroundColor({color: "green"}); // menu permission

// Register Listeners
browser.tabs.onUpdated.addListener(onUpdated); // activeTab permission
browser.menus.onClicked.addListener(onMenuClicked); // menu permission
browser.browserAction.onClicked.addListener(onBrowserActionClicked); // menu permission

