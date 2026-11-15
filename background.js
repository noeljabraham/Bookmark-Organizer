const api = globalThis.browser ?? globalThis.chrome;
const action = api.action ?? api.browserAction;
const icons = {
  saved: { 16: "icons/icon16-saved.png", 32: "icons/icon32-saved.png", 48: "icons/icon48-saved.png", 128: "icons/icon128-saved.png" },
  normal: { 16: "icons/icon16.png", 32: "icons/icon32.png", 48: "icons/icon48.png", 128: "icons/icon128.png" }
};

async function updateTab(tab) {
  if (!Number.isInteger(tab?.id)) return;
  const { groups = [] } = await api.storage.local.get("groups");
  const saved = groups.some((group) => group.bookmarks?.some((bookmark) => bookmark.url === tab.url));
  await action.setIcon({ tabId: tab.id, path: icons[saved ? "saved" : "normal"] });
}

function reportError(error) {
  console.error("Could not update the bookmark toolbar icon:", error);
}

async function refreshIcons() {
  const tabs = await api.tabs.query({});
  await Promise.all(tabs.map((tab) => updateTab(tab).catch(reportError)));
}

api.tabs.onActivated.addListener(({ tabId }) => {
  api.tabs.get(tabId).then(updateTab).catch(reportError);
});
api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status) updateTab(tab).catch(reportError);
});
api.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.groups) return;
  refreshIcons().catch(reportError);
});
api.runtime.onStartup.addListener(() => refreshIcons().catch(reportError));
api.runtime.onInstalled.addListener(() => refreshIcons().catch(reportError));
refreshIcons().catch(reportError);
