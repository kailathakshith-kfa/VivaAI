"use client";
import React, { useRef, useState } from "react";

interface Props {
    onFileSelect: (file: File) => void;
    selectedFile: File | null;
    disabled?: boolean;
}

const ACCEPT = ".mp4,.mov,.webm,.avi,video/mp4,video/quicktime,video/webm,video/x-msvideo";

export default function UploadZone({ onFileSelect, selectedFile, disabled }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith("video/")) onFileSelect(file);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div
            className={`upload-zone ${dragging ? "drag-over" : ""} ${disabled ? "opacity-40 pointer-events-none" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
        >
            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {selectedFile ? (
                <div className="file-selected">
                    <div className="upload-icon-wrap">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                    </div>
                    <div>
                        <p className="upload-title">{selectedFile.name}</p>
                        <p className="upload-subtitle">{formatSize(selectedFile.size)} · Click to change</p>
                    </div>
                    <span className="file-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        Ready
                    </span>
                </div>
            ) : (
                <>
                    <div className="upload-icon-wrap">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <p className="upload-title">
                        Drop your video here or <a onClick={(e) => e.stopPropagation()}>browse</a>
                    </p>
                    <p className="upload-subtitle">MP4, MOV, WEBM, AVI · Up to 500MB</p>
                </>
            )}
        </div>
    );
}
