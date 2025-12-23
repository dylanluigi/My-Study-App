const electron = require('electron');
const { app, BrowserWindow, ipcMain, session, shell } = electron;

if (!app) {
    console.error('CRITICAL ERROR: Electron app object is undefined!');
    process.exit(1);
}
const path = require('path');

const allowSpotifyCompatibility = process.env.SPOTIFY_IFRAME_COMPAT === 'true';

// ========================================================================
// Security & Spotify compatibility toggles
// ========================================================================
// By default we keep web security enabled and only relax Electron flags if
// the compatibility flag is explicitly enabled. This preserves functionality
// for the Spotify widget while avoiding unnecessary global exceptions.
if (allowSpotifyCompatibility) {
    app.commandLine.appendSwitch('disable-features',
        'SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure,PartitionedCookies,ThirdPartyStoragePartitioning'
    );
    app.commandLine.appendSwitch('enable-features', 'StorageAccessAPI');
    app.commandLine.appendSwitch('disable-site-isolation-trials');
    // Only apply when explicitly requested because it weakens process isolation
    app.commandLine.appendSwitch('no-sandbox');
} else {
    app.commandLine.appendSwitch('enable-features', 'StorageAccessAPI');
}

const fs = require('fs');
const chromeVersion = '143.0.7499.147'; // Found on system
const arch = process.arch === 'arm64' ? 'mac_arm64' : 'mac_x64';
const widevinePath = `/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/${chromeVersion}/Libraries/WidevineCdm/_platform_specific/${arch}/libwidevinecdm.dylib`;

console.log('---------------------------------------------------');
console.log('Audio Architecture Debugging:');
console.log(`Process Arch: ${process.arch}`);
console.log(`Calculated Arch Folder: ${arch}`);
console.log(`Looking for Widevine at: ${widevinePath}`);
console.log(`File Exists? ${fs.existsSync(widevinePath)}`);
console.log('---------------------------------------------------');

if (fs.existsSync(widevinePath)) {
    console.log(`[Widevine] Found library at: ${widevinePath}`);
    app.commandLine.appendSwitch('widevine-cdm-path', widevinePath);
    // CRITICAL: Must match the version found in manifest.json
    app.commandLine.appendSwitch('widevine-cdm-version', '4.10.2934.0');
    // Ensure Widevine is enabled
    app.commandLine.appendSwitch('enable-widevine-cdm');
} else {
    console.error(`[Widevine] Library NOT found at: ${widevinePath}`);
}

// ...

const createWindow = () => {
    // Create shared session for Spotify authentication
    const sharedSession = session.fromPartition('persist:spotify');

    const allowedNavigationHosts = new Set([
        '127.0.0.1',
        'localhost',
        'open.spotify.com',
        'accounts.spotify.com',
        'sdk.scdn.co',
        'youtube.com',
        'www.youtube.com',
    ]);

    // ========================================================================
    // CRITICAL FIX #1: Grant Storage Access API Permissions
    // ========================================================================
    // This allows the Spotify iframe to request third-party cookie access
    sharedSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const url = webContents.getURL();
        console.log(`[Permission Request] ${permission} from ${url}`);

        // Grant storage-access permission for Spotify domains
        if (permission === 'storage-access' || permission === 'top-level-storage-access') {
            if (url.includes('spotify.com')) {
                console.log(`[Permission] GRANTED ${permission} for Spotify`);
                callback(true);
                return;
            }
        }

        // Grant media permissions for Spotify player
        if (permission === 'media' || permission === 'audio-capture') {
            if (url.includes('spotify.com')) {
                console.log(`[Permission] GRANTED ${permission} for Spotify`);
                callback(true);
                return;
            }
        }

        // Deny all other permissions by default (security best practice)
        console.log(`[Permission] DENIED ${permission}`);
        callback(false);
    });

    // ========================================================================
    // CRITICAL FIX #2: Check Permissions for Ongoing Access
    // ========================================================================
    // Required for complete permission handling (not just initial request)
    sharedSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
        console.log(`[Permission Check] ${permission} for ${requestingOrigin}`);

        if (permission === 'storage-access' || permission === 'top-level-storage-access') {
            if (requestingOrigin.includes('spotify.com')) {
                console.log(`[Permission Check] ALLOWED ${permission}`);
                return true;
            }
        }

        if (permission === 'media') {
            if (requestingOrigin.includes('spotify.com')) {
                return true;
            }
        }

        return false;
    });

    // ========================================================================
    // CRITICAL FIX #3: Modify RESPONSE Headers (Set-Cookie from server)
    // ========================================================================
    // Catch ALL domains, not just spotify.com (Spotify uses CDNs)
    sharedSession.webRequest.onHeadersReceived((details, callback) => {
        if (details.responseHeaders) {
            const modifiedHeaders = { ...details.responseHeaders };

            // Find Set-Cookie header (case-insensitive)
            const setCookieKey = Object.keys(modifiedHeaders).find(k => k.toLowerCase() === 'set-cookie');

            if (setCookieKey && modifiedHeaders[setCookieKey]) {
                modifiedHeaders[setCookieKey] = modifiedHeaders[setCookieKey].map(cookie => {
                    // Force SameSite=None for third-party cookie access
                    let newCookie = cookie.replace(/SameSite=(Lax|Strict|None)/gi, 'SameSite=None');
                    if (!newCookie.toLowerCase().includes('samesite=')) {
                        newCookie += '; SameSite=None';
                    }

                    // Ensure Secure flag (required for SameSite=None)
                    if (!newCookie.toLowerCase().includes('secure')) {
                        newCookie += '; Secure';
                    }

                    console.log(`[Cookie Modified] ${cookie.substring(0, 50)}...`);
                    return newCookie;
                });
            }

            callback({ responseHeaders: modifiedHeaders });
        } else {
            callback({ cancel: false });
        }
    });

    // ========================================================================
    // CRITICAL FIX #4: Modify REQUEST Headers (Cookie to server)
    // ========================================================================
    // Ensure cookies are sent in requests (not just received)
    sharedSession.webRequest.onBeforeSendHeaders((details, callback) => {
        if (details.requestHeaders) {
            // Allow credentials to be sent
            const modifiedHeaders = { ...details.requestHeaders };

            // Ensure referer is set (some APIs check this)
            if (!modifiedHeaders['Referer'] && details.url.includes('spotify.com')) {
                modifiedHeaders['Referer'] = 'https://open.spotify.com/';
            }

            callback({ requestHeaders: modifiedHeaders });
        } else {
            callback({ cancel: false });
        }
    });

    // ========================================================================
    // CRITICAL: Spoof User-Agent to prevent Spotify from detecting Electron
    // ========================================================================
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    sharedSession.setUserAgent(userAgent);

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1100,
        height: 800,
        frame: false, // Frameless
        transparent: true,
        vibrancy: 'under-window',
        visualEffectState: 'active',
        titleBarStyle: 'hidden', // Completely hidden (no traffic light space reserved if we hide them)
        hasShadow: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            partition: 'persist:spotify', // Use persistent session
            session: sharedSession,
            webSecurity: !allowSpotifyCompatibility, // Enable by default; can be toggled for Spotify iframe troubleshooting
            allowRunningInsecureContent: false,
            // Storage and cache
            enableRemoteModule: false,
            nodeIntegrationInWorker: false,
            plugins: true, // Required for Widevine CDM (Spotify Playback)
        },
    });

    // Hide traffic lights explicitly (macOS)
    mainWindow.setWindowButtonVisibility(false);

    // Prevent unexpected navigations to untrusted domains
    mainWindow.webContents.on('will-navigate', (event, url) => {
        try {
            if (url.startsWith('file://')) {
                return;
            }
            const hostname = new URL(url).hostname;
            if (!allowedNavigationHosts.has(hostname) && !url.startsWith('devtools://')) {
                event.preventDefault();
                shell.openExternal(url);
            }
        } catch (error) {
            event.preventDefault();
        }
    });

    // Handle Auth Popups & External Links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        // If it's the Spotify Login, allow it in a new window
        if (url.includes('spotify.com')) {
            return {
                action: 'allow',
                        overrideBrowserWindowOptions: {
                            width: 500,
                            height: 800,
                            frame: true, // Show frame so they can close it
                            autoHideMenuBar: true,
                            webPreferences: {
                                nodeIntegration: false,
                                contextIsolation: true,
                                partition: 'persist:spotify', // SAME session as main window
                                session: sharedSession,
                                webSecurity: !allowSpotifyCompatibility,
                            }
                        }
                    };
                }
        // Default: Open in default browser (good UX practice)
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // IPC Handlers for Custom Controls
    ipcMain.handle('minimize-window', () => {
        console.log('[IPC] Minimize requested');
        mainWindow.minimize();
    });

    ipcMain.handle('close-window', () => {
        console.log('[IPC] Close requested - Quitting App');
        app.quit();
    });

    // ...

    // Determine if we are in dev mode or production
    // In pure Electron run, process.env.NODE_ENV might not be set by Vite,
    // but our script runs `cross-env BROWSER=none npm run dev` separately.
    // We can check if we can connect to localhost:5173
    const isDev = !app.isPackaged;

    if (isDev) {
        // Use 127.0.0.1 for Spotify compatibility
        mainWindow.loadURL('http://127.0.0.1:5173');
        // Enable DevTools for debugging Spotify authentication
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Log when cookies are set (helpful for debugging)
    sharedSession.cookies.on('changed', (event, cookie, cause, removed) => {
        if (cookie.domain.includes('spotify')) {
            console.log(`[Cookie ${removed ? 'Removed' : 'Set'}] ${cookie.name} for ${cookie.domain} (${cause})`);
        }
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
