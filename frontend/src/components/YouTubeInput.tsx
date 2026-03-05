"use client";
import React, { useState } from "react";

interface Props {
    youtubeUrl: string;
    onUrlChange: (url: string) => void;
    disabled?: boolean;
}

export default function YouTubeInput({ youtubeUrl, onUrlChange, disabled }: Props) {
    const [focused, setFocused] = useState(false);

    const isValid = youtubeUrl.trim() === "" || /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/.test(youtubeUrl.trim());

    return (
        <div className={`${disabled ? "opacity-40 pointer-events-none" : ""}`}>
            <div
                className="upload-zone"
                style={{
                    padding: "32px 24px",
                    cursor: "default",
                    borderColor: focused ? "var(--accent)" : undefined,
                    boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.1)" : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* YouTube icon */}
                <div className="upload-icon-wrap" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.15)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="#ef4444" opacity="0.8" />
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" />
                    </svg>
                </div>

                <input
                    type="url"
                    className="input-field"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => onUrlChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{ textAlign: "center", marginTop: "12px" }}
                />

                <p className="upload-subtitle" style={{ marginTop: "8px" }}>
                    Paste a YouTube, YouTube Shorts, or youtu.be link
                </p>

                {youtubeUrl.trim() && !isValid && (
                    <p style={{ color: "#f87171", fontSize: "12px", marginTop: "6px" }}>
                        Please enter a valid YouTube URL
                    </p>
                )}

                {youtubeUrl.trim() && isValid && (
                    <span className="file-badge" style={{ marginTop: "8px" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        Valid URL
                    </span>
                )}
            </div>
        </div>
    );
}
