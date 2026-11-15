const api = globalThis.browser ?? globalThis.chrome;
const $ = (selector) => document.querySelector(selector);
const elements = {
  firstGroup: $("#first-group"), groupForm: $("#group-form"), groupName: $("#group-name"),
  toggleForm: $("#toggle-group-form"), saveSection: $("#save-section"), saveForm: $("#save-form"),
  saveGroup: $("#save-group"), activePage: $("#active-page"), library: $("#library-section"),
  themeToggle: $("#theme-toggle"),
  filters: $("#group-filters"), allGroupsFilter: $("#all-groups-filter"), list: $("#bookmark-list"), search: $("#search"), searchToggle: $("#search-toggle"),
  searchPanel: $("#search-panel"), searchReset: $("#search-reset"),
  count: $("#bookmark-count"), status: $("#status"), backupToggle: $("#backup-toggle"),
  backupPanel: $("#backup-panel"), exportAll: $("#export-all"),
  importGroup: $("#import-group"), importFile: $("#import-file")
};
let groups = [];
let activeTab = null;
let selectedGroup = "all";
let theme = "light";

function applyTheme(value) {
  theme = value;
  document.documentElement.dataset.theme = value;
  const next = value === "dark" ? "light" : "dark";
  elements.themeToggle.setAttribute("aria-label", `Switch to ${next} mode`);
  elements.themeToggle.title = `Switch to ${next} mode`;
}

function message(text) {
  elements.status.textContent = text;
  clearTimeout(message.timer);
  message.timer = setTimeout(() => { elements.status.textContent = ""; }, 2400);
}

function render() {
  const hasGroups = groups.length > 0;
  elements.firstGroup.classList.toggle("hidden", hasGroups);
  elements.groupForm.classList.toggle("hidden", hasGroups && elements.groupForm.dataset.open !== "true");
  elements.toggleForm.classList.toggle("hidden", !hasGroups);
  elements.saveSection.classList.toggle("hidden", !hasGroups);
  elements.library.classList.toggle("hidden", !hasGroups);

  elements.saveGroup.replaceChildren();
  for (const group of groups) {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    elements.saveGroup.append(option);
  }
  const total = groups.reduce((count, group) => count + group.bookmarks.length, 0);
  elements.count.textContent = `${total} saved ${total === 1 ? "page" : "pages"}`;
  elements.filters.replaceChildren();
  for (const group of groups) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = group.name;
    button.setAttribute("aria-pressed", String(selectedGroup === group.id));
    button.addEventListener("click", () => { selectedGroup = group.id; renderFilters(); renderBookmarks(); });
    elements.filters.append(button);
  }
  renderFilters();
  renderBookmarks();
}

function renderFilters() {
  elements.allGroupsFilter.setAttribute("aria-pressed", String(selectedGroup === "all"));
  [...elements.filters.children].forEach((button, index) => {
    button.setAttribute("aria-pressed", String(groups[index]?.id === selectedGroup));
  });
}

elements.allGroupsFilter.addEventListener("click", () => {
  selectedGroup = "all";
  renderFilters();
  renderBookmarks();
});

elements.themeToggle.addEventListener("click", async () => {
  applyTheme(theme === "dark" ? "light" : "dark");
  try {
    await api.storage.local.set({ theme });
  } catch {
    message("Theme changed, but the choice could not be saved.");
  }
});

function renderBookmarks() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const matches = groups
    .filter((group) => selectedGroup === "all" || group.id === selectedGroup)
    .flatMap((group) => group.bookmarks.map((bookmark) => ({ ...bookmark, group: group.name, groupId: group.id })))
    .filter((bookmark) => {
      try { return ["http:", "https:"].includes(new URL(bookmark.url).protocol) && `${bookmark.title} ${bookmark.url} ${bookmark.group}`.toLocaleLowerCase().includes(query); }
      catch { return false; }
    })
    .sort((a, b) => b.savedAt - a.savedAt);
  elements.list.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = query ? "No bookmarks match your search." : "Nothing saved here yet. Your next great find can go here.";
    elements.list.append(empty);
    return;
  }
  for (const bookmark of matches) {
    const row = document.createElement("div");
    row.className = "bookmark";
    const link = document.createElement("a");
    link.className = "bookmark-open";
    link.href = bookmark.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const favicon = document.createElement("span");
    favicon.className = "favicon";
    favicon.setAttribute("aria-hidden", "true");
    const fallback = document.createElement("span");
    try { fallback.textContent = new URL(bookmark.url).hostname.replace(/^www\./, "").charAt(0).toUpperCase() || "↗"; }
    catch { fallback.textContent = "↗"; }
    const icon = document.createElement("img");
    icon.src = bookmark.faviconUrl || `${new URL(bookmark.url).origin}/favicon.ico`;
    icon.alt = "";
    icon.referrerPolicy = "no-referrer";
    icon.addEventListener("error", () => icon.remove(), { once: true });
    favicon.append(fallback, icon);
    const copy = document.createElement("span");
    copy.className = "bookmark-copy";
    const title = document.createElement("span");
    title.className = "bookmark-title";
    title.textContent = bookmark.title || bookmark.url;
    const url = document.createElement("span");
    url.className = "bookmark-url";
    url.textContent = `${bookmark.group} · ${bookmark.url}`;
    copy.append(title, url);
    link.append(favicon, copy);
    const actions = document.createElement("div");
    actions.className = "bookmark-actions";
    const move = document.createElement("button");
    move.className = "move-bookmark";
    move.type = "button";
    move.disabled = groups.length < 2;
    move.setAttribute("aria-label", `Move ${bookmark.title || bookmark.url} to another group`);
    move.title = groups.length < 2 ? "Create another group to move bookmarks" : "Move to another group";
    move.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h5l2 2h7A1.5 1.5 0 0 1 20.5 9.5v8A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-10Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 13h7m0 0-2.5-2.5M15 13l-2.5 2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const destination = document.createElement("select");
    destination.className = "move-group hidden";
    destination.setAttribute("aria-label", `Choose a group for ${bookmark.title || bookmark.url}`);
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Move to…";
    placeholder.disabled = true;
    placeholder.selected = true;
    destination.append(placeholder);
    for (const group of groups.filter((item) => item.id !== bookmark.groupId)) {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.name;
      destination.append(option);
    }
    move.addEventListener("click", () => {
      move.classList.add("hidden");
      destination.classList.remove("hidden");
      destination.focus();
    });
    destination.addEventListener("change", () => moveBookmark(bookmark.groupId, bookmark.url, destination.value, destination));
    destination.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        destination.classList.add("hidden");
        move.classList.remove("hidden");
        move.focus();
      }
    });
    const remove = document.createElement("button");
    remove.className = "remove-bookmark";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${bookmark.title || bookmark.url}`);
    remove.title = "Remove bookmark";
    remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 7h15M9.5 7V4.5h5V7m3.5 0-.8 12h-10L6.5 7m4 3v5m3-5v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    remove.addEventListener("click", () => removeBookmark(bookmark.groupId, bookmark.url, remove));
    actions.append(move, destination, remove);
    row.append(link, actions);
    elements.list.append(row);
  }
}

async function removeBookmark(groupId, url, button) {
  const group = groups.find((item) => item.id === groupId);
  const index = group?.bookmarks.findIndex((bookmark) => bookmark.url === url) ?? -1;
  if (!group || index < 0) return;
  const [removed] = group.bookmarks.splice(index, 1);
  button.disabled = true;
  try {
    await api.storage.local.set({ groups });
    render();
    message("Bookmark removed.");
  } catch {
    group.bookmarks.splice(index, 0, removed);
    render();
    message("Could not remove the bookmark. Please try again.");
  }
}

async function moveBookmark(sourceId, url, destinationId, select) {
  const source = groups.find((group) => group.id === sourceId);
  const destination = groups.find((group) => group.id === destinationId);
  const index = source?.bookmarks.findIndex((bookmark) => bookmark.url === url) ?? -1;
  if (!source || !destination || index < 0) return;
  const [bookmark] = source.bookmarks.splice(index, 1);
  const alreadyThere = destination.bookmarks.some((item) => item.url === url);
  if (!alreadyThere) destination.bookmarks.push(bookmark);
  select.disabled = true;
  try {
    await api.storage.local.set({ groups });
    render();
    message(alreadyThere ? `Removed from “${source.name}”; already saved in “${destination.name}”.` : `Moved to “${destination.name}”.`);
  } catch {
    if (!alreadyThere) destination.bookmarks.splice(destination.bookmarks.indexOf(bookmark), 1);
    source.bookmarks.splice(index, 0, bookmark);
    render();
    message("Could not move the bookmark. Please try again.");
  }
}

async function loadActiveTab() {
  try {
    [activeTab] = await api.tabs.query({ active: true, currentWindow: true });
    elements.activePage.textContent = activeTab?.title || activeTab?.url || "Current page";
    elements.saveForm.querySelector("button").disabled = !activeTab?.url;
    if (!activeTab?.url) elements.activePage.textContent = "This page can’t be saved.";
  } catch {
    elements.activePage.textContent = "Could not read the current page.";
    elements.saveForm.querySelector("button").disabled = true;
  }
}

elements.groupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = elements.groupName.value.trim();
  if (!name) return;
  const group = { id: crypto.randomUUID(), name, bookmarks: [] };
  groups.push(group);
  try {
    await api.storage.local.set({ groups });
    selectedGroup = group.id;
    elements.groupName.value = "";
    elements.groupForm.dataset.open = "false";
    render();
    message(`“${name}” is ready.`);
  } catch {
    groups.pop();
    message("Could not save the group. Please try again.");
  }
});

elements.toggleForm.addEventListener("click", () => {
  const open = elements.groupForm.dataset.open !== "true";
  elements.groupForm.dataset.open = String(open);
  elements.groupForm.classList.toggle("hidden", !open);
  if (open) elements.groupName.focus();
});

elements.saveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeTab?.url) return;
  const group = groups.find((item) => item.id === elements.saveGroup.value);
  if (!group) return;
  if (group.bookmarks.some((bookmark) => bookmark.url === activeTab.url)) {
    message("This page is already in that group.");
    return;
  }
  let faviconUrl;
  try {
    const tabIcon = new URL(activeTab.favIconUrl || "");
    if (["http:", "https:"].includes(tabIcon.protocol)) faviconUrl = tabIcon.href;
  } catch {}
  group.bookmarks.unshift({ url: activeTab.url, title: activeTab.title || activeTab.url, faviconUrl, savedAt: Date.now() });
  try {
    await api.storage.local.set({ groups });
    render();
    message(`Saved to “${group.name}”.`);
  } catch {
    group.bookmarks.shift();
    message("Could not save this page. Please try again.");
  }
});

elements.searchToggle.addEventListener("click", () => {
  const open = elements.searchPanel.classList.contains("hidden");
  elements.searchPanel.classList.toggle("hidden", !open);
  elements.searchToggle.setAttribute("aria-expanded", String(open));
  if (open) elements.search.focus();
});
elements.search.addEventListener("input", () => {
  elements.searchReset.disabled = !elements.search.value;
  renderBookmarks();
});
elements.searchReset.addEventListener("click", () => {
  elements.search.value = "";
  elements.searchReset.disabled = true;
  renderBookmarks();
  elements.search.focus();
});
elements.backupToggle.addEventListener("click", () => {
  const open = elements.backupPanel.classList.contains("hidden");
  elements.backupPanel.classList.toggle("hidden", !open);
  elements.backupToggle.setAttribute("aria-expanded", String(open));
});
elements.exportAll.addEventListener("click", () => {
  try {
    const file = new Blob([JSON.stringify({
      format: "bookmark-groups-backup",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      groups: groups.map(({ name, bookmarks }) => ({ name, bookmarks }))
    }, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "bookmark-groups-backup.json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    message(`Exported ${groups.length} ${groups.length === 1 ? "group" : "groups"}.`);
  } catch {
    message("Could not export your library.");
  }
});
elements.importGroup.addEventListener("click", () => elements.importFile.click());
elements.importFile.addEventListener("change", async () => {
  const file = elements.importFile.files?.[0];
  elements.importFile.value = "";
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    message("Import file is too large. Choose a file under 5 MB.");
    return;
  }
  try {
    const data = JSON.parse(await file.text());
    const validUrl = (value) => {
      try { return typeof value === "string" && ["http:", "https:"].includes(new URL(value).protocol); }
      catch { return false; }
    };
    const importedGroups = data?.format === "bookmark-groups-backup" ? data.groups
      : data?.format === "bookmark-groups" && data.group ? [data.group] : null;
    const validGroup = (group) => typeof group?.name === "string" && group.name.trim() && group.name.length <= 40 &&
      Array.isArray(group.bookmarks) && group.bookmarks.every((bookmark) => bookmark && typeof bookmark.title === "string" &&
        validUrl(bookmark.url) && Number.isFinite(bookmark.savedAt) &&
        (bookmark.faviconUrl === undefined || validUrl(bookmark.faviconUrl)));
    if (data?.formatVersion !== 1 || !Array.isArray(importedGroups) || importedGroups.length > 1000 ||
        importedGroups.some((group) => !validGroup(group)) ||
        importedGroups.reduce((total, group) => total + group.bookmarks.length, 0) > 10000) {
      throw new Error("invalid group file");
    }
    const usedNames = new Set(groups.map((group) => group.name));
    const restoredGroups = importedGroups.map((imported) => {
      let name = imported.name;
      let suffix = 2;
      while (usedNames.has(name)) {
        const ending = ` (${suffix++})`;
        name = `${imported.name.slice(0, 40 - ending.length)}${ending}`;
      }
      usedNames.add(name);
      return {
        id: crypto.randomUUID(),
        name,
        bookmarks: imported.bookmarks.map(({ url, title, faviconUrl, savedAt }) => ({ url, title, faviconUrl, savedAt }))
      };
    });
    const previousLength = groups.length;
    groups.push(...restoredGroups);
    try {
      await api.storage.local.set({ groups });
    } catch (error) {
      groups.length = previousLength;
      throw error;
    }
    selectedGroup = "all";
    render();
    message(`Imported ${restoredGroups.length} ${restoredGroups.length === 1 ? "group" : "groups"}.`);
  } catch {
    message("Could not import this file. Choose a valid Bookmark Groups export.");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    if (elements.searchPanel.classList.contains("hidden")) elements.searchToggle.click();
    else elements.search.focus();
  }
  if (event.key === "Escape" && !elements.searchPanel.classList.contains("hidden")) {
    elements.search.value = "";
    elements.searchReset.disabled = true;
    renderBookmarks();
    elements.searchPanel.classList.add("hidden");
    elements.searchToggle.setAttribute("aria-expanded", "false");
    elements.searchToggle.focus();
  }
});

async function init() {
  try {
    const data = await api.storage.local.get(["groups", "theme"]);
    groups = Array.isArray(data.groups) ? data.groups.filter((group) => group && typeof group.name === "string" && Array.isArray(group.bookmarks)) : [];
    theme = ["light", "dark"].includes(data.theme) ? data.theme : (globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } catch {
    message("Could not load your saved groups.");
    theme = globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(theme);
  render();
  await loadActiveTab();
}

init();
