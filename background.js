/* global browser */

async function onBrowserActionClicked(tab) {
  await browser.tabs.executeScript(tab.id, { file: "content-script.js" });
  browser.tabs.sendMessage(tab.id, { action: "highlight" });
}

["Export HTML", "Export TEXT", "Copy HTML", "Copy TEXT"].forEach((val) => {
  browser.menus.create({
    title: val,
    documentUrlPatterns: ["<all_urls>"],
    contexts: ["page", "link", "image", "editable"],
    onclick: async (info, tab) => {
      await browser.tabs.executeScript(tab.id, { file: "content-script.js" });
      if (val.startsWith("Copy")) {
        const requiredPermission = { permissions: ["clipboardWrite"] };
        if (!(await browser.permissions.request(requiredPermission))) {
          return;
        }
      }
      await browser.tabs.sendMessage(tab.id, {
        action: "export",
        targetElementId: info.targetElementId,
        mode: val.toLowerCase(),
      });
    },
  });
});

// Register Listeners
browser.browserAction.onClicked.addListener(onBrowserActionClicked);
