import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, List } from 'lucide-react';
import { BaseWidget } from '../BaseWidget';
import { SpotifyAuth } from '../../../services/spotifyAuth';
import { SpotifyPlayer } from '../../../services/spotifyPlayer';
import { SpotifyAPI, type SpotifyPlaylist } from '../../../services/spotifyAPI';

interface SpotifyWidgetProps {
    data?: {
        selectedPlaylistUri?: string;
    };
    onUpdate?: (data: { selectedPlaylistUri: string }) => void;
    isEditMode?: boolean;
}

interface PlayerState {
    isPlaying: boolean;
    trackName: string;
    artistName: string;
    albumArt: string;
    position: number;
    duration: number;
}

export function SpotifyWidget({ data, onUpdate }: SpotifyWidgetProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [playerState, setPlayerState] = useState<PlayerState | null>(null);
    const [player] = useState(() => new SpotifyPlayer());
    const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
    const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);

    // ... (existing constants)

    // ========================================================================
    // Initialization
    // ========================================================================

    useEffect(() => {
        // ... (existing auth check)
        const authenticated = SpotifyAuth.isAuthenticated();
        setIsAuthenticated(authenticated);

        if (window.location.search.includes('code=')) {
            handleAuthCallback();
        } else if (authenticated) {
            // Only initialize if we're not handling a callback (callback handles it)
            initializePlayer();
        }

        return () => {
            player.disconnect();
        };
    }, []);

    const handleAuthCallback = async () => {
        const success = await SpotifyAuth.handleCallback();
        if (success) {
            setIsAuthenticated(true);
            await initializePlayer();
        } else {
            setInitError('Authentication failed');
        }
    };

    const initializePlayer = async () => {
        console.log('[SpotifyWidget] Initializing player...');
        setIsLoading(true);
        setInitError(null);
        try {
            console.log('[SpotifyWidget] Calling player.initialize()');
            const initialized = await player.initialize();
            console.log('[SpotifyWidget] player.initialize() result:', initialized);
            if (initialized) {
                setIsPlayerReady(true);
                // ... (listeners)
                player.onStateChange((state) => {
                    // ... (existing state update)
                    if (state) {
                        setPlayerState({
                            isPlaying: !state.paused,
                            trackName: state.track_window.current_track.name,
                            artistName: state.track_window.current_track.artists
                                .map((a) => a.name)
                                .join(', '),
                            albumArt: state.track_window.current_track.album.images[0]?.url || '',
                            position: state.position,
                            duration: state.duration,
                        });
                    }
                });

                await loadPlaylists();

                if (data?.selectedPlaylistUri) {
                    // Try to auto-play, but don't block
                    setTimeout(async () => {
                        try {
                            await player.play(data.selectedPlaylistUri);
                        } catch (err) {
                            console.warn('Auto-play failed (likely no active device):', err);
                        }
                    }, 1000);
                }
            } else {
                // This branch shouldn't really stay reached with the new logic, but safe to keep
                throw new Error('Player initialization returned false');
            }
        } catch (error) {
            console.error('Failed to initialize player:', error);
            // Even if it fails completely, we don't block the UI anymore, just log it
            setInitError(null);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPlaylists = async () => {
        console.log('[SpotifyWidget] Loading playlists...');
        try {
            const userPlaylists = await SpotifyAPI.getUserPlaylists(50);
            console.log('[SpotifyWidget] Fetched playlists:', userPlaylists?.length);
            setPlaylists(userPlaylists);
        } catch (error) {
            console.error('Failed to load playlists:', error);
        }
    };

    // ========================================================================
    // Playback Controls
    // ========================================================================

    const handlePlayPause = async () => {
        if (!isPlayerReady) return;

        if (playerState?.isPlaying) {
            await player.pause();
        } else {
            if (playerState) {
                await player.resume();
            } else if (data?.selectedPlaylistUri) {
                await player.play(data.selectedPlaylistUri);
            }
        }
    };

    const handleNext = async () => {
        if (!isPlayerReady) return;
        await player.nextTrack();
    };

    const handlePrevious = async () => {
        if (!isPlayerReady) return;
        await player.previousTrack();
    };

    const handlePlaylistSelect = async (playlistUri: string) => {
        // Allow even if player not "ready" in the local sense, as we might be in remote mode
        // if (!isPlayerReady) return; 

        try {
            // Save selection
            onUpdate?.({ selectedPlaylistUri: playlistUri });

            // Play playlist
            console.log('Attempting to play:', playlistUri);
            await player.play(playlistUri);

            // Close selector
            setShowPlaylistSelector(false);
        } catch (error) {
            console.error('Failed to play playlist:', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';

            if (msg.includes('No active Spotify device')) {
                alert('REMOTE MODE: Please open the Spotify app on your computer or phone to start playback. We will control it from here!');
            } else {
                alert('Playback failed: ' + msg);
            }
        }
    };



    // ... (Render States)

    // Error State
    if (initError) {
        return (
            <BaseWidget className="h-[450px] p-0 border-none bg-transparent !overflow-visible shadow-none">
                <div className="h-full w-full rounded-3xl overflow-hidden shadow-lg border border-red-500/30 relative bg-black/80">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="text-red-500 mb-4">
                            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-white font-bold mb-2">Player Error</h3>
                        <p className="text-slate-300 text-sm mb-6">{initError}</p>
                        <button
                            onClick={() => initializePlayer()}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </BaseWidget>
        );
    }

    // Loading player
    if (isLoading || (!isPlayerReady && isAuthenticated)) {
        return (
            <BaseWidget className="h-[450px] p-0 border-none bg-transparent !overflow-visible shadow-none">
                <div className="h-full w-full rounded-3xl overflow-hidden shadow-lg border border-white/20 relative bg-black/80">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                            <p className="text-white text-sm">Initializing Spotify Player...</p>
                        </div>
                    </div>
                </div>
            </BaseWidget>
        );
    }

    // Show playlist selector overlay
    if (showPlaylistSelector) {
        return (
            <BaseWidget className="h-[450px] p-0 border-none bg-transparent !overflow-visible shadow-none">
                <div className="h-full w-full rounded-3xl overflow-hidden shadow-lg border border-white/20 relative bg-black/90">
                    <div className="absolute inset-0 flex flex-col">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Select Playlist</h3>
                            <button
                                onClick={() => setShowPlaylistSelector(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {playlists.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <p>No playlists found.</p>
                                    <button
                                        onClick={loadPlaylists}
                                        className="mt-2 text-sm text-green-400 hover:text-green-300 underline"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            ) : (
                                playlists.map((playlist) => (
                                    <button
                                        key={playlist.id}
                                        onClick={() => handlePlaylistSelect(playlist.uri)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left group"
                                    >
                                        {playlist.images?.[0] ? (
                                            <img
                                                src={playlist.images[0].url}
                                                alt={playlist.name}
                                                className="w-12 h-12 rounded"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center">
                                                <List size={20} className="text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-medium truncate group-hover:text-green-400 transition-colors">
                                                {playlist.name}
                                            </div>
                                            <div className="text-slate-400 text-sm truncate">
                                                {playlist.tracks.total} tracks
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </BaseWidget>
        );
    }

    // Main player UI
    return (
        <BaseWidget className="min-h-[340px] p-0 border-none bg-transparent shadow-none">
            <div className="h-full w-full rounded-3xl overflow-hidden shadow-lg border border-white/20 relative bg-gradient-to-br from-purple-900/20 to-black/90 backdrop-blur-sm flex flex-col">
                {/* Album Art Background */}
                {playerState?.albumArt && (
                    <div
                        className="absolute inset-0 opacity-20 blur-3xl z-0"
                        style={{
                            backgroundImage: `url(${playerState.albumArt})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    />
                )}

                <div className="relative z-10 flex flex-col p-6 h-full">
                    {/* Album Art & Track Info Group */}
                    <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <div className="relative group">
                            {playerState?.albumArt ? (
                                <img
                                    src={playerState.albumArt}
                                    alt="Album Art"
                                    className="w-40 h-40 rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                            ) : (
                                <div className="w-40 h-40 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/10">
                                    <span className="text-slate-500 text-xs">No track</span>
                                </div>
                            )}
                        </div>

                        {/* Track Info */}
                        {playerState ? (
                            <div className="text-center w-full px-4">
                                <h3 className="text-white text-lg font-bold mb-1 truncate drop-shadow-md">
                                    {playerState.trackName}
                                </h3>
                                <p className="text-slate-300 text-sm truncate opacity-90">{playerState.artistName}</p>
                            </div>
                        ) : (
                            <div className="text-center w-full px-4">
                                <h3 className="text-white text-lg font-bold mb-1">Ready to Play</h3>
                                <p className="text-slate-400 text-sm">Select a playlist to start</p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-4 mt-4 shrink-0">
                        {/* Progress Bar (Visual Only for now) */}
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${playerState ? (playerState.position / playerState.duration) * 100 : 0}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <button
                                onClick={handlePrevious}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                            >
                                <SkipBack size={20} fill="currentColor" />
                            </button>

                            <button
                                onClick={handlePlayPause}
                                className="p-3 rounded-full bg-white hover:bg-green-400 hover:scale-105 transition-all shadow-lg shadow-green-900/20"
                            >
                                {playerState?.isPlaying ? (
                                    <Pause size={24} fill="black" className="text-black" />
                                ) : (
                                    <Play size={24} fill="black" className="text-black ml-1" />
                                )}
                            </button>

                            <button
                                onClick={handleNext}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
                            >
                                <SkipForward size={20} fill="currentColor" />
                            </button>
                        </div>

                        {/* Playlist Selector Button */}
                        <button
                            onClick={() => setShowPlaylistSelector(true)}
                            className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-white text-xs font-medium flex items-center justify-center gap-2"
                        >
                            <List size={14} />
                            <span>Library</span>
                        </button>
                    </div>
                </div>
            </div>
        </BaseWidget>
    );
}
