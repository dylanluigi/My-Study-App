// Spotify OAuth 2.0 with PKCE (Proof Key for Code Exchange)
// This is the secure way to authenticate without exposing client secret

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'c3021f4222df4f36a59828236113824f';
// Hardcoded HTTP Loopback URI per Spotify's new security policy
const REDIRECT_URI = 'http://127.0.0.1:5173/callback';
const SCOPES = [
    'streaming', // Web Playback SDK
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
].join(' ');

// Token storage keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const TOKEN_EXPIRY_KEY = 'spotify_token_expiry';
const CODE_VERIFIER_KEY = 'spotify_code_verifier';

// Generate random string for PKCE
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Generate code challenge from verifier (SHA256 hash)
async function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
}

function base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const hashed = await sha256(verifier);
    return base64encode(hashed);
}

export class SpotifyAuth {
    // ========================================================================
    // OAuth Login Flow
    // ========================================================================

    static async login(): Promise<void> {
        // Generate PKCE code verifier and challenge
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Store code verifier for later
        localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);

        // Build authorization URL
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', CLIENT_ID);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('scope', SCOPES);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        authUrl.searchParams.append('code_challenge', codeChallenge);

        // Redirect to Spotify login
        // Redirect to Spotify login
        console.log('--- Spotify Auth Debug ---');
        console.log('Client ID:', CLIENT_ID);
        console.log('Redirect URI:', REDIRECT_URI);
        console.log('Full URL:', authUrl.toString());
        console.log('--------------------------');
        window.location.href = authUrl.toString();
    }

    // ========================================================================
    // Handle OAuth Callback
    // ========================================================================

    static async handleCallback(): Promise<boolean> {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            console.error('Spotify auth error:', error);
            return false;
        }

        if (!code) {
            return false;
        }

        // Get stored code verifier
        const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);
        if (!codeVerifier) {
            console.error('No code verifier found');
            return false;
        }

        // Exchange code for access token
        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    client_id: CLIENT_ID,
                    code_verifier: codeVerifier,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get access token');
            }

            const data = await response.json();

            // Store tokens
            this.storeTokens(data.access_token, data.refresh_token, data.expires_in);

            // Clean up
            localStorage.removeItem(CODE_VERIFIER_KEY);

            // Remove code from URL
            window.history.replaceState({}, document.title, window.location.pathname);

            return true;
        } catch (error) {
            console.error('Token exchange failed:', error);
            return false;
        }
    }

    // ========================================================================
    // Token Management
    // ========================================================================

    private static storeTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
        const expiryTime = Date.now() + expiresIn * 1000;
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    }

    static getAccessToken(): string | null {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

        if (!token || !expiry) {
            return null;
        }

        // Check if token is expired
        if (Date.now() >= parseInt(expiry)) {
            return null;
        }

        return token;
    }

    static async refreshAccessToken(): Promise<string | null> {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
            return null;
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: CLIENT_ID,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            // Store new tokens
            this.storeTokens(
                data.access_token,
                data.refresh_token || refreshToken, // Spotify might not return a new refresh token
                data.expires_in
            );

            return data.access_token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.logout();
            return null;
        }
    }

    static async getValidAccessToken(): Promise<string | null> {
        let token = this.getAccessToken();

        if (!token) {
            // Try to refresh
            token = await this.refreshAccessToken();
        }

        return token;
    }

    static isAuthenticated(): boolean {
        return this.getAccessToken() !== null;
    }

    static logout(): void {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);
        localStorage.removeItem(CODE_VERIFIER_KEY);
    }
}
