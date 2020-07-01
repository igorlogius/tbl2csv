
const extId = 'tbl2csv';

let hlexportables = {};

async function showNotification(title,message){
  const id = "blubber";
  const options = {
        "type": "basic",
        "title": extId + ": " + title,
        "message": message
      };
  try {
    const notificationId = await browser.notifications.create(id, options);
  }catch(err){
    onError(err, 'failed notificationId.create');
    return;
  }
}

function onError(e, msg){
  console.log(`${extId}::onError error: ${e}, stack: ${e.stack}, message: ${msg}`);
}

async function onUpdated(tabId, changeInfo, tabInfo) { 
  if(typeof tabId !== 'undefined' ) {
    console.log(tabInfo.url);
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

  console.log(tab.url);

  if(typeof tab.id !== 'undefined' ) {
    try { 
      await browser.tabs.executeScript({file: 'content-script.js'}); // activeTab permission
    }catch(e){
      onError(e, 'failed executeScript');
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
    documentUrlPatterns: [ "<all_urls>" ],
    contexts: ["page", "link", "image", "editable" ],
  },onError);
});

// set Badge Background Color 
browser.browserAction.setBadgeBackgroundColor({color: "green"}); // menu permission
// Register Listeners 
browser.tabs.onUpdated.addListener(onUpdated); // activeTab permission
browser.menus.onClicked.addListener(onMenuClicked); // menu permission
browser.browserAction.onClicked.addListener(onBrowserActionClicked); // menu permission

/*
browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
  //if (temporary) return; // skip during development
  switch (reason) {
    case "install":
      {
        const url = browser.runtime.getURL("installed.html");
        await browser.tabs.create({ url });
        // or: await browser.windows.create({ url, type: "popup", height: 600, width: 600, });
      }
      break;
    // see below
  }
});
*/
