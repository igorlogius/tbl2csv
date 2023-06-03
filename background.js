/* global browser */

const manifest = browser.runtime.getManifest();
const extname = manifest.name;

let hlexportables = {};

async function showNotification(title, message) {
  const options = {
    type: "basic",
    iconUrl: browser.runtime.getURL("icon.png"),
    title: extname + ": " + title,
    message: message,
  };
  try {
    const nid = await browser.notifications.create(extname, options);
    return nid;
  } catch (err) {
    onError(err, "failed notificationId.create");
  }
  return null;
}

function onError(e, msg) {
  console.error(`${extname}::onError error: ${e}, message: ${msg}`);
}

async function onUpdated(tabId /*, changeInfo, tabInfo*/) {
  if (typeof tabId === "undefined") {
    return;
  }

  try {
    await browser.tabs.sendMessage(tabId, { isOn: true }).then(() => {
      hlexportables[tabId] = true;
      browser.browserAction.setBadgeText({ text: "on", tabId: tabId });
    });
  } catch (err) {
    browser.browserAction.setBadgeText({ text: "", tabId: tabId });
    delete hlexportables[tabId];
  }
}

async function onBrowserActionClicked(tab) {
  if (typeof tab.id === "undefined") {
    return;
  }

  try {
    await browser.tabs.executeScript(tab.id, { file: "content-script.js" });
    console.log("Script injected");
  } catch (e) {
    onError(
      e,
      "failed background.js::onBrowserActionClicked()::browser.tabs.executeScript()"
    );
    await showNotification(
      "failed to execute",
      "Execution failed, some mozilla sites are protected, navigate somewhere else!\n Reference: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts"
    );
    return;
  }
  if (typeof hlexportables[tab.id] === "undefined") {
    browser.browserAction.setBadgeText({ text: "on", tabId: tab.id });
    hlexportables[tab.id] = true;
  } else {
    browser.browserAction.setBadgeText({ text: "", tabId: tab.id });
    delete hlexportables[tab.id];
  }

  try {
    await browser.tabs.sendMessage(tab.id, {
      hlDivTbls: true,
      hlToggle: hlexportables[tab.id],
    });
  } catch (e) {
    onError(
      e,
      "failed background.js::onBrowserActionClicked()::browser.tabs.sendMessage()"
    );
  }
}

["Export HTML", "Export TEXT", "Copy HTML", "Copy TEXT"].forEach((val) => {
  browser.menus.create(
    {
      // menus permission
      title: val,
      documentUrlPatterns: ["<all_urls>"],
      contexts: ["page", "link", "image", "editable"],
      onclick: async (info, tab) => {
        try {
          await browser.tabs.sendMessage(tab.id, {
            targetElementId: info.targetElementId,
            mode: val.toLowerCase(),
          });
        } catch (e) {
          onError(
            e,
            "failed background.js::onMenuClicked()::browser.tabs.sendMessage()"
          );
        }
      },
    },
    function (e) {
      onError(e, "failed background.js::browser.menus.create()");
    }
  );
});

// set Badge Background Color
browser.browserAction.setBadgeBackgroundColor({ color: "green" });

// Register Listeners
browser.tabs.onUpdated.addListener(onUpdated);
browser.browserAction.onClicked.addListener(onBrowserActionClicked);
