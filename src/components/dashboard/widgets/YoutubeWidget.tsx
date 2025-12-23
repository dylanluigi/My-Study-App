import { useState } from 'react';
import { Save, Link as LinkIcon } from 'lucide-react';
import { BaseWidget } from '../BaseWidget';

interface YoutubeWidgetProps {
    data?: {
        youtubeUrl?: string;
    };
    onUpdate?: (data: { youtubeUrl: string }) => void;
    isEditMode?: boolean;
}

export function YoutubeWidget({ data, onUpdate, isEditMode }: YoutubeWidgetProps) {
    const [inputUrl, setInputUrl] = useState(data?.youtubeUrl || '');

    const handleSaveUrl = () => {
        if (!inputUrl) return;

        let embedUrl = inputUrl;

        // Handle various YouTube URL formats
        try {
            const urlObj = new URL(inputUrl);
            const path = urlObj.pathname;
            const params = urlObj.searchParams;

            if (path === '/watch') {
                // https://www.youtube.com/watch?v=ID
                const v = params.get('v');
                if (v) embedUrl = `https://www.youtube.com/embed/${v}`;
            } else if (path.startsWith('/shorts/')) {
                // https://www.youtube.com/shorts/ID
                const id = path.split('/')[2];
                if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
            } else if (path === '/playlist') {
                // https://www.youtube.com/playlist?list=ID
                const list = params.get('list');
                if (list) embedUrl = `https://www.youtube.com/embed/videoseries?list=${list}`;
            } else if (urlObj.hostname === 'youtu.be') {
                // https://youtu.be/ID
                const id = path.slice(1);
                if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
            }
        } catch {
            // Fallback for simple ID paste or direct embed link
            if (!inputUrl.includes('http')) {
                embedUrl = `https://www.youtube.com/embed/${inputUrl}`;
            }
        }

        onUpdate?.({ youtubeUrl: embedUrl });
    };

    // Default to Lofi Girl
    const currentSrc = data?.youtubeUrl || "https://www.youtube.com/embed/jfKfPfyJRdk";

    return (
        <BaseWidget className="aspect-video p-0 border-none bg-transparent !overflow-visible shadow-none group/youtube">
            <div className="h-full w-full rounded-2xl overflow-hidden shadow-2xl relative bg-black">
                {isEditMode ? (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-6 text-center">
                        <div
                            className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 w-full max-w-xs shadow-2xl"
                            // Stop propagation for dnd-kit
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-white font-medium mb-3 flex items-center justify-center gap-2">
                                <LinkIcon size={16} className="text-red-500" />
                                Update YouTube
                            </h3>
                            <input
                                autoFocus
                                type="text"
                                value={inputUrl}
                                onChange={(e) => setInputUrl(e.target.value)}
                                placeholder="Paste YouTube Link or ID..."
                                className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 mb-3"
                            />
                            <button
                                onClick={handleSaveUrl}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Save size={14} />
                                Save Widget
                            </button>
                        </div>
                    </div>
                ) : null}

                <iframe
                    key={currentSrc}
                    width="100%"
                    height="100%"
                    src={currentSrc}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="relative z-10"
                />
            </div>
        </BaseWidget >
    );
}
