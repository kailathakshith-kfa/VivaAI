from faster_whisper import WhisperModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from functools import lru_cache

# ── Model singletons (loaded once on first call) ──────────────────────────────

@lru_cache(maxsize=1)
def _get_whisper_model():
    print("[AI] Loading Faster-Whisper model (base)...")
    # Using base model for better local accuracy
    model = WhisperModel("base", device="cpu", compute_type="int8")
    print("[AI] Whisper model loaded.")
    return model


@lru_cache(maxsize=1)
def _get_embedding_model():
    print("[AI] Loading SentenceTransformer model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("[AI] Embedding model loaded.")
    return model


# ── Transcription ─────────────────────────────────────────────────────────────

def transcribe_audio(audio_path: str) -> str:
    """
    Transcribes an audio file using Faster-Whisper (CTranslate2).
    Returns the transcribed text string.
    """
    model = _get_whisper_model()
    segments, _info = model.transcribe(audio_path, beam_size=5)
    text = " ".join(segment.text.strip() for segment in segments)
    return text.strip()


# ── Similarity ────────────────────────────────────────────────────────────────

def compute_similarity(transcript: str, reference: str) -> float:
    """
    Computes semantic cosine similarity between transcript and reference answer.
    Returns a float in [0, 1].
    """
    model = _get_embedding_model()
    embeddings = model.encode([transcript, reference])
    score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(np.clip(score, 0.0, 1.0))


# ── Feedback generation ───────────────────────────────────────────────────────

def generate_feedback(transcript: str, reference: str, score: float) -> str:
    """
    Generates human-readable feedback based on the similarity score.
    Uses rule-based analysis and keyword comparison for reliable offline feedback.
    """
    percentage = score * 100

    # Keyword overlap analysis
    transcript_words = set(transcript.lower().split())
    reference_words = set(reference.lower().split())
    # Filter out short filler words
    stopwords = {"the","a","an","is","are","was","were","be","been","being","have",
                 "has","had","do","does","did","will","would","could","should","may",
                 "might","shall","to","of","in","for","on","with","at","by","from",
                 "as","into","through","that","this","it","its","and","or","but","if",
                 "so","yet","not","no","nor","both","either","just"}
    ref_keywords = reference_words - stopwords
    transcript_keywords = transcript_words - stopwords

    matched = ref_keywords & transcript_keywords
    missing_keywords = ref_keywords - transcript_keywords
    coverage_ratio = len(matched) / len(ref_keywords) if ref_keywords else 0

    # Build feedback string
    if percentage >= 90:
        quality = "Excellent"
        summary = "Your explanation is comprehensive and closely matches the reference answer."
    elif percentage >= 75:
        quality = "Good"
        summary = "Your explanation covers the main concepts well."
    elif percentage >= 55:
        quality = "Fair"
        summary = "Your explanation captures some key ideas but misses important details."
    elif percentage >= 35:
        quality = "Needs Improvement"
        summary = "Your explanation touches on the topic but lacks significant depth."
    else:
        quality = "Poor"
        summary = "Your explanation significantly diverges from the expected answer."

    feedback = f"**{quality} ({percentage:.1f}%)** — {summary}\n\n"

    if matched:
        feedback += f"Key concepts covered: {', '.join(sorted(matched)[:8])}.\n\n"

    if missing_keywords:
        top_missing = sorted(missing_keywords)[:6]
        feedback += f"Consider including: {', '.join(top_missing)} to strengthen your explanation.\n\n"

    if coverage_ratio >= 0.8:
        feedback += "You covered a high proportion of the reference keywords — great depth!"
    elif coverage_ratio >= 0.5:
        feedback += "Aim to elaborate more on the core concepts for a stronger explanation."
    else:
        feedback += "Review the reference answer and focus on the key terms and definitions."

    return feedback
