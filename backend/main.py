import os
import shutil
import tempfile
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services import (
    extract_audio,
    transcribe_audio,
    compute_similarity,
    generate_feedback,
    get_youtube_transcript,
    is_youtube_url,
)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Pre-loading AI models...")
    from services.ai_models import _get_whisper_model, _get_embedding_model
    _get_whisper_model()
    _get_embedding_model()
    logger.info("Models loaded. Server ready.")
    yield

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Video Explanation Evaluator API",
    description="Transcribes video explanations and scores them against a reference answer.",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────
class EvaluateRequest(BaseModel):
    transcript: str
    reference_answer: str

class EvaluateResponse(BaseModel):
    similarity_score: float
    similarity_percentage: float
    feedback: str

class TranscriptResponse(BaseModel):
    transcript: str
    message: str

class YouTubeRequest(BaseModel):
    url: str

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Video Explanation Evaluator API is running."}


@app.post("/upload-video", response_model=TranscriptResponse)
async def upload_video(video: UploadFile = File(...)):
    """
    Accepts a video file, extracts its audio, and returns a transcript.
    """
    allowed_types = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"}
    if video.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {video.content_type}. Use mp4, mov, webm, or avi."
        )

    suffix = os.path.splitext(video.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_video:
        content = await video.read()
        tmp_video.write(content)
        video_path = tmp_video.name

    audio_path = None
    try:
        logger.info(f"Extracting audio from: {video_path}")
        audio_path = extract_audio(video_path)

        logger.info(f"Transcribing audio: {audio_path}")
        transcript = transcribe_audio(audio_path)

        if not transcript:
            raise HTTPException(status_code=422, detail="Could not extract speech from the video. Please check the audio.")

        return TranscriptResponse(
            transcript=transcript,
            message="Transcription successful."
        )

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)


@app.post("/upload-youtube", response_model=TranscriptResponse)
async def upload_youtube(payload: YouTubeRequest):
    """
    Accepts a YouTube URL, fetches the transcript from YouTube captions,
    and returns it. No video download or audio processing needed.
    """
    url = payload.url.strip()

    if not is_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.")

    try:
        logger.info(f"Fetching YouTube transcript: {url}")
        transcript = get_youtube_transcript(url)

        if not transcript:
            raise HTTPException(status_code=422, detail="Could not get transcript from the YouTube video.")

        return TranscriptResponse(
            transcript=transcript,
            message="YouTube transcript fetched successfully."
        )

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate-answer", response_model=EvaluateResponse)
async def evaluate_answer(payload: EvaluateRequest):
    """
    Computes semantic similarity between the transcript and reference answer,
    and generates evaluation feedback.
    """
    if not payload.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")
    if not payload.reference_answer.strip():
        raise HTTPException(status_code=400, detail="Reference answer cannot be empty.")

    logger.info("Computing similarity score…")
    score = compute_similarity(payload.transcript, payload.reference_answer)
    percentage = round(score * 100, 2)

    logger.info("Generating feedback…")
    feedback = generate_feedback(payload.transcript, payload.reference_answer, score)

    return EvaluateResponse(
        similarity_score=round(score, 4),
        similarity_percentage=percentage,
        feedback=feedback,
    )
