# FileView - Modern Local File Explorer (Chrome Extension)

A clean, modern local file explorer and `file:///` directory replacement extension built with Chrome Extension Manifest V3, React 18, Tailwind CSS v4, and Lucide React.

---

## Quick Setup Guide

### Method 1: Download from Releases (Fastest / No Coding Required)

- **Option A — Drag & Drop**:
  - Download the latest `fileview.zip` from [Releases](https://github.com/md-sonu07/FileView/releases).
  - Open Chrome and navigate to:
    ```text
    chrome://extensions/
    ```
  - Turn **ON** the **"Developer mode"** switch in the top-right corner.
  - Drag and drop the downloaded file directly onto the `chrome://extensions/` page to install and run.

- **Option B — Select Folder ("Load Unpacked")**:
  - Download and unzip `fileview.zip` into a folder on your computer.
  - Open Chrome and navigate to:
    ```text
    chrome://extensions/
    ```
  - Turn **ON** the **"Developer mode"** switch in the top-right corner.
  - Click the **"Load unpacked"** button in the top-left corner.
  - Select the unzipped folder in the file picker dialog.

---

### Method 2: Build from Source (For Developers)

- **Clone the repository**:
  ```bash
  git clone https://github.com/md-sonu07/FileView.git
  cd FileView
  ```
- **Install dependencies**:
  ```bash
  npm install
  ```
- **Build the extension**:
  ```bash
  npm run build
  ```
- **Load into Chrome**:
  - Open `chrome://extensions/` in Chrome.
  - Enable **"Developer mode"** in the top-right corner.
  - Click **"Load unpacked"** and select the project's **`dist`** folder.

---

### Important: Enable Access to File URLs (Must Do)

Chrome blocks extensions from reading local files by default. To enable:

- Open `chrome://extensions/` in Chrome.
- Locate the **FileView** card and click the **"Details"** button.
- Scroll down and turn **ON** the switch:
  - **"Allow access to file URLs"**
- *(Done! Browse any local folder or open `file:///Users/` in Chrome to see the modern UI).*

---

## Key Features

- **Full-Page File Previews**:
  - **Coding Files (`.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.py`, `.html`, `.css`, `.sql`, `.sh`, `.yml`, etc.)**:
    - High-contrast code editor interface with support for dark and light editor themes.
    - Sticky gutter with right-aligned, dimmed line numbers (non-selectable).
    - Zero-dependency syntax token highlighting for keywords, strings, numbers, booleans, and comments.
    - One-click "Copy Code" button, soft wrap toggle, and real-time line count status bar.
  - **Text & Document Files (`.txt`, `.log`, `.md`, `.csv`, `.tsv`)**:
    - Clean reader mode with comfortable paper document layout and proportional typography.
    - Markdown formatted rendered preview with instant toggle to raw text.
    - Live reading metrics: word count, character count, line count, and estimated read time.
  - **Image Files (`.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.ico`, etc.)**:
    - Centered full-canvas scaling with zero distortion.
    - Zoom In (`+`), Zoom Out (`-`), and Reset to 100% controls.
    - Backdrop modes: Transparent Grid (Checkerboard), Dark Canvas, and Light Canvas.
    - Exact resolution dimensions display (`width × height px`) and file size.
  - **Audio, Video & Binaries**:
    - Built-in HTML5 audio/video media player cards and direct download shortcuts.
  - **File Details Drawer**:
    - Collapsible side panel (`(i)` icon) showing exact bytes, MIME type, category, and timestamps.
  - **Quick Exit**:
    - Return to the file list via the `← Back` button or by pressing the `Escape` key.

- **File Explorer & Toolbar**:
  - **Interactive Breadcrumbs**: Clickable path segments to jump up directory levels with a dedicated parent folder back button.
  - **Custom Sort Dropdown**: Modern popover menu to sort by Name, Size, or Date Modified with Ascending/Descending toggle.
  - **Live Search Filter**: Real-time filename filter with instant match counter (e.g. `12 of 85 items`).
  - **Address Bar & Quick Paths**: Direct path input with one-click quick chips (`file:///Users/`, `file:///`, `file:///C:/`).
  - **Status Bar**: Folder summary displaying item count, directory count, file count, and total folder size.

- **`file:///` Auto-Enhancement System**:
  - **Master UI Toggle Switch**: In popup and on web pages to switch between FileView Modern UI and Chrome's classic table.
  - **Live Tab Synchronization**: Instant real-time UI switching across tabs without manual reloads.
  - **Classic View Button**: Shortcut to view Chrome's raw directory table at any time.

- **Spacious Layout**:
  - Optimized 760×590px extension popup.
  - One-click popout button to open FileView in a full-screen, responsive browser tab (`index.html`).

---

## How to Use FileView

- **Method A — Native Folder Picker**:
  - Click the **FileView** icon in your Chrome toolbar.
  - Click **"Choose Folder"** and select any local folder on your computer.
  - Browse files, navigate subfolders, and click any file to open its full-page preview.

- **Method B — Direct `file:///` Navigation**:
  - In Chrome, enter any local path in the address bar (e.g. `file:///Users/`, `file:///C:/`, or `file:///`).
  - Alternatively, press `Cmd + O` (Mac) or `Ctrl + O` (Windows) and open any folder.
  - FileView automatically replaces Chrome's raw black text table with the clean modern UI.

- **Method C — Standalone Tab**:
  - In the FileView header, click the **"Open in new tab"** (external link) icon.
  - FileView opens in a full-screen browser tab with expanded layout.

---

## Keyboard Shortcuts

- **`Escape`**: Close the active full-page file preview and return to the file explorer.
- **`Enter` / `Space`**: Open the selected folder or file when focused.
- **`Cmd + F` / `Ctrl + F`**: Search files in the toolbar input.

---

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite 5 + `@tailwindcss/vite`
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Platform**: Chrome Extension Manifest V3 (Service Worker + Content Scripts)

---

## Project Structure

- **`public/`**: Extension assets and configuration.
  - `manifest.json`: Manifest V3 config, permissions (`storage`, `tabs`, `file:///*`), background worker, and content scripts.
  - `background.js`: Service worker synchronizing UI toggle state across tabs.
  - `content.js` & `content.css`: Injected script and styles transforming raw `file:///` pages.
  - `icons/`: Extension icons in 16px, 48px, and 128px formats.
- **`src/`**: Application source code.
  - `components/`: Modular UI (Header, Toolbar, CustomDropdown, FileList, FilePreview, AddressBar, WelcomeState, StatusBar).
  - `utils/`: Syntax highlighter (`syntaxHighlighter.js`), File System API wrapper, formatters, and file icon helpers.
  - `App.jsx`: Main state manager coordinating folder handles, URLs, search, sort, and preview modal.
  - `index.css`: Tailwind CSS v4 rules and 760×590px popup sizing specifications.
- **`dist/`**: Compiled production bundle loaded directly into Google Chrome.
