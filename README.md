# My Study App

My Study App is a cross-platform organizer built with React, TypeScript, Vite, and Electron. It combines a dashboard of widgets with calendar planning, to-do management, exam tracking, and focused study tools so you can centralize your workflow in one interface. The project is configured for local development, desktop packaging, and secure sharing on GitHub.

## Features
- **Dashboard widgets**: Arrange tiles for focus timers, exam lists, Spotify playback, clocks, YouTube embeds, Pomodoro timers, and PDF previews.
- **Calendar view**: Add, edit, and browse events with modal dialogs.
- **Task management**: Track tasks with priorities and completion states.
- **Exam organizer**: Store exam details, dates, and study notes.
- **Media helpers**: Spotify playback and YouTube embeds (requires your own Spotify client ID for authentication).
- **Theming**: Switch themes and adjust visual settings via the built-in controls.

## Security & Privacy
- **Spotify credentials stay local**: You must supply your own `VITE_SPOTIFY_CLIENT_ID` via environment variables; no shared or default client IDs are shipped in the codebase.
- **Electron hardening**: Browser windows use `contextIsolation`, disable `nodeIntegration`, and block navigation to untrusted hosts. External links are opened in the system browser.
- **Optional compatibility mode**: If Spotify embeds require relaxed cookie handling, set `SPOTIFY_IFRAME_COMPAT=true` when launching Electron. By default, stricter web security is enforced.

## Prerequisites
- Node.js 20+ and npm
- A Spotify application client ID if you plan to use the Spotify widget (configure redirect URI `http://127.0.0.1:5173/callback` in the Spotify dashboard).

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Set environment variables**
   Create a `.env` file in the project root:
   ```bash
   VITE_SPOTIFY_CLIENT_ID=<your_spotify_client_id>
   ```
   The redirect URI is fixed at `http://127.0.0.1:5173/callback` for local development; add it to your Spotify app configuration.

## Running the app
- **Web (Vite)**
  ```bash
  npm run dev
  ```
  Visit the printed URL (defaults to `http://127.0.0.1:5173`).

- **Desktop (Electron)**
  ```bash
  npm run electron:dev
  ```
  If Spotify login requires relaxed cookie rules, start with `SPOTIFY_IFRAME_COMPAT=true npm run electron:dev`.

## Building & Testing
- **Production build**
  ```bash
  npm run build
  ```
- **Preview the build**
  ```bash
  npm run preview
  ```
- **Package desktop app**
  ```bash
  npm run electron:build
  ```
- **Lint**
  ```bash
  npm run lint
  ```

## Usage guide
- **Dashboard**: Add widgets (Spotify, YouTube, focus timer, etc.) and resize them to fit your workspace.
- **Calendar**: Click dates to create events or edit existing entries in modal dialogs.
- **Tasks**: Manage to-dos with priorities and mark them complete as you work.
- **Exams**: Keep exam metadata (date, subject, notes) organized and ready to review.
- **Spotify**: Click the Spotify widget login button to authenticate with your own client ID; playback uses the Web Playback SDK. If authentication fails inside Electron, retry with `SPOTIFY_IFRAME_COMPAT=true` to enable the compatibility tweaks.
- **YouTube/PDF**: Use the widgets to embed study videos or reference PDFs alongside your tasks.

## Licensing
This project is distributed under the Business Source License 1.1 (BUSL-1.1). See [LICENSE](./LICENSE) for details. You may use, modify, and contribute to the codebase for non-production purposes; production use requires permission from the licensor until the change date specified in the license.
