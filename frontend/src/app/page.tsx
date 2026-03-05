"use client";
import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import YouTubeInput from "@/components/YouTubeInput";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultsDashboard from "@/components/ResultsDashboard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AppState = "upload" | "processing" | "results";
type SourceMode = "file" | "youtube";

interface Results {
  transcript: string;
  reference_answer: string;
  similarity_percentage: number;
  feedback: string;
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [referenceAnswer, setReferenceAnswer] = useState("");
  const [processingStep, setProcessingStep] = useState(0);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setAppState("upload");
    setVideoFile(null);
    setYoutubeUrl("");
    setReferenceAnswer("");
    setProcessingStep(0);
    setResults(null);
    setError(null);
  }, []);

  const isYoutubeValid = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/.test(youtubeUrl.trim());

  const canSubmit =
    sourceMode === "file"
      ? !!videoFile && !!referenceAnswer.trim()
      : isYoutubeValid && !!referenceAnswer.trim();

  const handleEvaluate = async () => {
    if (sourceMode === "file" && !videoFile) { setError("Please select a video file."); return; }
    if (sourceMode === "youtube" && !isYoutubeValid) { setError("Please enter a valid YouTube URL."); return; }
    if (!referenceAnswer.trim()) { setError("Please enter a reference answer."); return; }

    setError(null);
    setAppState("processing");
    setProcessingStep(0);

    try {
      let transcript: string;

      if (sourceMode === "file") {
        // File upload flow
        const formData = new FormData();
        formData.append("video", videoFile!);

        await new Promise((r) => setTimeout(r, 400));
        setProcessingStep(1);

        const uploadRes = await fetch(`${API_BASE}/upload-video`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({ detail: "Upload failed." }));
          throw new Error(err.detail || "Video upload failed.");
        }

        setProcessingStep(2);
        await new Promise((r) => setTimeout(r, 300));
        const data = await uploadRes.json();
        transcript = data.transcript;

      } else {
        // YouTube download flow
        await new Promise((r) => setTimeout(r, 400));
        setProcessingStep(1);

        const ytRes = await fetch(`${API_BASE}/upload-youtube`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: youtubeUrl.trim() }),
        });

        if (!ytRes.ok) {
          const err = await ytRes.json().catch(() => ({ detail: "YouTube download failed." }));
          throw new Error(err.detail || "Failed to process YouTube video.");
        }

        setProcessingStep(2);
        await new Promise((r) => setTimeout(r, 300));
        const data = await ytRes.json();
        transcript = data.transcript;
      }

      setProcessingStep(3);
      const evalRes = await fetch(`${API_BASE}/evaluate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, reference_answer: referenceAnswer }),
      });

      if (!evalRes.ok) {
        const err = await evalRes.json().catch(() => ({ detail: "Evaluation failed." }));
        throw new Error(err.detail || "Evaluation failed.");
      }

      setProcessingStep(4);
      await new Promise((r) => setTimeout(r, 400));
      const evalData = await evalRes.json();

      setResults({
        transcript,
        reference_answer: referenceAnswer,
        similarity_percentage: evalData.similarity_percentage,
        feedback: evalData.feedback,
      });
      setAppState("results");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
      setAppState("upload");
    }
  };

  return (
    <div className="app-shell">
      <div className="bg-grid" />
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">V</div>
          <span>Viva<span className="logo-accent">AI</span></span>
        </div>
        <div className="nav-tag">Beta</div>
      </nav>

      {/* ── Content ── */}
      <div className="page-container">
        {/* ── UPLOAD STATE ── */}
        {appState === "upload" && (
          <>
            {/* Hero */}
            <section className="hero fade-in">
              <div className="hero-eyebrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                AI-Powered Semantic Evaluation
              </div>
              <h1 className="hero-title">
                Evaluate your explanation
                <br />
                <span className="gradient-text">with AI precision</span>
              </h1>
              <p className="hero-desc">
                Upload a video or paste a YouTube link, and our AI will transcribe
                your speech and measure how closely it matches the expected answer.
              </p>
            </section>

            {/* Steps */}
            <div className="steps-row fade-in fade-d1">
              <div className="step-item">
                <div className="step-item-icon" style={{ background: "var(--accent-muted)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </div>
                <p className="step-item-title">Upload</p>
                <p className="step-item-desc">Video file or YouTube link</p>
              </div>

              <div className="step-connector">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>

              <div className="step-item">
                <div className="step-item-icon" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <p className="step-item-title">Analyze</p>
                <p className="step-item-desc">AI transcribes & scores</p>
              </div>

              <div className="step-connector">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </div>

              <div className="step-item">
                <div className="step-item-icon" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                </div>
                <p className="step-item-title">Results</p>
                <p className="step-item-desc">Get score & feedback</p>
              </div>
            </div>

            {/* Main Form Card */}
            <div className="main-card fade-in fade-d2">
              <div className="main-card-inner">
                <div className="main-card-grid">
                  {/* Left: Source input */}
                  <div className="main-card-col">
                    {/* Tab toggle */}
                    <div className="source-tabs">
                      <button
                        className={`source-tab ${sourceMode === "file" ? "active" : ""}`}
                        onClick={() => setSourceMode("file")}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        Upload File
                      </button>
                      <button
                        className={`source-tab ${sourceMode === "youtube" ? "active" : ""}`}
                        onClick={() => setSourceMode("youtube")}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" fill="currentColor" opacity="0.6" />
                          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="var(--bg-base)" />
                        </svg>
                        YouTube Link
                      </button>
                    </div>

                    {/* Conditional source content */}
                    {sourceMode === "file" ? (
                      <UploadZone
                        onFileSelect={setVideoFile}
                        selectedFile={videoFile}
                        disabled={false}
                      />
                    ) : (
                      <YouTubeInput
                        youtubeUrl={youtubeUrl}
                        onUrlChange={setYoutubeUrl}
                        disabled={false}
                      />
                    )}
                  </div>

                  <div className="main-card-divider" />

                  {/* Right: Reference */}
                  <div className="main-card-col flex flex-col">
                    <div className="col-label">
                      <div className="col-label-dot" style={{ background: "var(--blue)" }} />
                      Reference Answer
                    </div>
                    <textarea
                      id="reference-input"
                      className="input-field flex-1"
                      rows={6}
                      placeholder="Paste the expected correct answer here…"
                      value={referenceAnswer}
                      onChange={(e) => setReferenceAnswer(e.target.value)}
                      style={{ minHeight: "200px" }}
                    />
                    <p className="input-hint">
                      The ideal answer your explanation will be evaluated against.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="error-alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  {error}
                </div>
              )}

              {/* Action bar */}
              <div className="action-bar">
                <button
                  id="evaluate-btn"
                  className="btn-primary"
                  onClick={handleEvaluate}
                  disabled={!canSubmit}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Evaluate Explanation
                </button>
              </div>
            </div>

            {/* Footer */}
            <footer className="footer">
              <div className="footer-links">
                <span>Whisper</span>
                <div className="footer-dot" />
                <span>Sentence Transformers</span>
                <div className="footer-dot" />
                <span>FastAPI</span>
                <div className="footer-dot" />
                <span>Next.js</span>
              </div>
              <span>© 2026 VivaAI</span>
            </footer>
          </>
        )}

        {/* ── PROCESSING ── */}
        {appState === "processing" && (
          <ProcessingScreen currentStep={processingStep} />
        )}

        {/* ── RESULTS ── */}
        {appState === "results" && results && (
          <ResultsDashboard results={results} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
