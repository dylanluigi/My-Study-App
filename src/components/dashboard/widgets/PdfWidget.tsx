import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileUp, X } from 'lucide-react';
import { BaseWidget } from '../BaseWidget';

// Worker setup for Vite
// Load from local public folder
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface PdfWidgetProps {
    data?: any;
    onUpdate?: (data: any) => void;
}

export function PdfWidget({ }: PdfWidgetProps) {
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create object URL when file changes
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setFileUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setFileUrl(null);
        }
    }, [file]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            setFile(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (e.dataTransfer.files[0].type === 'application/pdf') {
                setFile(e.dataTransfer.files[0]);
            }
        }
    };

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages));
    };

    const changeScale = (delta: number) => {
        setScale(prev => Math.min(Math.max(0.5, prev + delta), 2.0));
    };

    // Clean up object URL if we were using one, though here React-PDF handles File objects directly mostly.

    // Clear file
    const clearFile = () => {
        setFile(null);
        setNumPages(0);
        setPageNumber(1);
    };

    return (
        <BaseWidget className="min-h-[500px] h-auto p-0 overflow-hidden relative group/pdf"
            // Enable drop
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
            {!file ? (
                <div
                    className="h-[500px] w-full flex flex-col items-center justify-center p-8 text-slate-400 bg-white/40 hover:bg-white/50 transition-colors cursor-pointer border-2 border-dashed border-slate-300/50 hover:border-blue-400/50 rounded-3xl"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <div className="bg-white/60 p-4 rounded-full mb-4 shadow-sm">
                        <FileUp size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-1">Drop PDF here</h3>
                    <p className="text-sm">or click to browse</p>
                </div>
            ) : (
                <div className="min-h-full w-full relative bg-slate-50 flex flex-col transition-all">
                    {/* Toolbar Overhead (Close) */}
                    <button
                        onClick={clearFile}
                        className="absolute top-4 right-4 z-50 p-2 bg-slate-900/80 text-white rounded-full hover:bg-red-500 transition-colors shadow-lg opacity-0 group-hover/pdf:opacity-100"
                        title="Close PDF"
                    >
                        <X size={16} />
                    </button>

                    {/* PDF Viewer Container */}
                    <div className="flex justify-center p-4 pb-20" onWheel={(e) => { if (e.ctrlKey) { e.preventDefault(); changeScale(e.deltaY < 0 ? 0.1 : -0.1); } }}>
                        <Document
                            file={fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={(error) => console.error('Error loading PDF:', error)}
                            loading={<div className="flex items-center justify-center h-[400px] text-slate-400">Loading PDF...</div>}
                            error={<div className="flex items-center justify-center h-[400px] text-red-500">Failed to load PDF. Check console.</div>}
                            className="shadow-2xl"
                        >
                            <Page
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-lg rounded-sm"
                                canvasBackground="#ffffff"
                            />
                        </Document>
                    </div>

                    {/* Floating Navigation Bar */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                        <div className="flex items-center gap-2 px-2 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl text-white border border-white/10">
                            <button
                                onClick={() => changePage(-1)}
                                disabled={pageNumber <= 1}
                                className="p-2 hover:bg-white/20 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <span className="text-xs font-bold font-mono px-2 min-w-[3rem] text-center">
                                {pageNumber} / {numPages || '-'}
                            </span>

                            <button
                                onClick={() => changePage(1)}
                                disabled={pageNumber >= numPages}
                                className="p-2 hover:bg-white/20 rounded-xl disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>

                            <div className="w-px h-4 bg-white/20 mx-1" />

                            <button
                                onClick={() => changeScale(-0.1)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <ZoomOut size={16} />
                            </button>
                            <button
                                onClick={() => changeScale(0.1)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <ZoomIn size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </BaseWidget>
    );
}
