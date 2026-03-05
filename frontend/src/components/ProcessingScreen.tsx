"use client";
import { useEffect, useState } from "react";

interface Props {
    currentStep: number;
}

const STEPS = [
    { label: "Uploading video" },
    { label: "Extracting audio" },
    { label: "Transcribing speech" },
    { label: "Evaluating similarity" },
    { label: "Generating feedback" },
];

export default function ProcessingScreen({ currentStep }: Props) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setElapsed((p) => p + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const progress = Math.min(((currentStep + 1) / STEPS.length) * 100, 98);

    return (
        <div className="flex flex-col items-center gap-10 py-16 fade-in">
            {/* Spinner */}
            <div className="process-spinner" />

            {/* Title */}
            <div className="text-center">
                <p className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {STEPS[Math.min(currentStep, STEPS.length - 1)].label}
                    <span className="dot-pulse ml-2 inline-flex align-middle">
                        <span /><span /><span />
                    </span>
                </p>
                <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                    {elapsed}s elapsed
                </p>
            </div>

            {/* Progress */}
            <div className="w-full max-w-sm">
                <div className="flex justify-between text-[11px] mb-2 font-medium" style={{ color: "var(--text-muted)" }}>
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Steps */}
            <div className="w-full max-w-sm flex flex-col gap-1">
                {STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    return (
                        <div key={i} className={`process-step ${active ? "active" : ""} ${done ? "done" : ""}`}>
                            <div
                                className="process-step-num"
                                style={{
                                    background: done ? "rgba(34,197,94,0.1)" : active ? "var(--accent-muted)" : "rgba(255,255,255,0.03)",
                                    color: done ? "#4ade80" : active ? "var(--accent-hover)" : "var(--text-dim)",
                                    border: `1px solid ${done ? "rgba(34,197,94,0.2)" : active ? "rgba(139,92,246,0.2)" : "var(--border)"}`,
                                }}
                            >
                                {done ? "✓" : i + 1}
                            </div>
                            <span
                                className="process-step-label"
                                style={{ color: done ? "var(--text-secondary)" : active ? "var(--text-primary)" : "var(--text-dim)" }}
                            >
                                {step.label}
                            </span>
                            {active && <div className="dot-pulse"><span /><span /><span /></div>}
                            {done && <span className="text-[11px] font-medium" style={{ color: "#4ade80" }}>Done</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
