// Spotify Web Playback SDK Wrapper
// Handles player initialization, playback control, and state management

import { SpotifyAuth } from './spotifyAuth';

// TypeScript declarations for Spotify Web Playback SDK
declare global {
    interface Window {
        onSpotifyWebPlaybackSDKReady: () => void;
        Spotify: {
            Player: new (options: {
                name: string;
                getOAuthToken: (cb: (token: string) => void) => void;
                volume?: number;
            }) => ISpotifyPlayer;
        };
    }
}

interface ISpotifyPlayer {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(
        event: 'ready',
        callback: (data: { device_id: string }) => void
    ): void;
    addListener(
        event: 'not_ready',
        callback: (data: { device_id: string }) => void
    ): void;
    addListener(
        event: 'player_state_changed',
        callback: (state: PlayerState | null) => void
    ): void;
    addListener(
        event: 'initialization_error',
        callback: (data: { message: string }) => void
    ): void;
    addListener(
        event: 'authentication_error',
        callback: (data: { message: string }) => void
    ): void;
    addListener(
        event: 'account_error',
        callback: (data: { message: string }) => void
    ): void;
    addListener(
        event: 'playback_error',
        callback: (data: { message: string }) => void
    ): void;
    removeListener(
        event: 'ready',
        callback: (data: { device_id: string }) => void
    ): void;
    removeListener(
        event: 'not_ready',
        callback: (data: { device_id: string }) => void
    ): void;
    removeListener(
        event: 'player_state_changed',
        callback: (state: PlayerState | null) => void
    ): void;
    removeListener(
        event: 'initialization_error',
        callback: (data: { message: string }) => void
    ): void;
    removeListener(
        event: 'authentication_error',
        callback: (data: { message: string }) => void
    ): void;
    removeListener(
        event: 'account_error',
        callback: (data: { message: string }) => void
    ): void;
    removeListener(
        event: 'playback_error',
        callback: (data: { message: string }) => void
    ): void;
    getCurrentState(): Promise<PlayerState | null>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    nextTrack(): Promise<void>;
    previousTrack(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    setVolume(volume: number): Promise<void>;
}

interface PlayerState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
        current_track: {
            id: string;
            name: string;
            artists: Array<{ name: string }>;
            album: {
                name: string;
                images: Array<{ url: string }>;
            };
            duration_ms: number;
        };
    };
}

type PlayerStateCallback = (state: PlayerState | null) => void;

export class SpotifyPlayer {
    private player: ISpotifyPlayer | null = null;
    private deviceId: string | null = null;
    private useRemote: boolean = false;
    private pollInterval: any = null;
    private stateCallbacks: Set<PlayerStateCallback> = new Set();

    // ========================================================================
    // SDK Initialization
    // ========================================================================

    async initialize(): Promise<boolean> {
        // Check if already initialized
        if (this.player) {
            return true;
        }

        // Load Spotify Web Playback SDK
        if (!window.Spotify) {
            await this.loadSDK();
        }

        // Get valid access token
        const token = await SpotifyAuth.getValidAccessToken();
        if (!token) {
            console.error('No valid access token');
            return false;
        }

        try {
            // Create player instance
            this.player = new window.Spotify.Player({
                name: 'Study Session Player',
                getOAuthToken: async (cb) => {
                    const token = await SpotifyAuth.getValidAccessToken();
                    if (token) {
                        cb(token);
                    }
                },
                volume: 0.5,
            });

            // Set up event listeners first
            this.setupEventListeners();

            // Connect to player and wait for it to be ready
            return new Promise((resolve, reject) => {
                if (!this.player) return reject(new Error('Player not created'));

                const timeout = setTimeout(() => {
                    console.warn('Timeout waiting for player. Falling back to Remote Control mode.');
                    this.useRemote = true;
                    this.startRemotePolling();
                    resolve(true);
                }, 5000); // Reduced to 5s for faster fallback

                const onReady = ({ device_id }: { device_id: string }) => {
                    clearTimeout(timeout);
                    this.player?.removeListener('ready', onReady);
                    this.player?.removeListener('initialization_error', onError);
                    this.player?.removeListener('authentication_error', onError);
                    console.log('Player ready with Device ID', device_id);
                    this.deviceId = device_id;
                    resolve(true);
                };

                const onError = ({ message }: { message: string }) => {
                    clearTimeout(timeout);
                    this.player?.removeListener('ready', onReady);
                    this.player?.removeListener('initialization_error', onError);
                    this.player?.removeListener('authentication_error', onError);

                    console.warn(`Local player initialization failed (${message}). Falling back to Remote Control mode.`);

                    // Cleanup so we can try again
                    this.player?.disconnect();
                    this.player = null;

                    this.useRemote = true;
                    this.startRemotePolling();
                    resolve(true);
                };

                this.player.addListener('ready', onReady);
                this.player.addListener('initialization_error', onError);
                this.player.addListener('authentication_error', onError);

                this.player.connect().then(success => {
                    if (!success) {
                        clearTimeout(timeout);
                        console.warn('Failed to connect to Spotify. Falling back to Remote Control mode.');
                        // Cleanup
                        this.player?.disconnect();
                        this.player = null;
                        this.useRemote = true;
                        this.startRemotePolling();
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('Player initialization failed:', error);
            return false;
        }
    }

    private async loadSDK(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.Spotify) {
                resolve();
                return;
            }

            // Create script element
            const script = document.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;

            // Set up SDK ready callback
            window.onSpotifyWebPlaybackSDKReady = () => {
                resolve();
            };

            script.onerror = () => {
                reject(new Error('Failed to load Spotify Web Playback SDK'));
            };

            document.body.appendChild(script);

            // Timeout after 10 seconds
            setTimeout(() => {
                if (!window.Spotify) {
                    reject(new Error('Spotify SDK load timeout'));
                }
            }, 10000);
        });
    }

    private setupEventListeners(): void {
        if (!this.player) return;

        // Player is ready - get device ID
        this.player.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
            this.deviceId = device_id;
        });

        // Player disconnected
        this.player.addListener('not_ready', ({ device_id }) => {
            console.log('Device ID has gone offline', device_id);
            this.deviceId = null;
        });

        // Playback state changed
        this.player.addListener('player_state_changed', (state) => {
            console.log('Player state changed:', state);
            this.notifyStateChange(state);
        });

        // Errors
        this.player.addListener('initialization_error', ({ message }) => {
            console.error('Initialization error:', message);
        });

        this.player.addListener('authentication_error', ({ message }) => {
            console.error('Authentication error:', message);
            // Try to refresh token
            SpotifyAuth.refreshAccessToken();
        });

        this.player.addListener('account_error', ({ message }) => {
            console.error('Account error:', message);
            alert('Spotify Premium is required for playback. Please upgrade your account.');
        });

        this.player.addListener('playback_error', ({ message }) => {
            console.error('Playback error:', message);
        });
    }

    // ========================================================================
    // State Management
    // ========================================================================

    onStateChange(callback: PlayerStateCallback): () => void {
        this.stateCallbacks.add(callback);
        return () => {
            this.stateCallbacks.delete(callback);
        };
    }

    private notifyStateChange(state: PlayerState | null): void {
        this.stateCallbacks.forEach((callback) => callback(state));
    }

    async getCurrentState(): Promise<PlayerState | null> {
        if (this.useRemote) {
            return this.fetchRemoteState();
        }
        if (!this.player) return null;
        return this.player.getCurrentState();
    }

    private async startRemotePolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);

        // Initial fetch
        await this.pollRemoteState();

        this.pollInterval = setInterval(() => this.pollRemoteState(), 3000);
    }

    private async pollRemoteState() {
        // console.log('[SpotifyPlayer] Polling remote state...');
        const state = await this.fetchRemoteState();
        this.notifyStateChange(state);
    }

    private async fetchRemoteState(): Promise<PlayerState | null> {
        try {
            const token = await SpotifyAuth.getValidAccessToken();
            if (!token) {
                console.warn('[SpotifyPlayer] No token available for remote state fetch');
                return null;
            }

            const response = await fetch('https://api.spotify.com/v1/me/player', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 204) return null; // No content (not playing)
            if (!response.ok) {
                console.warn('[SpotifyPlayer] Remote player fetch failed:', response.status);
                return null;
            }

            const data = await response.json();
            // console.log('[SpotifyPlayer] Remote state fetched:', data.item?.name);

            // Map Web API response to SDK PlayerState format
            return {
                paused: !data.is_playing,
                position: data.progress_ms,
                duration: data.item?.duration_ms || 0,
                track_window: {
                    current_track: {
                        id: data.item?.id || '',
                        name: data.item?.name || '',
                        artists: data.item?.artists || [],
                        album: data.item?.album || { name: '', images: [] },
                        duration_ms: data.item?.duration_ms || 0
                    }
                }
            } as unknown as PlayerState;
        } catch (error) {
            console.error('Error fetching remote state:', error);
            return null;
        }
    }

    // ========================================================================
    // Playback Control
    // ========================================================================

    async play(uri?: string): Promise<void> {
        if (!this.deviceId && !this.useRemote) {
            throw new Error('No device ID - player not ready');
        }

        const token = await SpotifyAuth.getValidAccessToken();
        if (!token) {
            throw new Error('No valid access token');
        }

        const body: Record<string, unknown> = {};

        if (uri) {
            if (uri.includes('playlist') || uri.includes('album')) {
                body.context_uri = uri;
            } else {
                body.uris = [uri];
            }
        }

        const url = this.useRemote
            ? 'https://api.spotify.com/v1/me/player/play'
            : `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            if (response.status === 404 && this.useRemote) {
                throw new Error('No active Spotify device found. Please open Spotify on your computer or phone.');
            }

            const errorText = await response.text();
            console.error('Spotify play API error:', response.status, errorText);
            throw new Error(`Failed to play: ${response.status} ${response.statusText}`);
        }
    }

    async pause(): Promise<void> {
        if (this.useRemote) {
            return this.remoteControl('PUT', 'pause');
        }
        if (!this.player) return;
        await this.player.pause();
    }

    async resume(): Promise<void> {
        if (this.useRemote) {
            return this.remoteControl('PUT', 'play');
        }
        if (!this.player) return;
        await this.player.resume();
    }

    async togglePlay(): Promise<void> {
        if (this.useRemote) {
            const state = await this.getCurrentState();
            if (state?.paused) {
                return this.resume();
            } else {
                return this.pause();
            }
        }
        if (!this.player) return;
        await this.player.togglePlay();
    }

    async nextTrack(): Promise<void> {
        if (this.useRemote) {
            return this.remoteControl('POST', 'next');
        }
        if (!this.player) return;
        await this.player.nextTrack();
    }

    async previousTrack(): Promise<void> {
        if (this.useRemote) {
            return this.remoteControl('POST', 'previous');
        }
        if (!this.player) return;
        await this.player.previousTrack();
    }

    async seek(positionMs: number): Promise<void> {
        if (this.useRemote) {
            const token = await SpotifyAuth.getValidAccessToken();
            if (!token) return;
            await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return;
        }
        if (!this.player) return;
        await this.player.seek(positionMs);
    }

    async setVolume(volume: number): Promise<void> {
        if (this.useRemote) {
            const token = await SpotifyAuth.getValidAccessToken();
            if (!token) return;
            // Web API volume is 0-100, SDK is 0-1
            await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${Math.round(volume * 100)}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return;
        }
        if (!this.player) return;
        await this.player.setVolume(volume);
    }

    private async remoteControl(method: string, endpoint: string): Promise<void> {
        const token = await SpotifyAuth.getValidAccessToken();
        if (!token) return;
        await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        // Force update state after control action
        setTimeout(() => this.pollRemoteState(), 200);
    }

    // ========================================================================
    // Cleanup
    // ========================================================================

    disconnect(): void {
        if (this.player) {
            this.player.disconnect();
            this.player = null;
            this.deviceId = null;
        }
    }

    getDeviceId(): string | null {
        return this.deviceId;
    }
}
