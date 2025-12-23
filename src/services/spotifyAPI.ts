// Spotify Web API Service
// Fetch playlists, tracks, and other data

import { SpotifyAuth } from './spotifyAuth';

export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    images: Array<{ url: string }>;
    tracks: {
        total: number;
    };
    uri: string;
}

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: Array<{ url: string }>;
    };
    duration_ms: number;
    uri: string;
}

export interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
    images: Array<{ url: string }>;
    product: string; // 'premium' or 'free'
}

export class SpotifyAPI {
    private static async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = await SpotifyAuth.getValidAccessToken();

        if (!token) {
            throw new Error('No valid access token');
        }

        const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, try to refresh
                const newToken = await SpotifyAuth.refreshAccessToken();
                if (newToken) {
                    // Retry with new token
                    return this.fetch<T>(endpoint, options);
                }
            }
            throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // ========================================================================
    // User Profile
    // ========================================================================

    static async getCurrentUser(): Promise<SpotifyUser> {
        return this.fetch<SpotifyUser>('/me');
    }

    // ========================================================================
    // Playlists
    // ========================================================================

    static async getUserPlaylists(limit = 50): Promise<SpotifyPlaylist[]> {
        const response = await this.fetch<{ items: SpotifyPlaylist[] }>(`/me/playlists?limit=${limit}`);
        return response.items;
    }

    static async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
        return this.fetch<SpotifyPlaylist>(`/playlists/${playlistId}`);
    }

    static async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
        const response = await this.fetch<{ items: { track: SpotifyTrack }[] }>(`/playlists/${playlistId}/tracks`);
        return response.items.map((item) => item.track);
    }

    // ========================================================================
    // Search
    // ========================================================================

    static async search(query: string, type: 'track' | 'playlist' | 'album' = 'track', limit = 20): Promise<unknown[]> {
        const response = await this.fetch<{ [key: string]: { items: unknown[] } }>(`/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
        return response[`${type}s`].items;
    }

    // ========================================================================
    // User's Library
    // ========================================================================

    static async getSavedTracks(limit = 50): Promise<SpotifyTrack[]> {
        const response = await this.fetch<{ items: { track: SpotifyTrack }[] }>(`/me/tracks?limit=${limit}`);
        return response.items.map((item) => item.track);
    }

    static async getSavedAlbums(limit = 50): Promise<unknown[]> {
        const response = await this.fetch<{ items: { album: unknown }[] }>(`/me/albums?limit=${limit}`);
        return response.items.map((item) => item.album);
    }
}
