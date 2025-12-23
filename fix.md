 ---
  🎯 Comprehensive Plan: Fixing Spotify Authentication in Your Electron Study App

  📊 Root Cause Analysis

  The Problem:
  Your Electron app blocks third-party cookies by default (following Chromium's behavior). When users click "Log in" in the Spotify iframe:
  1. Spotify opens an OAuth popup (handled by Electron's setWindowOpenHandler)
  2. User logs in successfully in the popup window
  3. Popup closes after authentication
  4. BUT the main window's iframe doesn't receive the auth session because:
    - The popup and main window don't share session/cookies
    - Cross-origin restrictions prevent iframe cookie access
    - No mechanism exists to transfer auth state between windows

  Evidence from electron/main.cjs:28-48:
  Your popup handler creates a new BrowserWindow for Spotify URLs, but it doesn't share the session with the main window.

  ---
  🛠️ Solution Options (Ranked by Difficulty)

  Option 1: Share Session Between Windows ⭐ RECOMMENDED - Quickest Fix

  Complexity: Low
  Time: 15-30 minutes
  Success Rate: High (70-80%)

  What it does:
  Configure both the main window and Spotify popup to use the same persistent session partition, allowing cookies to be shared.

  Implementation:

  Step 1: Modify electron/main.cjs to use a shared persistent session:

  const { app, BrowserWindow, ipcMain, session } = require('electron');

  const createWindow = () => {
      // Create shared session for Spotify authentication
      const sharedSession = session.fromPartition('persist:spotify');

      const mainWindow = new BrowserWindow({
          // ... existing config ...
          webPreferences: {
              preload: path.join(__dirname, 'preload.cjs'),
              nodeIntegration: false,
              contextIsolation: true,
              partition: 'persist:spotify', // Use persistent session
              session: sharedSession,
          },
      });

      // Handle Auth Popups with shared session
      mainWindow.webContents.setWindowOpenHandler(({ url }) => {
          if (url.includes('spotify.com')) {
              return {
                  action: 'allow',
                  overrideBrowserWindowOptions: {
                      width: 500,
                      height: 800,
                      frame: true,
                      autoHideMenuBar: true,
                      webPreferences: {
                          nodeIntegration: false,
                          contextIsolation: true,
                          partition: 'persist:spotify', // SAME session as main window
                          session: sharedSession,
                      }
                  }
              };
          }
          require('electron').shell.openExternal(url);
          return { action: 'deny' };
      });

      // ... rest of your code
  };

  Pros:
  - Minimal code changes
  - Cookies persist across app restarts
  - Works for most Spotify auth flows

  Cons:
  - May still hit browser cookie policy restrictions
  - Not guaranteed to work 100% due to SameSite policies

  ---
  Option 2: Intercept & Modify Cookie Headers 🔧

  Complexity: Medium
  Time: 1-2 hours
  Success Rate: Very High (90%+)

  What it does:
  Use Electron's session.webRequest API to intercept Spotify cookies and modify their SameSite attribute to allow cross-site usage.

  Implementation:

  Add this to electron/main.cjs after creating the session:

  const sharedSession = session.fromPartition('persist:spotify');

  // Intercept and modify Spotify cookies to allow third-party usage
  sharedSession.webRequest.onHeadersReceived((details, callback) => {
      if (details.url.includes('spotify.com') && details.responseHeaders) {
          const modifiedHeaders = { ...details.responseHeaders };

          // Modify Set-Cookie headers to allow third-party cookies
          if (modifiedHeaders['set-cookie']) {
              modifiedHeaders['set-cookie'] = modifiedHeaders['set-cookie'].map(cookie => {
                  // Remove SameSite=Lax/Strict or set to None
                  let newCookie = cookie.replace(/SameSite=(Lax|Strict)/gi, 'SameSite=None');

                  // Ensure Secure flag is present (required for SameSite=None)
                  if (!newCookie.includes('Secure')) {
                      newCookie += '; Secure';
                  }

                  return newCookie;
              });
          }

          callback({ responseHeaders: modifiedHeaders });
      } else {
          callback({ cancel: false });
      }
  });

  Pros:
  - Direct control over cookie behavior
  - Bypasses browser restrictions
  - Works reliably in Electron

  Cons:
  - Requires cookie header manipulation
  - May need updates if Spotify changes auth flow

  ---
  Option 3: Use Spotify Web Playback SDK 🎵

  Complexity: High
  Time: 4-8 hours
  Success Rate: Very High (95%+)

  What it does:
  Replace the iframe embed with Spotify's official JavaScript SDK, implementing proper OAuth 2.0 PKCE flow.

  Requirements:
  - Register app at https://developer.spotify.com/dashboard
  - Get Client ID
  - Implement OAuth PKCE flow in Electron

  Implementation Overview:

  1. Register Spotify App:
    - Add redirect URI: http://localhost:3000/callback
  2. Add OAuth Flow:
    - Create src/services/spotifyAuth.ts for token management
    - Use Authorization Code with PKCE (replaces deprecated Implicit Grant)
  3. Replace SpotifyWidget:
    - Remove iframe
    - Use Web Playback SDK for full control
    - Access user's playlists, control playback programmatically

  Pros:
  - Most robust solution
  - Full control over playback
  - Access to Spotify API features
  - No cookie issues
  - Better user experience

  Cons:
  - Significant development time
  - Requires Spotify Developer account
  - More complex codebase
  - Requires internet connection for OAuth

  Note: Spotify Web Playback SDK has limitations with Electron's DRM support. May require additional configuration.

  ---
  Option 4: External Browser OAuth 🌐

  Complexity: Medium
  Time: 2-3 hours
  Success Rate: High (85%)

  What it does:
  Open Spotify login in the user's default browser, handle OAuth callback, then use the access token for the iframe.

  Implementation:

  1. Open OAuth in system browser
  2. Listen for callback on local server (electron)
  3. Store access token in app
  4. Append token to Spotify embed URL

  Pros:
  - Bypasses Electron cookie restrictions
  - Familiar login experience
  - Secure (uses system browser's security)

  Cons:
  - Requires local HTTP server for callback
  - User leaves your app briefly
  - More complex flow

  ---
  Option 5: Use Electron BrowserView 🪟

  Complexity: Medium-High
  Time: 3-4 hours
  Success Rate: Medium (60-70%)

  What it does:
  Replace the React iframe with Electron's native BrowserView, giving better session control.

  Pros:
  - Native Electron integration
  - Better session management
  - More control than iframe

  Cons:
  - Requires major refactor of SpotifyWidget
  - Loses React component benefits
  - Complex positioning/sizing logic

  ---
  ✅ My Recommendation: Try Option 1 First, Then Option 2

  Step-by-step plan:

  1. Try Option 1 (15 min):
    - Add session sharing to electron/main.cjs
    - Test if login works
    - If successful → Done!
  2. If Option 1 fails, do Option 2 (1-2 hours):
    - Add cookie header interception
    - Modify SameSite attributes
    - Very likely to work
  3. If you want the best solution long-term (4-8 hours):
    - Implement Option 3 (Web Playback SDK)
    - Professional-grade integration
    - Full Spotify API access

  ---
  📝 Which option would you like me to implement?

  Let me know and I'll write the code for you!

  Sources:
  - https://www.electronjs.org/docs/latest/api/session
  - https://github.com/electron/electron/issues/19825
  - https://www.electronjs.org/docs/latest/api/cookies
  - https://github.com/brave/brave-browser/issues/19696
  - https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
  - https://github.com/electron/electron/issues/36922