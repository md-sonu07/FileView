# FileView - Chrome Extension

FileView is a clean, modern local file explorer built as a Chrome Extension (Manifest V3) using React, Vite, Tailwind CSS v4, and Lucide React.

It features a **file:/// page transformer**:
When you toggle the option **ON** and visit any `file:///*` directory URL in Chrome (e.g. `file:///Users/danish/`), FileView replaces Chrome's default raw black table with the clean, modern FileView light-mode UI!

---

## Tech Stack

- **Framework**: React 18
- **Bundler**: Vite 5 + `@tailwindcss/vite`
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";`)
- **Icons**: Lucide React
- **Extension Platform**: Chrome Extension Manifest V3 (Service Worker + Content Scripts)

---

## Features

- **Tailwind CSS v4 Styling**: Clean, modern utility-first light-mode design with subtle borders, smooth hover transitions, and responsive layout.
- **Toggle Control**:
  - In the extension popup header: toggle **`file:/// UI: [ON / OFF]`**.
  - Directly on the `file:///` page: a switch **`Modern UI: [ON / OFF]`** lets you alternate between FileView and Chrome's default listing instantly.
- **Live Tab Reaction**: Toggling the switch immediately updates the active tab in real time.
- **Interactive Features on `file:///*`**:
  - Interactive breadcrumbs: `/` &rarr; `Users` &rarr; `danish` (click any segment to jump).
  - Quick "Parent Folder" back button.
  - Live real-time search filter for folder contents.
  - Sort by Name, Size, and Date modified.
  - Formatted file sizes, modification dates, and Lucide SVG icons.
  - Click any folder to navigate into it natively in Chrome.

---

## 1-Minute Setup in Chrome

Because Chrome isolates local files for user security, Chrome extensions require a one-time toggle to access `file:///` pages:

1. In Chrome, go to:
   ```text
   chrome://extensions/
   ```
2. If FileView is already loaded, click the **Reload** (circular arrow) icon on the FileView card.
   *(If not loaded: toggle **Developer mode** ON, click **Load unpacked**, and select this project's `dist` folder).*
3. Click the **Details** button on the FileView card.
4. Scroll down and turn **ON** the switch:
   **"Allow access to file URLs"**
5. Now, go to any local folder in Chrome (e.g. `file:///Users/danish/` or press `Cmd+O` to open any folder).
6. FileView immediately renders its modern, clean light-mode interface!
