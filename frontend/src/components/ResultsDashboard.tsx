"use client";
import ScoreRing from "./ScoreRing";

interface ResultsData {
    transcript: string;
    reference_answer: string;
    similarity_percentage: number;
    feedback: string;
}

interface Props {
    results: ResultsData;
    onReset: () => void;
}

function Card({
    title,
    iconBg,
    icon,
    children,
    delayClass = "",
}: {
    title: string;
    iconBg: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    delayClass?: string;
}) {
    return (
        <div className={`result-card fade-in ${delayClass}`}>
            <div className="result-card-header">
                <div className="result-card-icon" style={{ background: iconBg }}>
                    {icon}
                </div>
                <span className="result-card-title">{title}</span>
            </div>
            <div className="result-card-body">{children}</div>
        </div>
    );
}

export default function ResultsDashboard({ results, onReset }: Props) {
    const pct = Math.round(results.similarity_percentage);

    const formatFeedback = (text: string) =>
        text.split("\n\n").filter(Boolean).map((p, i) => (
            <p key={i} className="mb-2 last:mb-0">
                {p.replace(/\*\*(.*?)\*\*/g, "$1")}
            </p>
        ));

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="text-center fade-in">
                <span className="badge badge-green mb-4 inline-flex">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Analysis Complete
                </span>
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Evaluation Results</h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    How your explanation compares to the reference
                </p>
            </div>

            {/* Score */}
            <div className="main-card fade-in fade-d1">
                <div className="main-card-inner flex flex-col items-center gap-6">
                    <ScoreRing score={pct} />
                    <div className="w-full max-w-xs">
                        <div className="flex justify-between text-[11px] mb-1.5 font-medium" style={{ color: "var(--text-dim)" }}>
                            <span>0%</span>
                            <span style={{ color: "var(--text-secondary)" }}>{pct}% Match</span>
                            <span>100%</span>
                        </div>
                        <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pct}%`, transition: "width 1.5s cubic-bezier(0.4,0,0.2,1) 0.3s" }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card
                    title="Transcript"
                    iconBg="var(--accent-muted)"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>}
                    delayClass="fade-d2"
                >
                    <p>&ldquo;{results.transcript || "No transcript available."}&rdquo;</p>
                </Card>
                <Card
                    title="Reference Answer"
                    iconBg="rgba(59,130,246,0.1)"
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>}
                    delayClass="fade-d3"
                >
                    <p>&ldquo;{results.reference_answer}&rdquo;</p>
                </Card>
            </div>

            {/* Feedback */}
            <Card
                title="AI Feedback"
                iconBg="rgba(34,197,94,0.1)"
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" /><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></svg>}
                delayClass="fade-d4"
            >
                <div>{formatFeedback(results.feedback)}</div>
            </Card>

            {/* Actions */}
            <div className="flex justify-center pt-2 fade-in fade-d5">
                <button className="btn-secondary" onClick={onReset}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                    </svg>
                    Evaluate Another
                </button>
            </div>
        </div>
    );
}
