"use client";
import { useEffect, useState } from "react";

interface Props {
    score: number;
}

function getTheme(score: number) {
    if (score >= 80) return { color: "#22c55e", label: "Excellent", cls: "badge-green" };
    if (score >= 65) return { color: "#8b5cf6", label: "Good", cls: "badge-purple" };
    if (score >= 45) return { color: "#eab308", label: "Fair", cls: "badge-amber" };
    return { color: "#ef4444", label: "Needs Improvement", cls: "badge-red" };
}

export default function ScoreRing({ score }: Props) {
    const [val, setVal] = useState(0);
    const theme = getTheme(score);
    const R = 68;
    const C = 2 * Math.PI * R;
    const offset = C - (val / 100) * C;

    useEffect(() => {
        const t = setTimeout(() => setVal(score), 100);
        return () => clearTimeout(t);
    }, [score]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="score-ring-container">
                <svg className="score-ring-svg" viewBox="0 0 160 160">
                    <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={theme.color} />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
                    <circle className="score-ring-bg" cx="80" cy="80" r={R} />
                    <circle
                        className="score-ring-fill"
                        cx="80" cy="80" r={R}
                        strokeDasharray={C}
                        strokeDashoffset={offset}
                        stroke="url(#scoreGrad)"
                    />
                </svg>
                <div className="score-ring-text">
                    <span className="text-[36px] font-bold tabular-nums" style={{ color: theme.color, lineHeight: 1 }}>
                        {Math.round(val)}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>%</span>
                </div>
            </div>
            <span className={`badge ${theme.cls}`}>{theme.label}</span>
        </div>
    );
}
