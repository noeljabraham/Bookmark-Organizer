# Bookmark Organizer — Save by Group

A lightweight Chrome, Brave, and Firefox extension for saving pages into named groups and searching bookmarks.

## Features

- **Organize by group:** Create groups and save the current page to the group you choose.
- **Search your library:** Find bookmarks across all groups or within a selected group using a compact, expandable search box.
- **Custom nicknames:** Rename saved bookmarks to make them easier to find while preserving their URLs and website icons.
- **Move and remove bookmarks:** Transfer bookmarks between groups or delete entries you no longer need.
- **Website icons:** Recognize saved pages by their favicons beside each bookmark.
- **Saved-page indicator:** A check mark on the toolbar icon shows when the open page is already saved in any group.
- **Complete backups:** Export all groups and bookmarks in one JSON file, then import it to restore the library, including nicknames.
- **Light and dark modes:** Switch themes manually or follow your system theme until you choose a preference.
- **Manual URL entry:** Save a URL manually when the browser prevents the extension from reading the current page.
- **Local storage:** Groups, bookmarks, and preferences stay in your browser profile without an account.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this folder.
4. Pin **Bookmark Organizer** from the Extensions menu to keep it in the toolbar.

## Install in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on…**.
3. Select the `manifest.json` file in this folder.

Firefox temporary add-ons are removed when Firefox closes; load the file again after restarting. A permanent Firefox install requires signing the extension with Mozilla.

## Use

Create a group from the extension popup. When you are on a page to save, open the popup, choose a group, and select **Save page**. Search your library across every group, or choose a group chip to narrow the results. Your groups and bookmarks are stored locally in that browser profile.

Some browser pages such as `brave://flags` are restricted, so the extension may not be able to read their address automatically. Use **Can’t read this page? Paste its URL** to save the address manually in the selected group.

To back up your full library, open **Import / export** and select **Export all groups**. This creates one `bookmark-groups-backup.json` file containing every group and bookmark. Select **Import backup** and choose that file to restore all groups. Existing groups are kept; if a restored group name already exists, the imported group gets a number suffix so neither copy is overwritten. Earlier single-group export files can also be imported.

Use the sun/moon button in the header to switch between light and dark mode. Your choice is saved; before you choose, the popup follows your system theme.

Use the pencil button beside a bookmark to change its saved name. Enter a nickname and select **Save**, or use **Cancel** / Escape to keep its current name. Nicknames appear in search results and backups; the website URL stays the same.
